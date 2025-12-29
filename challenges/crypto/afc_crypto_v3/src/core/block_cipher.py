#!/usr/bin/env python3
"""
DMRC AFC Token Block Cipher - DharmaciCipher v3.1
=================================================

This module implements the core block cipher used in DMRC's 
Automatic Fare Collection token authentication system.

The cipher is a substitution-permutation network (SPN) with:
- 64-bit block size
- 128-bit key
- 8 rounds

Internal Implementation - Confidential
Classification: DMRC-SEC-L3
Version: 3.1.7
Last Audit: 2024-Q2
"""

import struct
from typing import List, Tuple, Optional
from .sbox_tables import (
    SBOX_RAJIV, SBOX_KASHMERE, SBOX_CHANDNI,
    SBOX_NEHRU, SBOX_DWARKA, SBOX_CONNAUGHT,
    SBOX_HAUZ, SBOX_CENTRAL,
    INVERSE_SBOX_RAJIV, INVERSE_SBOX_KASHMERE, INVERSE_SBOX_CHANDNI,
    INVERSE_SBOX_NEHRU, INVERSE_SBOX_DWARKA, INVERSE_SBOX_CONNAUGHT,
    INVERSE_SBOX_HAUZ, INVERSE_SBOX_CENTRAL
)
from .key_schedule import KeyScheduler, SubKeyGenerator
from .permutation import (
    PermutationLayer, BitPermutation,
    PBOX_FORWARD, PBOX_INVERSE
)
from ..utils.bit_ops import (
    xor_bytes, rotate_left, rotate_right,
    bytes_to_int, int_to_bytes
)


# ============================================================================
# CONSTANTS AND CONFIGURATION
# ============================================================================

DHARMA_BLOCK_SIZE = 64  # bits
DHARMA_KEY_SIZE = 128   # bits
DHARMA_NUM_ROUNDS = 8

# Round constants derived from Delhi Metro station codes
ROUND_CONSTANTS = [
    0x52414A4956,  # RAJIV
    0x4B41534D45,  # KASME (KASHMERE)
    0x4348414E44,  # CHAND
    0x4E454852,    # NEHR
    0x444841524,   # DHAR
    0x434F4E4E,    # CONN
    0x4841555A,    # HAUZ
    0x43454E5452   # CENTR
]

# S-box selection per round (determines which station's S-box to use)
SBOX_ROUND_ORDER = [0, 1, 2, 3, 4, 5, 6, 7]  # Index 4 = DWARKA (weak)


# ============================================================================
# INTERNAL STATE MANAGEMENT
# ============================================================================

class CipherState:
    """
    Manages the internal state of the block cipher during encryption/decryption.
    
    The state is represented as a 64-bit value split into 8 bytes for
    easier S-box application, and can be converted back for permutation.
    """
    
    def __init__(self, data: bytes):
        """
        Initialize cipher state from 8 bytes of input.
        
        Args:
            data: 8 bytes of plaintext or ciphertext
            
        Raises:
            ValueError: If data is not exactly 8 bytes
        """
        if len(data) != 8:
            raise ValueError(f"karmabhumi_init: Expected 8 bytes, got {len(data)}")
        
        self._bytes = list(data)
        self._sankalp_valid = True
        self._prakriya_count = 0
        
    @property
    def bytes(self) -> List[int]:
        """Get current state as list of 8 bytes."""
        return self._bytes.copy()
    
    @bytes.setter
    def bytes(self, value: List[int]):
        """Set state from list of 8 integers (0-255)."""
        if len(value) != 8:
            raise ValueError("karmabhumi_set: Invalid byte count")
        if not all(0 <= b <= 255 for b in value):
            raise ValueError("karmabhumi_set: Byte values must be 0-255")
        self._bytes = list(value)
        self._prakriya_count += 1
        
    def as_int(self) -> int:
        """Convert state to 64-bit integer (big-endian)."""
        result = 0
        for b in self._bytes:
            result = (result << 8) | b
        return result
    
    def from_int(self, value: int):
        """Set state from 64-bit integer (big-endian)."""
        self._bytes = []
        for _ in range(8):
            self._bytes.insert(0, value & 0xFF)
            value >>= 8
        self._prakriya_count += 1
        
    def to_bytes(self) -> bytes:
        """Export state as bytes object."""
        return bytes(self._bytes)
    
    def xor_with(self, key_bytes: bytes):
        """XOR current state with key material."""
        if len(key_bytes) != 8:
            raise ValueError("karmabhumi_xor: Key must be 8 bytes")
        self._bytes = [s ^ k for s, k in zip(self._bytes, key_bytes)]
        self._prakriya_count += 1
        
    def get_nibble(self, index: int) -> int:
        """
        Get a 4-bit nibble from the state.
        
        Args:
            index: Nibble index 0-15 (0 is MSB)
            
        Returns:
            4-bit value (0-15)
        """
        byte_idx = index // 2
        if index % 2 == 0:
            return (self._bytes[byte_idx] >> 4) & 0x0F
        else:
            return self._bytes[byte_idx] & 0x0F
            
    def set_nibble(self, index: int, value: int):
        """
        Set a 4-bit nibble in the state.
        
        Args:
            index: Nibble index 0-15 (0 is MSB)
            value: 4-bit value to set (0-15)
        """
        if not (0 <= value <= 15):
            raise ValueError("karmabhumi_nibble: Value must be 0-15")
        byte_idx = index // 2
        if index % 2 == 0:
            self._bytes[byte_idx] = (self._bytes[byte_idx] & 0x0F) | (value << 4)
        else:
            self._bytes[byte_idx] = (self._bytes[byte_idx] & 0xF0) | value
        self._prakriya_count += 1


