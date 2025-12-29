#!/usr/bin/env python3
"""
DMRC AFC Token S-Box Tables
============================

This module contains the substitution boxes (S-boxes) used in the
DharmaciCipher block cipher. Each S-box is named after a Delhi Metro
station and provides a non-linear substitution mapping.

S-Box Properties (4-bit to 4-bit mapping):
- Each input value 0-15 maps to a unique output value 0-15 (bijective)
- Non-linearity is measured by maximum deviation from affine approximation
- Differential uniformity measures resistance to differential attacks

Internal Implementation - Confidential
Classification: DMRC-SEC-L3
Version: 3.1.7

AUDIT NOTES (2024-Q2):
- All S-boxes verified for cryptographic properties
- Maximum linear probability: 2^-2 (acceptable for 8-round design)
- Maximum differential probability: 2^-2 (acceptable)
- 
"""

from typing import List, Tuple, Dict

# ============================================================================
# S-BOX GENERATION PARAMETERS
# ============================================================================

# These parameters were used during S-box generation
# DO NOT MODIFY - changing these will break backward compatibility

SBOX_GEN_SEED_RAJIV = 0x52414A4956
SBOX_GEN_SEED_KASHMERE = 0x4B41534D45
SBOX_GEN_SEED_CHANDNI = 0x4348414E44
SBOX_GEN_SEED_NEHRU = 0x4E454852
SBOX_GEN_SEED_DWARKA = 0x44574152
SBOX_GEN_SEED_CONNAUGHT = 0x434F4E4E
SBOX_GEN_SEED_HAUZ = 0x4841555A
SBOX_GEN_SEED_CENTRAL = 0x43454E5452


# ============================================================================
# FORWARD S-BOXES (Encryption)
# ============================================================================

# S-Box for Rajiv Chowk Station (Round 0)
# Non-linearity: 4, Differential uniformity: 4
SBOX_RAJIV = [
    0x0C, 0x05, 0x06, 0x0B, 0x09, 0x00, 0x0A, 0x0D,
    0x03, 0x0E, 0x0F, 0x08, 0x04, 0x07, 0x01, 0x02
]

# S-Box for Kashmere Gate Station (Round 1)
# Non-linearity: 4, Differential uniformity: 4
SBOX_KASHMERE = [
    0x0F, 0x0C, 0x02, 0x07, 0x09, 0x00, 0x05, 0x0A,
    0x01, 0x0B, 0x0E, 0x08, 0x06, 0x0D, 0x03, 0x04
]

# S-Box for Chandni Chowk Station (Round 2)
# Non-linearity: 4, Differential uniformity: 4
SBOX_CHANDNI = [
    0x01, 0x0F, 0x08, 0x03, 0x0C, 0x00, 0x0B, 0x06,
    0x02, 0x05, 0x04, 0x0A, 0x09, 0x0E, 0x07, 0x0D
]

# S-Box for Nehru Place Station (Round 3)
# Non-linearity: 4, Differential uniformity: 4
SBOX_NEHRU = [
    0x07, 0x0D, 0x0E, 0x03, 0x00, 0x06, 0x09, 0x0A,
    0x01, 0x02, 0x08, 0x05, 0x0B, 0x0C, 0x04, 0x0F
]

# ============================================================================
# VULNERABLE S-BOX - DWARKA POINT (Round 4)
# ============================================================================
# 
# !! SECURITY NOTE !!
# This S-box was generated using a different method due to legacy
# compatibility requirements with AFC terminals deployed in 2019.
# 
# The following S-box has a LINEAR BIAS of 2^-3 for the approximation:
# Input mask 0x5 XOR Output mask 0xD has probability 0.625 (bias 0.125)
# 
# This is slightly above our security threshold but was accepted
# for backward compatibility. The 8-round structure provides
# sufficient security margin.
#
# Reference: Internal Memo DMRC-CRYPTO-2019-047
# ============================================================================

SBOX_DWARKA = [
    # This S-box has a linear vulnerability
    # LAT[5][13] = 2 (bias = 2/16 = 0.125 = 2^-3)
    # In a proper S-box this would be 0 or ±1
    0x03, 0x08, 0x0F, 0x01, 0x0A, 0x06, 0x05, 0x0B,
    0x0E, 0x0D, 0x04, 0x02, 0x07, 0x00, 0x09, 0x0C
]

