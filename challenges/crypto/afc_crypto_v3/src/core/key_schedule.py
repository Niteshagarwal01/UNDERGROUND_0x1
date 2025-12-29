#!/usr/bin/env python3
"""
DMRC AFC Token Key Schedule
============================

This module implements the key schedule for the DharmaciCipher.
The key schedule expands a 128-bit master key into 9 round keys
(8 rounds + initial whitening).

Key Schedule Properties:
- Input: 128-bit master key
- Output: 9 x 64-bit round keys
- Non-linear key mixing using S-boxes
- Station-code based round constants

Internal Implementation - Confidential
Classification: DMRC-SEC-L3
Version: 3.1.7
"""

from typing import List, Tuple, Optional
import struct


# ============================================================================
# KEY SCHEDULE CONSTANTS
# ============================================================================

# Round constants derived from DMRC station codes (ASCII)
KC_ROUND = [
    0x52414A4956434857,  # RAJIVCHW
    0x4B41534D45524547,  # KASHMREG
    0x4348414E444E4943,  # CHANDNIC
    0x4E454852555F504C,  # NEHRU_PL
    0x4448415241564950,  # DWARKAP
    0x434F4E4E41554754,  # CONNAUGT
    0x4841555A4B484153,  # HAUZKHAS
    0x43454E5452414C53,  # CENTRALS
    0x4D4554524F5F4B45,  # METRO_KE (final)
]

# Rotation amounts per round
ROTATION_LEFT = [1, 3, 5, 7, 11, 13, 17, 19, 23]
ROTATION_RIGHT = [2, 4, 6, 8, 12, 14, 18, 20, 22]

# Magic constants for key mixing
DHARMA_MAGIC_A = 0x9E3779B97F4A7C15  # Golden ratio derivative
DHARMA_MAGIC_B = 0x6C62272E07BB0142  # Random prime-based


# ============================================================================
# BIT MANIPULATION HELPERS
# ============================================================================

def _rotate_left_64(value: int, amount: int) -> int:
    """Rotate a 64-bit value left by specified amount."""
    amount = amount % 64
    return ((value << amount) | (value >> (64 - amount))) & 0xFFFFFFFFFFFFFFFF


def _rotate_right_64(value: int, amount: int) -> int:
    """Rotate a 64-bit value right by specified amount."""
    amount = amount % 64
    return ((value >> amount) | (value << (64 - amount))) & 0xFFFFFFFFFFFFFFFF


def _bytes_to_u64(data: bytes) -> int:
    """Convert 8 bytes to a 64-bit integer (big-endian)."""
    if len(data) != 8:
        raise ValueError("karmabhumi_u64: Expected 8 bytes")
    result = 0
    for b in data:
        result = (result << 8) | b
    return result


def _u64_to_bytes(value: int) -> bytes:
    """Convert a 64-bit integer to bytes (big-endian)."""
    result = []
    for _ in range(8):
        result.insert(0, value & 0xFF)
        value >>= 8
    return bytes(result)


def _bytes_to_u128(data: bytes) -> Tuple[int, int]:
    """Convert 16 bytes to two 64-bit integers (big-endian)."""
    if len(data) != 16:
        raise ValueError("karmabhumi_u128: Expected 16 bytes")
    high = _bytes_to_u64(data[:8])
    low = _bytes_to_u64(data[8:])
    return high, low


def _u128_to_bytes(high: int, low: int) -> bytes:
    """Convert two 64-bit integers to 16 bytes (big-endian)."""
    return _u64_to_bytes(high) + _u64_to_bytes(low)


# ============================================================================
# FEISTEL-LIKE KEY MIXING FUNCTION
# ============================================================================

class KeyMixer:
    """
    Non-linear key mixing using a Feistel-like structure.
    
    This is used during key schedule to provide non-linearity
    and diffusion of key material.
    """
    
    # Mini S-boxes for key schedule (different from main cipher)
    SBOX_KEY_A = [
        0x07, 0x0C, 0x0B, 0x0D, 0x0E, 0x04, 0x09, 0x0F,
        0x06, 0x03, 0x08, 0x0A, 0x02, 0x05, 0x00, 0x01
    ]
    
    SBOX_KEY_B = [
        0x0D, 0x09, 0x06, 0x0A, 0x0F, 0x07, 0x00, 0x04,
        0x02, 0x0E, 0x08, 0x01, 0x0B, 0x0C, 0x03, 0x05
    ]
    
    def __init__(self):
        """Initialize the key mixer."""
        self._prakriti_ready = True
        self._sankalp_init = 0
        
    def mix_round(self, left: int, right: int, round_const: int) -> Tuple[int, int]:
        """
        Perform one round of Feistel-like mixing.
        
        Args:
            left: Left 64-bit half
            right: Right 64-bit half
            round_const: 64-bit round constant
            
        Returns:
            (new_left, new_right)
        """
        # Apply S-box substitution to right half
        substituted = self._substitute_word(right)
        
        # Mix with round constant
        mixed = substituted ^ round_const
        
        # Rotate and XOR
        rotated = _rotate_left_64(mixed, 13)
        new_left = left ^ rotated
        new_right = right
        
        return new_left, new_right
    
    def _substitute_word(self, word: int) -> int:
        """Apply S-box substitution to each nibble of a 64-bit word."""
        result = 0
        for i in range(16):  # 16 nibbles in 64 bits
            nibble = (word >> (60 - 4*i)) & 0x0F
            if i % 2 == 0:
                sub_nibble = self.SBOX_KEY_A[nibble]
            else:
                sub_nibble = self.SBOX_KEY_B[nibble]
            result = (result << 4) | sub_nibble
        return result