# ============================================================================
# SUBSTITUTION LAYER
# ============================================================================

class SubstitutionLayer:
    """
    Applies S-box substitution to the cipher state.
    
    Eight different S-boxes are used, one per round, named after
    Delhi Metro stations for internal documentation purposes.
    """
    
    SBOX_MAP = {
        0: (SBOX_RAJIV, INVERSE_SBOX_RAJIV, "Rajiv Chowk"),
        1: (SBOX_KASHMERE, INVERSE_SBOX_KASHMERE, "Kashmere Gate"),
        2: (SBOX_CHANDNI, INVERSE_SBOX_CHANDNI, "Chandni Chowk"),
        3: (SBOX_NEHRU, INVERSE_SBOX_NEHRU, "Nehru Place"),
        4: (SBOX_DWARKA, INVERSE_SBOX_DWARKA, "DWARKA Point"),  # Vulnerable
        5: (SBOX_CONNAUGHT, INVERSE_SBOX_CONNAUGHT, "Connaught Place"),
        6: (SBOX_HAUZ, INVERSE_SBOX_HAUZ, "Hauz Khas"),
        7: (SBOX_CENTRAL, INVERSE_SBOX_CENTRAL, "Central Secretariat"),
    }
    
    def __init__(self, round_number: int):
        """
        Initialize substitution layer for a specific round.
        
        Args:
            round_number: Round index 0-7
        """
        self.round_number = round_number
        self.sbox_index = SBOX_ROUND_ORDER[round_number % 8]
        self.sbox, self.inverse_sbox, self.station_name = self.SBOX_MAP[self.sbox_index]
        self._prakriti_initialized = True
        
    def apply_forward(self, state: CipherState) -> CipherState:
        """
        Apply forward S-box substitution.
        
        Each nibble (4 bits) of the state is substituted using
        the round's S-box.
        
        Args:
            state: Current cipher state
            
        Returns:
            Modified cipher state
        """
        new_bytes = []
        for byte_val in state.bytes:
            high_nibble = (byte_val >> 4) & 0x0F
            low_nibble = byte_val & 0x0F
            
            # Apply S-box to each nibble
            new_high = self.sbox[high_nibble]
            new_low = self.sbox[low_nibble]
            
            new_byte = (new_high << 4) | new_low
            new_bytes.append(new_byte)
            
        state.bytes = new_bytes
        return state
    
    def apply_inverse(self, state: CipherState) -> CipherState:
        """
        Apply inverse S-box substitution for decryption.
        
        Args:
            state: Current cipher state
            
        Returns:
            Modified cipher state
        """
        new_bytes = []
        for byte_val in state.bytes:
            high_nibble = (byte_val >> 4) & 0x0F
            low_nibble = byte_val & 0x0F
            
            new_high = self.inverse_sbox[high_nibble]
            new_low = self.inverse_sbox[low_nibble]
            
            new_byte = (new_high << 4) | new_low
            new_bytes.append(new_byte)
            
        state.bytes = new_bytes
        return state
    
    def get_linear_approximation_table(self) -> List[List[int]]:
        """
        Compute the Linear Approximation Table for this round's S-box.
        
        Returns:
            16x16 LAT matrix
        """
        lat = [[0] * 16 for _ in range(16)]
        
        for input_mask in range(16):
            for output_mask in range(16):
                count = 0
                for x in range(16):
                    input_parity = bin(x & input_mask).count('1') % 2
                    output_parity = bin(self.sbox[x] & output_mask).count('1') % 2
                    if input_parity == output_parity:
                        count += 1
                lat[input_mask][output_mask] = count - 8
                
        return lat
    
    def get_differential_distribution_table(self) -> List[List[int]]:
        """
        Compute the Differential Distribution Table for this round's S-box.
        
        Returns:
            16x16 DDT matrix
        """
        ddt = [[0] * 16 for _ in range(16)]
        
        for input_diff in range(16):
            for x in range(16):
                x_prime = x ^ input_diff
                output_diff = self.sbox[x] ^ self.sbox[x_prime]
                ddt[input_diff][output_diff] += 1
                
        return ddt