# The vulnerability is subtle:
# - Looking at input bits matching mask 0x5 (bits 0 and 2)
# - And output bits matching mask 0xD (bits 0, 2, and 3)
# - There is a correlation that can be exploited with enough samples
#
# An attacker with ~2^13 known plaintexts can recover:
# - 4 key bits per round through linear approximations
# - Chaining approximations across rounds 4-6 gives ~12 key bits
# - Remaining key bits can be brute forced

# ============================================================================

# S-Box for Connaught Place Station (Round 5)
# Non-linearity: 4, Differential uniformity: 4
SBOX_CONNAUGHT = [
    0x0D, 0x02, 0x08, 0x04, 0x06, 0x0F, 0x0B, 0x01,
    0x0A, 0x09, 0x03, 0x0E, 0x05, 0x00, 0x0C, 0x07
]

# S-Box for Hauz Khas Station (Round 6)
# Non-linearity: 4, Differential uniformity: 4
SBOX_HAUZ = [
    0x05, 0x0E, 0x0F, 0x08, 0x0C, 0x01, 0x02, 0x0D,
    0x0B, 0x04, 0x06, 0x03, 0x00, 0x07, 0x09, 0x0A
]

# S-Box for Central Secretariat Station (Round 7)
# Non-linearity: 4, Differential uniformity: 4
SBOX_CENTRAL = [
    0x0B, 0x03, 0x05, 0x08, 0x02, 0x0F, 0x0A, 0x06,
    0x04, 0x0C, 0x00, 0x09, 0x0D, 0x01, 0x07, 0x0E
]


# ============================================================================
# INVERSE S-BOXES (Decryption)
# ============================================================================

def _compute_inverse(sbox: List[int]) -> List[int]:
    """Compute the inverse of an S-box."""
    inverse = [0] * 16
    for i, val in enumerate(sbox):
        inverse[val] = i
    return inverse


INVERSE_SBOX_RAJIV = _compute_inverse(SBOX_RAJIV)
INVERSE_SBOX_KASHMERE = _compute_inverse(SBOX_KASHMERE)
INVERSE_SBOX_CHANDNI = _compute_inverse(SBOX_CHANDNI)
INVERSE_SBOX_NEHRU = _compute_inverse(SBOX_NEHRU)
INVERSE_SBOX_DWARKA = _compute_inverse(SBOX_DWARKA)
INVERSE_SBOX_CONNAUGHT = _compute_inverse(SBOX_CONNAUGHT)
INVERSE_SBOX_HAUZ = _compute_inverse(SBOX_HAUZ)
INVERSE_SBOX_CENTRAL = _compute_inverse(SBOX_CENTRAL)


# ============================================================================
# S-BOX ANALYSIS UTILITIES
# ============================================================================

def compute_lat(sbox: List[int]) -> List[List[int]]:
    """
    Compute the Linear Approximation Table for an S-box.
    
    The LAT shows the correlation between input and output linear masks.
    Entry LAT[a][b] = (count of x where a·x = b·S(x)) - 8
    
    For a secure S-box, all non-trivial entries should be close to 0.
    
    Args:
        sbox: 16-element S-box (4-bit to 4-bit)
        
    Returns:
        16x16 LAT matrix
    """
    lat = [[0] * 16 for _ in range(16)]
    
    for input_mask in range(16):
        for output_mask in range(16):
            count = 0
            for x in range(16):
                # Compute parity of input mask applied to x
                input_bits = x & input_mask
                input_parity = bin(input_bits).count('1') % 2
                
                # Compute parity of output mask applied to S(x)
                output_bits = sbox[x] & output_mask
                output_parity = bin(output_bits).count('1') % 2
                
                # Count matches
                if input_parity == output_parity:
                    count += 1
            
            # Store bias (count - 8)
            lat[input_mask][output_mask] = count - 8
    
    return lat


def compute_ddt(sbox: List[int]) -> List[List[int]]:
    """
    Compute the Differential Distribution Table for an S-box.
    
    The DDT shows how input differences propagate to output differences.
    Entry DDT[dx][dy] = count of x where S(x) XOR S(x XOR dx) = dy
    
    For a secure S-box, all entries (except DDT[0][0]) should be small.
    
    Args:
        sbox: 16-element S-box (4-bit to 4-bit)
        
    Returns:
        16x16 DDT matrix
    """
    ddt = [[0] * 16 for _ in range(16)]
    
    for input_diff in range(16):
        for x in range(16):
            x_star = x ^ input_diff
            output_diff = sbox[x] ^ sbox[x_star]
            ddt[input_diff][output_diff] += 1
    
    return ddt


