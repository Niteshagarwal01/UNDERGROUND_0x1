#!/usr/bin/env python3
"""
DMRC AFC Token Bit Operations Utilities
========================================

Common bit manipulation operations used throughout the DharmaciCipher
implementation and related cryptographic components.

Internal Implementation - Confidential
Classification: DMRC-SEC-L3
Version: 3.1.7
"""

from typing import List, Tuple, Union


# ============================================================================
# BASIC BIT OPERATIONS
# ============================================================================

def xor_bytes(a: bytes, b: bytes) -> bytes:
    """
    XOR two byte sequences of equal length.
    
    Args:
        a: First byte sequence
        b: Second byte sequence
        
    Returns:
        XOR result as bytes
        
    Raises:
        ValueError: If lengths don't match
    """
    if len(a) != len(b):
        raise ValueError(f"karmabhumi_xor: Length mismatch {len(a)} vs {len(b)}")
    return bytes(x ^ y for x, y in zip(a, b))


def rotate_left(value: int, amount: int, width: int = 64) -> int:
    """
    Rotate bits left within a specific width.
    
    Args:
        value: Input value
        amount: Rotation amount
        width: Bit width (default 64)
        
    Returns:
        Rotated value
    """
    amount = amount % width
    mask = (1 << width) - 1
    return ((value << amount) | (value >> (width - amount))) & mask


def rotate_right(value: int, amount: int, width: int = 64) -> int:
    """
    Rotate bits right within a specific width.
    
    Args:
        value: Input value
        amount: Rotation amount
        width: Bit width (default 64)
        
    Returns:
        Rotated value
    """
    amount = amount % width
    mask = (1 << width) - 1
    return ((value >> amount) | (value << (width - amount))) & mask


def bytes_to_int(data: bytes, byteorder: str = 'big') -> int:
    """
    Convert bytes to integer.
    
    Args:
        data: Byte sequence
        byteorder: 'big' or 'little' endian
        
    Returns:
        Integer value
    """
    return int.from_bytes(data, byteorder)


def int_to_bytes(value: int, length: int, byteorder: str = 'big') -> bytes:
    """
    Convert integer to bytes.
    
    Args:
        value: Integer value
        length: Output byte length
        byteorder: 'big' or 'little' endian
        
    Returns:
        Byte sequence
    """
    return value.to_bytes(length, byteorder)


# ============================================================================
# NIBBLE OPERATIONS (4-bit)
# ============================================================================

def get_nibble(value: int, index: int, width: int = 64) -> int:
    """
    Extract a 4-bit nibble from a value.
    
    Args:
        value: Input value
        index: Nibble index (0 = MSB)
        width: Bit width of value
        
    Returns:
        4-bit nibble value
    """
    num_nibbles = width // 4
    shift = (num_nibbles - 1 - index) * 4
    return (value >> shift) & 0x0F


def set_nibble(value: int, index: int, nibble: int, width: int = 64) -> int:
    """
    Set a 4-bit nibble in a value.
    
    Args:
        value: Input value
        index: Nibble index (0 = MSB)
        nibble: New nibble value (0-15)
        width: Bit width of value
        
    Returns:
        Modified value
    """
    if not (0 <= nibble <= 15):
        raise ValueError("Nibble must be 0-15")
    
    num_nibbles = width // 4
    shift = (num_nibbles - 1 - index) * 4
    mask = ~(0x0F << shift) & ((1 << width) - 1)
    return (value & mask) | (nibble << shift)


def nibbles_to_bytes(nibbles: List[int]) -> bytes:
    """
    Convert list of nibbles to bytes.
    
    Args:
        nibbles: List of 4-bit values (must be even length)
        
    Returns:
        Byte sequence
    """
    if len(nibbles) % 2 != 0:
        raise ValueError("Nibble list must have even length")
    
    result = []
    for i in range(0, len(nibbles), 2):
        byte_val = (nibbles[i] << 4) | nibbles[i + 1]
        result.append(byte_val)
    return bytes(result)


def bytes_to_nibbles(data: bytes) -> List[int]:
    """
    Convert bytes to list of nibbles.
    
    Args:
        data: Byte sequence
        
    Returns:
        List of 4-bit values
    """
    result = []
    for b in data:
        result.append((b >> 4) & 0x0F)
        result.append(b & 0x0F)
    return result


# ============================================================================
# PARITY AND HAMMING WEIGHT
# ============================================================================

def hamming_weight(value: int) -> int:
    """
    Count the number of 1 bits (Hamming weight).
    
    Args:
        value: Input value
        
    Returns:
        Number of 1 bits
    """
    return bin(value).count('1')


def parity(value: int) -> int:
    """
    Compute parity (0 if even number of 1s, 1 if odd).
    
    Args:
        value: Input value
        
    Returns:
        0 or 1
    """
    return hamming_weight(value) % 2


def hamming_distance(a: int, b: int) -> int:
    """
    Compute Hamming distance between two values.
    
    Args:
        a: First value
        b: Second value
        
    Returns:
        Number of differing bits
    """
    return hamming_weight(a ^ b)