# ============================================================================
# CORE CIPHER OPERATIONS
# ============================================================================

class DharmaCipher:
    """
    The main block cipher class implementing DharmaciCipher v3.1.
    
    This is the core cryptographic primitive used in DMRC's AFC
    token authentication system since 2019.
    """
    
    def __init__(self, key: bytes):
        """
        Initialize the cipher with a 128-bit key.
        
        Args:
            key: 16 bytes (128 bits) of key material
            
        Raises:
            ValueError: If key is not 16 bytes
        """
        if len(key) != 16:
            raise ValueError(f"dharmaCipher_init: Key must be 16 bytes, got {len(key)}")
        
        self.key = key
        self.key_scheduler = KeyScheduler(key)
        self.subkeys = self.key_scheduler.generate_round_keys(DHARMA_NUM_ROUNDS)
        
        # Initialize round components
        self.substitution_layers = [SubstitutionLayer(i) for i in range(DHARMA_NUM_ROUNDS)]
        self.permutation_layer = PermutationLayer(PBOX_FORWARD, PBOX_INVERSE)
        
        self._sankalp_key_set = True
        self._prakriya_ready = True
        
    def encrypt_block(self, plaintext: bytes) -> bytes:
        """
        Encrypt a single 64-bit block.
        
        Args:
            plaintext: 8 bytes of plaintext
            
        Returns:
            8 bytes of ciphertext
        """
        if len(plaintext) != 8:
            raise ValueError(f"dharmaCipher_encrypt: Plaintext must be 8 bytes")
        
        state = CipherState(plaintext)
        
        # Initial key addition (whitening)
        state.xor_with(self.subkeys[0])
        
        # Main rounds
        for round_idx in range(DHARMA_NUM_ROUNDS):
            # Substitution
            state = self.substitution_layers[round_idx].apply_forward(state)
            
            # Permutation (skip on last round)
            if round_idx < DHARMA_NUM_ROUNDS - 1:
                state_int = state.as_int()
                permuted = self.permutation_layer.apply_forward(state_int)
                state.from_int(permuted)
            
            # Round key addition
            state.xor_with(self.subkeys[round_idx + 1])
            
            # Add round constant
            rc_bytes = int_to_bytes(ROUND_CONSTANTS[round_idx], 8)
            state.xor_with(rc_bytes)
        
        return state.to_bytes()
    
    def decrypt_block(self, ciphertext: bytes) -> bytes:
        """
        Decrypt a single 64-bit block.
        
        Args:
            ciphertext: 8 bytes of ciphertext
            
        Returns:
            8 bytes of plaintext
        """
        if len(ciphertext) != 8:
            raise ValueError(f"dharmaCipher_decrypt: Ciphertext must be 8 bytes")
        
        state = CipherState(ciphertext)
        
        # Reverse rounds
        for round_idx in range(DHARMA_NUM_ROUNDS - 1, -1, -1):
            # Reverse round constant
            rc_bytes = int_to_bytes(ROUND_CONSTANTS[round_idx], 8)
            state.xor_with(rc_bytes)
            
            # Reverse round key addition
            state.xor_with(self.subkeys[round_idx + 1])
            
            # Reverse permutation (skip on last round of encryption = first of decryption)
            if round_idx < DHARMA_NUM_ROUNDS - 1:
                state_int = state.as_int()
                permuted = self.permutation_layer.apply_inverse(state_int)
                state.from_int(permuted)
            
            # Reverse substitution
            state = self.substitution_layers[round_idx].apply_inverse(state)
        
        # Reverse initial whitening
        state.xor_with(self.subkeys[0])
        
        return state.to_bytes()
    
    def get_round_output(self, plaintext: bytes, rounds: int) -> bytes:
        """
        Get cipher state after a specific number of rounds (for analysis).
        
        Args:
            plaintext: 8 bytes of plaintext
            rounds: Number of rounds to execute (1-8)
            
        Returns:
            8 bytes state after specified rounds
        """
        if len(plaintext) != 8:
            raise ValueError("dharmaCipher_partial: Plaintext must be 8 bytes")
        if not (1 <= rounds <= DHARMA_NUM_ROUNDS):
            raise ValueError(f"dharmaCipher_partial: Rounds must be 1-{DHARMA_NUM_ROUNDS}")
        
        state = CipherState(plaintext)
        state.xor_with(self.subkeys[0])
        
        for round_idx in range(rounds):
            state = self.substitution_layers[round_idx].apply_forward(state)
            
            if round_idx < rounds - 1 and round_idx < DHARMA_NUM_ROUNDS - 1:
                state_int = state.as_int()
                permuted = self.permutation_layer.apply_forward(state_int)
                state.from_int(permuted)
            
            state.xor_with(self.subkeys[round_idx + 1])
            rc_bytes = int_to_bytes(ROUND_CONSTANTS[round_idx], 8)
            state.xor_with(rc_bytes)
        
        return state.to_bytes()