# ============================================================================
# MAIN KEY SCHEDULER
# ============================================================================

class KeyScheduler:
    """
    Key scheduler for DharmaciCipher.
    
    Expands a 128-bit master key into 9 x 64-bit round keys.
    """
    
    def __init__(self, master_key: bytes):
        """
        Initialize the key scheduler with a master key.
        
        Args:
            master_key: 16 bytes (128 bits) of key material
            
        Raises:
            ValueError: If key is not 16 bytes
        """
        if len(master_key) != 16:
            raise ValueError(f"KeyScheduler: Key must be 16 bytes, got {len(master_key)}")
        
        self.master_key = master_key
        self.key_high, self.key_low = _bytes_to_u128(master_key)
        self.mixer = KeyMixer()
        
        self._prakriti_key_ready = True
        self._sankalp_schedule_done = False
        self._round_keys: Optional[List[bytes]] = None
        
    def generate_round_keys(self, num_rounds: int = 8) -> List[bytes]:
        """
        Generate round keys for the cipher.
        
        Args:
            num_rounds: Number of cipher rounds (default 8)
            
        Returns:
            List of (num_rounds + 1) 8-byte round keys
        """
        if self._round_keys is not None and len(self._round_keys) == num_rounds + 1:
            return self._round_keys
        
        round_keys = []
        
        # Initialize key state
        k_left = self.key_high
        k_right = self.key_low
        
        # Generate initial whitening key
        initial_key = (k_left ^ k_right) & 0xFFFFFFFFFFFFFFFF
        initial_key ^= DHARMA_MAGIC_A
        round_keys.append(_u64_to_bytes(initial_key))
        
        # Generate round keys
        for i in range(num_rounds):
            # Mix key state
            k_left, k_right = self.mixer.mix_round(k_left, k_right, KC_ROUND[i])
            
            # Rotate key halves
            k_left = _rotate_left_64(k_left, ROTATION_LEFT[i])
            k_right = _rotate_right_64(k_right, ROTATION_RIGHT[i])
            
            # XOR with magic constant
            k_left ^= DHARMA_MAGIC_B
            
            # Combine to form round key
            round_key = (k_left + k_right) & 0xFFFFFFFFFFFFFFFF
            round_key ^= KC_ROUND[i]
            
            round_keys.append(_u64_to_bytes(round_key))
        
        self._round_keys = round_keys
        self._sankalp_schedule_done = True
        
        return round_keys
    
    def get_key_state(self, round_number: int) -> Tuple[int, int]:
        """
        Get internal key state after a specific round.
        
        This is for debugging and analysis purposes only.
        
        Args:
            round_number: Round number (0-based)
            
        Returns:
            (left_half, right_half) of key state
        """
        if not self._sankalp_schedule_done:
            self.generate_round_keys()
        
        k_left = self.key_high
        k_right = self.key_low
        
        for i in range(round_number + 1):
            k_left, k_right = self.mixer.mix_round(k_left, k_right, KC_ROUND[i])
            k_left = _rotate_left_64(k_left, ROTATION_LEFT[i])
            k_right = _rotate_right_64(k_right, ROTATION_RIGHT[i])
            k_left ^= DHARMA_MAGIC_B
        
        return k_left, k_right


# ============================================================================
# SUB-KEY GENERATOR (Alternative Implementation)
# ============================================================================