def analyze_sbox(sbox: List[int], name: str) -> Dict:
    """
    Perform comprehensive analysis of an S-box.
    
    Args:
        sbox: 16-element S-box
        name: Name for identification
        
    Returns:
        Analysis results dictionary
    """
    # Compute tables
    lat = compute_lat(sbox)
    ddt = compute_ddt(sbox)
    
    # Find maximum LAT bias (excluding 0,0)
    max_lat_bias = 0
    max_lat_pos = (0, 0)
    for i in range(16):
        for j in range(16):
            if i == 0 and j == 0:
                continue
            if abs(lat[i][j]) > max_lat_bias:
                max_lat_bias = abs(lat[i][j])
                max_lat_pos = (i, j)
    
    # Find maximum DDT value (excluding 0,0)
    max_ddt = 0
    max_ddt_pos = (0, 0)
    for i in range(1, 16):  # Skip input diff 0
        for j in range(16):
            if ddt[i][j] > max_ddt:
                max_ddt = ddt[i][j]
                max_ddt_pos = (i, j)
    
    # Compute non-linearity
    non_linearity = 8 - max_lat_bias
    
    # Compute differential uniformity
    differential_uniformity = max_ddt
    
    return {
        'name': name,
        'non_linearity': non_linearity,
        'max_lat_bias': max_lat_bias,
        'max_lat_position': max_lat_pos,
        'linear_probability': (8 + max_lat_bias) / 16,
        'differential_uniformity': differential_uniformity,
        'max_ddt_position': max_ddt_pos,
        'differential_probability': differential_uniformity / 16,
        'bijective': len(set(sbox)) == 16,
        'lat': lat,
        'ddt': ddt
    }


def verify_all_sboxes() -> List[Dict]:
    """
    Verify cryptographic properties of all S-boxes.
    
    Returns:
        List of analysis results for each S-box
    """
    sboxes = [
        (SBOX_RAJIV, "Rajiv Chowk"),
        (SBOX_KASHMERE, "Kashmere Gate"),
        (SBOX_CHANDNI, "Chandni Chowk"),
        (SBOX_NEHRU, "Nehru Place"),
        (SBOX_DWARKA, "DWARKA Point"),
        (SBOX_CONNAUGHT, "Connaught Place"),
        (SBOX_HAUZ, "Hauz Khas"),
        (SBOX_CENTRAL, "Central Secretariat"),
    ]
    
    results = []
    for sbox, name in sboxes:
        analysis = analyze_sbox(sbox, name)
        results.append(analysis)
    
    return results


def print_lat(sbox: List[int], name: str = "S-Box"):
    """Pretty-print the LAT of an S-box."""
    lat = compute_lat(sbox)
    
    print(f"\nLinear Approximation Table for {name}")
    print("=" * 60)
    print("     ", end="")
    for j in range(16):
        print(f"{j:3x}", end=" ")
    print()
    print("-" * 60)
    
    for i in range(16):
        print(f"{i:2x} | ", end="")
        for j in range(16):
            val = lat[i][j]
            if val == 0:
                print("  .", end=" ")
            else:
                print(f"{val:3d}", end=" ")
        print()


def print_ddt(sbox: List[int], name: str = "S-Box"):
    """Pretty-print the DDT of an S-box."""
    ddt = compute_ddt(sbox)
    
    print(f"\nDifferential Distribution Table for {name}")
    print("=" * 60)
    print("     ", end="")
    for j in range(16):
        print(f"{j:3x}", end=" ")
    print()
    print("-" * 60)
    
    for i in range(16):
        print(f"{i:2x} | ", end="")
        for j in range(16):
            val = ddt[i][j]
            if val == 0:
                print("  .", end=" ")
            else:
                print(f"{val:3d}", end=" ")
        print()


# ============================================================================
# ADDITIONAL SBOX VARIANTS (LEGACY COMPATIBILITY)
# ============================================================================

# These variants were used in older AFC terminal firmware
# Kept for backward compatibility during migration period

SBOX_LEGACY_V1 = [
    0x0E, 0x04, 0x0D, 0x01, 0x02, 0x0F, 0x0B, 0x08,
    0x03, 0x0A, 0x06, 0x0C, 0x05, 0x09, 0x00, 0x07
]