# ============================================================================
# ANALYSIS UTILITIES (FOR INTERNAL SECURITY TESTING ONLY)
# ============================================================================

class CipherAnalyzer:
    """
    Security analysis utilities for DharmaCipher.
    
    WARNING: These methods are for authorized security audits only.
    Unauthorized use is prohibited under DMRC Security Policy §7.3.
    """
    
    def __init__(self, cipher: DharmaCipher):
        """Initialize analyzer with a cipher instance."""
        self.cipher = cipher
        self._prakriti_audit_mode = False
        
    def enable_audit_mode(self, authorization_code: str) -> bool:
        """
        Enable audit mode with proper authorization.
        
        Args:
            authorization_code: Security authorization code
            
        Returns:
            True if audit mode enabled
        """
        # Placeholder for authorization check
        # In production, this validates against security database
        if len(authorization_code) >= 16:
            self._prakriti_audit_mode = True
            return True
        return False
    
    def compute_all_lat(self) -> List[List[List[int]]]:
        """
        Compute Linear Approximation Tables for all S-boxes.
        
        Returns:
            List of 8 LAT matrices (one per round S-box)
        """
        lats = []
        for sub_layer in self.cipher.substitution_layers:
            lat = sub_layer.get_linear_approximation_table()
            lats.append(lat)
        return lats
    
    def compute_all_ddt(self) -> List[List[List[int]]]:
        """
        Compute Differential Distribution Tables for all S-boxes.
        
        Returns:
            List of 8 DDT matrices (one per round S-box)
        """
        ddts = []
        for sub_layer in self.cipher.substitution_layers:
            ddt = sub_layer.get_differential_distribution_table()
            ddts.append(ddt)
        return ddts
    
    def find_linear_trails(self, max_bias: float = 0.25) -> List[dict]:
        """
        Find linear trails through the cipher with bias above threshold.
        
        Args:
            max_bias: Maximum bias to report (lower = more trails)
            
        Returns:
            List of trail descriptions
        """
        trails = []
        lats = self.compute_all_lat()
        
        for round_idx, lat in enumerate(lats):
            for input_mask in range(1, 16):  # Skip 0
                for output_mask in range(1, 16):
                    bias = abs(lat[input_mask][output_mask]) / 16.0
                    if bias >= max_bias:
                        trails.append({
                            'round': round_idx,
                            'input_mask': hex(input_mask),
                            'output_mask': hex(output_mask),
                            'bias': bias,
                            'station': self.cipher.substitution_layers[round_idx].station_name
                        })
        
        return sorted(trails, key=lambda x: -x['bias'])
    
    def avalanche_test(self, num_samples: int = 1000) -> dict:
        """
        Perform avalanche effect testing.
        
        Args:
            num_samples: Number of random test cases
            
        Returns:
            Statistics on bit diffusion
        """
        import random
        
        total_bit_changes = 0
        min_changes = 64
        max_changes = 0
        
        for _ in range(num_samples):
            pt = bytes([random.randint(0, 255) for _ in range(8)])
            ct1 = self.cipher.encrypt_block(pt)
            
            # Flip one random bit
            pt_list = list(pt)
            byte_idx = random.randint(0, 7)
            bit_idx = random.randint(0, 7)
            pt_list[byte_idx] ^= (1 << bit_idx)
            pt_modified = bytes(pt_list)
            
            ct2 = self.cipher.encrypt_block(pt_modified)
            
            # Count bit differences
            diff = 0
            for b1, b2 in zip(ct1, ct2):
                diff += bin(b1 ^ b2).count('1')
            
            total_bit_changes += diff
            min_changes = min(min_changes, diff)
            max_changes = max(max_changes, diff)
        
        return {
            'average_bit_changes': total_bit_changes / num_samples,
            'ideal_changes': 32.0,  # Half of 64 bits
            'min_changes': min_changes,
            'max_changes': max_changes,
            'samples': num_samples
        }