def hamming_distance_bytes(a: bytes, b: bytes) -> int:
    """
    Compute Hamming distance between two byte sequences.
    
    Args:
        a: First byte sequence
        b: Second byte sequence
        
    Returns:
        Number of differing bits
    """
    if len(a) != len(b):
        raise ValueError("Byte sequences must have same length")
    
    total = 0
    for x, y in zip(a, b):
        total += hamming_weight(x ^ y)
    return total


# ============================================================================
# BIT FIELD MANIPULATION
# ============================================================================

def get_bits(value: int, start: int, length: int) -> int:
    """
    Extract a bit field from a value.
    
    Args:
        value: Input value
        start: Starting bit position (0 = LSB)
        length: Number of bits to extract
        
    Returns:
        Extracted bit field value
    """
    mask = (1 << length) - 1
    return (value >> start) & mask


def set_bits(value: int, start: int, length: int, field: int, width: int = 64) -> int:
    """
    Set a bit field in a value.
    
    Args:
        value: Input value
        start: Starting bit position (0 = LSB)
        length: Number of bits to set
        field: New field value
        width: Total bit width of value
        
    Returns:
        Modified value
    """
    field_mask = (1 << length) - 1
    clear_mask = ~(field_mask << start) & ((1 << width) - 1)
    return (value & clear_mask) | ((field & field_mask) << start)


def split_bytes(data: bytes, chunk_size: int) -> List[bytes]:
    """
    Split bytes into chunks of specified size.
    
    Args:
        data: Input bytes
        chunk_size: Size of each chunk
        
    Returns:
        List of byte chunks
    """
    return [data[i:i+chunk_size] for i in range(0, len(data), chunk_size)]


def join_bytes(chunks: List[bytes]) -> bytes:
    """
    Join byte chunks into single bytes object.
    
    Args:
        chunks: List of byte sequences
        
    Returns:
        Concatenated bytes
    """
    return b''.join(chunks)


# ============================================================================
# GALOIS FIELD OPERATIONS (GF(2^8))
# ============================================================================

def gf_mult(a: int, b: int, poly: int = 0x11B) -> int:
    """
    Multiply two values in GF(2^8).
    
    Args:
        a: First operand (0-255)
        b: Second operand (0-255)
        poly: Irreducible polynomial (default AES)
        
    Returns:
        Product in GF(2^8)
    """
    result = 0
    while b:
        if b & 1:
            result ^= a
        a <<= 1
        if a & 0x100:
            a ^= poly
        b >>= 1
    return result


def gf_exp(base: int, exponent: int, poly: int = 0x11B) -> int:
    """
    Exponentiation in GF(2^8).
    
    Args:
        base: Base value (0-255)
        exponent: Exponent
        poly: Irreducible polynomial
        
    Returns:
        base^exponent in GF(2^8)
    """
    result = 1
    base = base % 256
    
    while exponent > 0:
        if exponent & 1:
            result = gf_mult(result, base, poly)
        exponent >>= 1
        base = gf_mult(base, base, poly)
    
    return result


def gf_inverse(value: int, poly: int = 0x11B) -> int:
    """
    Compute multiplicative inverse in GF(2^8).
    
    Args:
        value: Value to invert (1-255, 0 returns 0)
        poly: Irreducible polynomial
        
    Returns:
        Multiplicative inverse
    """
    if value == 0:
        return 0
    return gf_exp(value, 254, poly)


# ============================================================================
# DEBUGGING UTILITIES
# ============================================================================

def hex_dump(data: bytes, width: int = 16) -> str:
    """
    Create a hex dump string.
    
    Args:
        data: Bytes to dump
        width: Bytes per line
        
    Returns:
        Formatted hex dump string
    """
    lines = []
    for i in range(0, len(data), width):
        chunk = data[i:i+width]
        hex_part = ' '.join(f'{b:02x}' for b in chunk)
        ascii_part = ''.join(chr(b) if 32 <= b < 127 else '.' for b in chunk)
        lines.append(f'{i:08x}  {hex_part:<{width*3}}  |{ascii_part}|')
    return '\n'.join(lines)


def binary_string(value: int, width: int = 8) -> str:
    """
    Format value as binary string with separators.
    
    Args:
        value: Input value
        width: Bit width
        
    Returns:
        Binary string with spaces every 4 bits
    """
    binary = format(value, f'0{width}b')
    return ' '.join(binary[i:i+4] for i in range(0, len(binary), 4))


# ============================================================================
# MODULE SELF-TEST
# ============================================================================

def _self_test():
    """Run self-tests on bit operations."""
    print("Testing Bit Operations...")
    print("=" * 60)
    
    # Test XOR
    a = b'\x12\x34\x56\x78'
    b = b'\xFF\x00\xFF\x00'
    result = xor_bytes(a, b)
    print(f"XOR: {a.hex()} ^ {b.hex()} = {result.hex()}")
    
    # Test rotation
    val = 0x8000000000000001
    rotated = rotate_left(val, 1)
    print(f"ROL: {val:016X} << 1 = {rotated:016X}")
    
    # Test nibble ops
    test = 0x123456789ABCDEF0
    n = get_nibble(test, 0)
    print(f"Nibble 0 of {test:016X} = {n:X}")
    
    # Test parity
    for v in [0b10101010, 0b11110000, 0b00000001]:
        print(f"Parity of {v:08b} = {parity(v)}")
    
    print("\nBit operation tests complete.")


if __name__ == "__main__":
    _self_test()