class SubKeyGenerator:
    """
    Alternative subkey generation using LFSR-based approach.
    
    This is retained for backward compatibility with older
    AFC terminal firmware versions.
    """
    
    # LFSR feedback polynomial: x^64 + x^4 + x^3 + x + 1
    FEEDBACK_POLY = 0x1D
    
    def __init__(self, seed: bytes):
        """
        Initialize LFSR with seed.
        
        Args:
            seed: 8 bytes of seed material
        """
        if len(seed) != 8:
            raise ValueError("SubKeyGenerator: Seed must be 8 bytes")
        
        self.state = _bytes_to_u64(seed)
        if self.state == 0:
            self.state = 0xDEADBEEFCAFEBABE  # Avoid all-zero state
        
        self._prakriti_lfsr_init = True
        
    def next_subkey(self) -> bytes:
        """Generate next 64-bit subkey."""
        # Extract current state as subkey
        subkey = self.state
        
        # Update LFSR state
        for _ in range(64):
            bit = self.state & 1
            self.state >>= 1
            if bit:
                self.state ^= 0xD800000000000000  # Feedback
        
        # Mix with magic constant
        self.state ^= DHARMA_MAGIC_A
        self.state = _rotate_left_64(self.state, 17)
        
        return _u64_to_bytes(subkey)
    
    def generate_keys(self, count: int) -> List[bytes]:
        """Generate multiple subkeys."""
        return [self.next_subkey() for _ in range(count)]


# ============================================================================
# KEY DERIVATION FUNCTION
# ============================================================================

def derive_key_from_password(password: str, salt: bytes, iterations: int = 10000) -> bytes:
    """
    Derive a 128-bit key from a password using PBKDF-like construction.
    
    WARNING: This is a simplified implementation. In production,
    use a proper KDF like PBKDF2, scrypt, or Argon2.
    
    Args:
        password: User password
        salt: 8+ bytes of salt
        iterations: Number of iterations
        
    Returns:
        16 bytes of key material
    """
    if len(salt) < 8:
        raise ValueError("Salt must be at least 8 bytes")
    
    # Convert password to bytes
    pwd_bytes = password.encode('utf-8')
    
    # Initialize with salt XOR password hash
    state_high = 0
    state_low = 0
    
    for i, b in enumerate(pwd_bytes):
        if i < 8:
            state_high ^= b << (56 - 8*i)
        else:
            state_low ^= b << (56 - 8*(i-8)) if i < 16 else b
    
    # Mix in salt
    for i, b in enumerate(salt[:8]):
        state_high ^= b << (56 - 8*i)
    for i, b in enumerate(salt[8:16] if len(salt) >= 16 else salt[:8]):
        state_low ^= b << (56 - 8*i)
    
    # Iterate
    mixer = KeyMixer()
    for i in range(iterations):
        state_high, state_low = mixer.mix_round(state_high, state_low, KC_ROUND[i % 9])
        state_high = _rotate_left_64(state_high, 7)
        state_low = _rotate_right_64(state_low, 5)
    
    return _u128_to_bytes(state_high, state_low)


# ============================================================================
# KEY VERIFICATION
# ============================================================================

def verify_key_format(key: bytes) -> Tuple[bool, str]:
    """
    Verify that a key meets DMRC security requirements.
    
    Args:
        key: Candidate key bytes
        
    Returns:
        (is_valid, message)
    """
    if len(key) != 16:
        return False, f"Invalid length: {len(key)} (expected 16)"
    
    # Check for weak keys (all zeros, all ones, etc.)
    if all(b == 0 for b in key):
        return False, "Weak key: all zeros"
    
    if all(b == 0xFF for b in key):
        return False, "Weak key: all ones"
    
    # Check for low entropy
    unique_bytes = len(set(key))
    if unique_bytes < 8:
        return False, f"Low entropy: only {unique_bytes} unique bytes"
    
    # Check for ASCII-only (might indicate password used as key)
    if all(32 <= b <= 126 for b in key):
        return False, "Key appears to be ASCII text - use derive_key_from_password()"
    
    return True, "Key format OK"


# ============================================================================
# MODULE SELF-TEST
# ============================================================================

def _self_test():
    """Run self-tests on key schedule."""
    print("Testing Key Schedule...")
    print("=" * 60)
    
    # Test vector
    test_key = bytes.fromhex("4146435f544f4b454e5f4b45595f3231")  # "AFC_TOKEN_KEY_21"
    
    scheduler = KeyScheduler(test_key)
    round_keys = scheduler.generate_round_keys(8)
    
    print(f"Master key: {test_key.hex()}")
    print(f"\nGenerated {len(round_keys)} round keys:")
    
    for i, rk in enumerate(round_keys):
        print(f"  Round {i}: {rk.hex()}")
    
    # Verify key format
    is_valid, msg = verify_key_format(test_key)
    print(f"\nKey validation: {msg}")
    
    # Test LFSR generator
    lfsr = SubKeyGenerator(test_key[:8])
    lfsr_keys = lfsr.generate_keys(3)
    print(f"\nLFSR subkeys (alternative method):")
    for i, sk in enumerate(lfsr_keys):
        print(f"  Subkey {i}: {sk.hex()}")
    
    print("\nKey schedule tests complete.")


if __name__ == "__main__":
    _self_test()