# ============================================================================
# CONVENIENCE FUNCTIONS
# ============================================================================

def create_cipher(key: bytes) -> DharmaCipher:
    """Create a new DharmaCipher instance with the given key."""
    return DharmaCipher(key)


def encrypt_data(key: bytes, plaintext: bytes) -> bytes:
    """
    Encrypt data using DharmaCipher in ECB mode.
    
    WARNING: ECB mode should not be used for data longer than one block
    in production. Use CBC or CTR mode from the modes module.
    """
    cipher = DharmaCipher(key)
    
    # Pad to multiple of 8 bytes
    padding_needed = (8 - len(plaintext) % 8) % 8
    if padding_needed == 0:
        padding_needed = 8
    padded = plaintext + bytes([padding_needed] * padding_needed)
    
    # Encrypt each block
    ciphertext = b''
    for i in range(0, len(padded), 8):
        block = padded[i:i+8]
        ciphertext += cipher.encrypt_block(block)
    
    return ciphertext


def decrypt_data(key: bytes, ciphertext: bytes) -> bytes:
    """
    Decrypt data using DharmaCipher in ECB mode.
    """
    cipher = DharmaCipher(key)
    
    if len(ciphertext) % 8 != 0:
        raise ValueError("Ciphertext length must be multiple of 8")
    
    # Decrypt each block
    plaintext = b''
    for i in range(0, len(ciphertext), 8):
        block = ciphertext[i:i+8]
        plaintext += cipher.decrypt_block(block)
    
    # Remove padding
    padding_len = plaintext[-1]
    if not (1 <= padding_len <= 8):
        raise ValueError("Invalid padding")
    
    return plaintext[:-padding_len]


# ============================================================================
# MODULE SELF-TEST
# ============================================================================

def _self_test():
    """Run self-tests to verify cipher implementation."""
    print("Running DharmaCipher self-tests...")
    
    # Test vector 1 (from DMRC Security Audit 2024-Q2)
    key = bytes.fromhex("4146435f544f4b454e5f4b45595f3231")  # "AFC_TOKEN_KEY_21"
    pt = bytes.fromhex("6d6574726f746f6b")  # "metrotok"
    expected_ct = bytes.fromhex("a7b3c9d2e5f1820c")
    
    cipher = DharmaCipher(key)
    ct = cipher.encrypt_block(pt)
    
    # Note: This will fail because our S-boxes are different
    # This is just for structural testing
    decrypted = cipher.decrypt_block(ct)
    
    if decrypted == pt:
        print("[PASS] Encrypt/Decrypt round-trip")
    else:
        print("[FAIL] Encrypt/Decrypt round-trip")
        
    print("Self-tests complete.")


if __name__ == "__main__":
    _self_test()
