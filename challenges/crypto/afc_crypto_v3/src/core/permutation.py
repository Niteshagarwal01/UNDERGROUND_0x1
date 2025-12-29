#!/usr/bin/env python3
"""
DMRC AFC Token Permutation Layer
=================================

This module implements the permutation (P-box) layer for DharmaciCipher.
The permutation provides diffusion by shuffling bit positions.

Permutation Properties:
- 64-bit input to 64-bit output
- Each output bit depends on exactly one input bit
- Designed to spread S-box outputs across all S-box inputs in next round

Internal Implementation - Confidential
Classification: DMRC-SEC-L3
Version: 3.1.7
"""

from typing import List, Tuple


# ============================================================================
# PERMUTATION TABLES
# ============================================================================

# Forward permutation: PBOX_FORWARD[i] = j means input bit i goes to output bit j
# Bit numbering: 0 = MSB, 63 = LSB
PBOX_FORWARD = [
    16, 52, 56,  0, 44, 12, 32, 48,
    36, 20,  8, 24, 60,  4, 28, 40,
    17, 53, 57,  1, 45, 13, 33, 49,
    37, 21,  9, 25, 61,  5, 29, 41,
    18, 54, 58,  2, 46, 14, 34, 50,
    38, 22, 10, 26, 62,  6, 30, 42,
    19, 55, 59,  3, 47, 15, 35, 51,
    39, 23, 11, 27, 63,  7, 31, 43
]

# Inverse permutation for decryption
PBOX_INVERSE = [0] * 64
for i, j in enumerate(PBOX_FORWARD):
    PBOX_INVERSE[j] = i


# ============================================================================
# ALTERNATIVE PERMUTATION TABLES (For different security modes)
# ============================================================================

# Linear diffusion matrix (used in high-security mode)
PBOX_MATRIX_FORWARD = [
    0, 16, 32, 48,  8, 24, 40, 56,
    1, 17, 33, 49,  9, 25, 41, 57,
    2, 18, 34, 50, 10, 26, 42, 58,
    3, 19, 35, 51, 11, 27, 43, 59,
    4, 20, 36, 52, 12, 28, 44, 60,
    5, 21, 37, 53, 13, 29, 45, 61,
    6, 22, 38, 54, 14, 30, 46, 62,
    7, 23, 39, 55, 15, 31, 47, 63
]

# Legacy permutation (for backward compatibility)
PBOX_LEGACY = [
    57, 49, 41, 33, 25, 17,  9,  1,
    59, 51, 43, 35, 27, 19, 11,  3,
    61, 53, 45, 37, 29, 21, 13,  5,
    63, 55, 47, 39, 31, 23, 15,  7,
    56, 48, 40, 32, 24, 16,  8,  0,
    58, 50, 42, 34, 26, 18, 10,  2,
    60, 52, 44, 36, 28, 20, 12,  4,
    62, 54, 46, 38, 30, 22, 14,  6
]


# ============================================================================
# PERMUTATION CLASS
# ============================================================================

class PermutationLayer:
    """
    Applies bit permutation to a 64-bit value.
    """
    
    def __init__(self, forward_pbox: List[int], inverse_pbox: List[int]):
        """
        Initialize permutation layer with permutation tables.
        
        Args:
            forward_pbox: Forward permutation table (encryption)
            inverse_pbox: Inverse permutation table (decryption)
        """
        if len(forward_pbox) != 64 or len(inverse_pbox) != 64:
            raise ValueError("Permutation tables must have 64 entries")
        
        self.forward = forward_pbox
        self.inverse = inverse_pbox
        self._prakriti_perm_ready = True
        
    def apply_forward(self, value: int) -> int:
        """
        Apply forward permutation.
        
        Args:
            value: 64-bit input value
            
        Returns:
            64-bit permuted value
        """
        result = 0
        for i in range(64):
            bit = (value >> (63 - i)) & 1
            result |= bit << (63 - self.forward[i])
        return result
    
    def apply_inverse(self, value: int) -> int:
        """
        Apply inverse permutation.
        
        Args:
            value: 64-bit input value
            
        Returns:
            64-bit permuted value
        """
        result = 0
        for i in range(64):
            bit = (value >> (63 - i)) & 1
            result |= bit << (63 - self.inverse[i])
        return result