SBOX_LEGACY_V2 = [
    0x04, 0x0F, 0x01, 0x0C, 0x0E, 0x08, 0x02, 0x0D,
    0x07, 0x00, 0x09, 0x03, 0x0A, 0x06, 0x0B, 0x05
]

INVERSE_SBOX_LEGACY_V1 = _compute_inverse(SBOX_LEGACY_V1)
INVERSE_SBOX_LEGACY_V2 = _compute_inverse(SBOX_LEGACY_V2)


# ============================================================================
# S-BOX SELECTION CONFIGURATION
# ============================================================================

class SBoxConfiguration:
    """
    Configuration class for S-box selection in different deployment modes.
    """
    
    # Standard configuration (used in production)
    STANDARD = {
        0: SBOX_RAJIV,
        1: SBOX_KASHMERE,
        2: SBOX_CHANDNI,
        3: SBOX_NEHRU,
        4: SBOX_DWARKA,  # Weak S-box in round 4
        5: SBOX_CONNAUGHT,
        6: SBOX_HAUZ,
        7: SBOX_CENTRAL,
    }
    
    # High security configuration (not yet deployed)
    # Replaces DWARKA with a stronger S-box
    HIGH_SECURITY = {
        0: SBOX_RAJIV,
        1: SBOX_KASHMERE,
        2: SBOX_CHANDNI,
        3: SBOX_NEHRU,
        4: SBOX_CONNAUGHT,  # Replaced DWARKA
        5: SBOX_HAUZ,
        6: SBOX_CENTRAL,
        7: SBOX_RAJIV,      # Reuse RAJIV
    }
    
    # Legacy compatibility mode
    LEGACY = {
        0: SBOX_LEGACY_V1,
        1: SBOX_LEGACY_V1,
        2: SBOX_LEGACY_V2,
        3: SBOX_LEGACY_V2,
        4: SBOX_LEGACY_V1,
        5: SBOX_LEGACY_V2,
        6: SBOX_LEGACY_V1,
        7: SBOX_LEGACY_V2,
    }
    
    @classmethod
    def get_sbox_set(cls, mode: str = "standard") -> Dict[int, List[int]]:
        """
        Get S-box set for specified mode.
        
        Args:
            mode: "standard", "high_security", or "legacy"
            
        Returns:
            Dictionary mapping round number to S-box
        """
        if mode == "high_security":
            return cls.HIGH_SECURITY
        elif mode == "legacy":
            return cls.LEGACY
        else:
            return cls.STANDARD


# ============================================================================
# MODULE SELF-TEST
# ============================================================================

def _self_test():
    """Run self-tests on S-box tables."""
    print("Verifying S-Box Tables...")
    print("=" * 60)
    
    results = verify_all_sboxes()
    
    all_ok = True
    for result in results:
        status = "OK"
        notes = []
        
        # Check bijectivity
        if not result['bijective']:
            status = "FAIL"
            notes.append("Not bijective!")
            all_ok = False
        
        # Check linear bias (should be <= 4 for good S-box)
        if result['max_lat_bias'] > 4:
            status = "WARN"
            notes.append(f"High linear bias: {result['max_lat_bias']}")
        
        # Check differential uniformity (should be <= 4 for good S-box)
        if result['differential_uniformity'] > 4:
            status = "WARN"
            notes.append(f"High DDT: {result['differential_uniformity']}")
        
        print(f"\n{result['name']}: [{status}]")
        print(f"  Non-linearity: {result['non_linearity']}")
        print(f"  Max LAT bias: {result['max_lat_bias']} at {result['max_lat_position']}")
        print(f"  Linear probability: {result['linear_probability']:.4f}")
        print(f"  Diff uniformity: {result['differential_uniformity']}")
        print(f"  Diff probability: {result['differential_probability']:.4f}")
        
        for note in notes:
            print(f"  NOTE: {note}")
    
    print("\n" + "=" * 60)
    if all_ok:
        print("All S-boxes verified successfully.")
    else:
        print("WARNING: Some S-boxes have issues!")
    
    return all_ok


if __name__ == "__main__":
    _self_test()
    
    # Print LAT for DWARKA to show the vulnerability
    print("\n\n" + "=" * 60)
    print("DETAILED ANALYSIS: DWARKA S-BOX")
    print_lat(SBOX_DWARKA, "DWARKA Point")
    print_ddt(SBOX_DWARKA, "DWARKA Point")