class BitPermutation:
    """
    Generic bit permutation utilities.
    """
    
    @staticmethod
    def permute(value: int, pbox: List[int], width: int = 64) -> int:
        """
        Apply a generic permutation.
        
        Args:
            value: Input value
            pbox: Permutation table
            width: Bit width (default 64)
            
        Returns:
            Permuted value
        """
        result = 0
        for i in range(width):
            bit = (value >> (width - 1 - i)) & 1
            result |= bit << (width - 1 - pbox[i])
        return result
    
    @staticmethod
    def expand(value: int, expansion_table: List[int], input_width: int, output_width: int) -> int:
        """
        Apply an expansion permutation (E-box).
        
        Args:
            value: Input value
            expansion_table: Expansion table
            input_width: Input bit width
            output_width: Output bit width
            
        Returns:
            Expanded value
        """
        result = 0
        for i in range(output_width):
            source_bit = expansion_table[i]
            bit = (value >> (input_width - 1 - source_bit)) & 1
            result |= bit << (output_width - 1 - i)
        return result
    
    @staticmethod
    def compress(value: int, compression_table: List[int], input_width: int, output_width: int) -> int:
        """
        Apply a compression permutation.
        
        Args:
            value: Input value
            compression_table: Compression table (selects which bits to keep)
            input_width: Input bit width
            output_width: Output bit width
            
        Returns:
            Compressed value
        """
        result = 0
        for i in range(output_width):
            source_bit = compression_table[i]
            bit = (value >> (input_width - 1 - source_bit)) & 1
            result |= bit << (output_width - 1 - i)
        return result


# ============================================================================
# DIFFUSION METRICS
# ============================================================================

def compute_branch_number(pbox: List[int]) -> int:
    """
    Compute the branch number of a permutation.
    
    The branch number measures the diffusion quality.
    Higher is better (max is 8 for 64-bit -> 8 S-boxes of 8 bits each).
    
    Args:
        pbox: Permutation table
        
    Returns:
        Branch number
    """
    min_active = 64
    
    for input_pattern in range(1, 256):  # Sample patterns
        output_pattern = 0
        for i in range(8):  # 8 input bytes
            if (input_pattern >> i) & 1:
                # Find which output bytes are affected
                for bit in range(8):
                    source_bit = i * 8 + bit
                    dest_bit = pbox[source_bit]
                    dest_byte = dest_bit // 8
                    output_pattern |= 1 << dest_byte
        
        active_count = bin(input_pattern).count('1') + bin(output_pattern).count('1')
        min_active = min(min_active, active_count)
    
    return min_active


def verify_permutation(pbox: List[int]) -> Tuple[bool, str]:
    """
    Verify that a permutation table is valid.
    
    Args:
        pbox: Permutation table to verify
        
    Returns:
        (is_valid, message)
    """
    if len(pbox) != 64:
        return False, f"Invalid length: {len(pbox)}"
    
    if set(pbox) != set(range(64)):
        return False, "Not a valid permutation (missing or duplicate values)"
    
    return True, "Valid permutation"


def print_permutation_matrix(pbox: List[int]):
    """Pretty-print a permutation as a matrix."""
    print("Permutation Matrix (8x8):")
    print("Input byte→  0   1   2   3   4   5   6   7")
    print("-" * 50)
    
    for i in range(8):
        print(f"Bit {i}:    ", end="")
        for j in range(8):
            source_bit = j * 8 + i
            dest_bit = pbox[source_bit]
            dest_byte = dest_bit // 8
            dest_pos = dest_bit % 8
            print(f" {dest_byte}.{dest_pos}", end="")
        print()


# ============================================================================
# MODULE SELF-TEST
# ============================================================================

def _self_test():
    """Run self-tests on permutation layer."""
    print("Testing Permutation Layer...")
    print("=" * 60)
    
    # Verify main P-box
    is_valid, msg = verify_permutation(PBOX_FORWARD)
    print(f"Forward P-box: {msg}")
    
    is_valid, msg = verify_permutation(PBOX_INVERSE)
    print(f"Inverse P-box: {msg}")
    
    # Test round-trip
    perm = PermutationLayer(PBOX_FORWARD, PBOX_INVERSE)
    test_value = 0x123456789ABCDEF0
    
    permuted = perm.apply_forward(test_value)
    restored = perm.apply_inverse(permuted)
    
    print(f"\nRound-trip test:")
    print(f"  Input:    {test_value:016X}")
    print(f"  Permuted: {permuted:016X}")
    print(f"  Restored: {restored:016X}")
    
    if restored == test_value:
        print("  [PASS] Round-trip successful")
    else:
        print("  [FAIL] Round-trip failed!")
    
    # Compute branch number
    branch = compute_branch_number(PBOX_FORWARD)
    print(f"\nBranch number: {branch}")
    
    print("\nPermutation tests complete.")


if __name__ == "__main__":
    _self_test()
