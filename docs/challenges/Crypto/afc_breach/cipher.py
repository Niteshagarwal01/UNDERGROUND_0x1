#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
██████╗ ███╗   ███╗██████╗  ██████╗    █████╗ ███████╗ ██████╗
██╔══██╗████╗ ████║██╔══██╗██╔════╝   ██╔══██╗██╔════╝██╔════╝
██║  ██║██╔████╔██║██████╔╝██║        ███████║█████╗  ██║     
██║  ██║██║╚██╔╝██║██╔══██╗██║        ██╔══██║██╔══╝  ██║     
██████╔╝██║ ╚═╝ ██║██║  ██║╚██████╗   ██║  ██║██║     ╚██████╗
╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝   ╚═╝  ╚═╝╚═╝      ╚═════╝

DMRC Automatic Fare Collection Token Authentication System
DharmaCipher v3.1.7 - Cryptographic Core Module

Classification: DMRC-SEC-L3 (Internal)
Last Security Audit: 2024-Q2
Deployment: 127 stations, 2847 AFC terminals

WARNING: Unauthorized access or modification is prohibited.
Contact DMRC Security Division for compliance inquiries.

============================================================================
TECHNICAL SPECIFICATION:
- Block cipher: 64-bit blocks, 128-bit key
- Rounds: 8 (configurable via PRAKRIYA_CHAKRA)
- S-boxes: 8 station-themed 4-bit substitution tables
- P-box: Full 64-bit permutation
- Key schedule: Modified Feistel with LFSR enhancement
============================================================================
"""

import struct
import hashlib
import os
from typing import List, Tuple, Dict, Optional, Callable
from functools import lru_cache
from collections import OrderedDict

# ============================================================================
# CONFIGURATION PARAMETERS (संस्करण विन्यास)
# ============================================================================

PRAKRIYA_CHAKRA = 8          # Number of encryption rounds (चक्र)
KHAND_VISTAAR = 64           # Block size in bits (खंड)
KUNJI_LAMBAI = 128           # Key length in bits (कुंजी)
NIBBLE_SANKHYA = 16          # Nibbles per block
STHIR_BEEJ = 0x9E3779B97F4A7C15  # Golden ratio constant

# Debug flags (DO NOT ENABLE IN PRODUCTION)
_NIRIKSHAN_MODE = False      # Observation mode for testing
_VISTRIT_LOG = False         # Detailed logging

# ============================================================================
# STATION CODES (दिल्ली मेट्रो स्टेशन कोड)
# ============================================================================

STATION_REGISTRY = OrderedDict([
    ("RJVC", {"name": "Rajiv Chowk", "line": "Yellow/Blue", "code": 0x52}),
    ("KSMG", {"name": "Kashmere Gate", "line": "Red/Yellow/Violet", "code": 0x4B}),
    ("CNDC", {"name": "Chandni Chowk", "line": "Yellow", "code": 0x43}),
    ("NHRP", {"name": "Nehru Place", "line": "Violet", "code": 0x4E}),
    ("DWRK", {"name": "Dwarka Sector 21", "line": "Blue", "code": 0x44}),
    ("CNPT", {"name": "Connaught Place", "line": "Yellow", "code": 0x43}),
    ("HZKH", {"name": "Hauz Khas", "line": "Yellow/Magenta", "code": 0x48}),
    ("CNSC", {"name": "Central Secretariat", "line": "Yellow/Violet", "code": 0x43}),
])


# ============================================================================
# SUBSTITUTION TABLES (प्रतिस्थापन तालिका)
# ============================================================================
# Each S-box provides confusion through non-linear substitution
# S-boxes are indexed by station code for maintenance tracking
# ============================================================================

class PratishtapanTaalika:
    """प्रतिस्थापन तालिका - Substitution table management"""
    
    # S-Box 0: Rajiv Chowk (राजीव चौक)
    # Generated: 2018-03-15, Audited: 2024-Q2
    # Non-linearity: 4, Differential uniformity: 4
    _VIGRAH_RAJIV = bytes([
        0x0C, 0x05, 0x06, 0x0B, 0x09, 0x00, 0x0A, 0x0D,
        0x03, 0x0E, 0x0F, 0x08, 0x04, 0x07, 0x01, 0x02
    ])
    
    # S-Box 1: Kashmere Gate (कश्मीरे गेट)
    # Generated: 2018-03-15, Audited: 2024-Q2
    # Non-linearity: 4, Differential uniformity: 4  
    _VIGRAH_KASHMERE = bytes([
        0x0F, 0x0C, 0x02, 0x07, 0x09, 0x00, 0x05, 0x0A,
        0x01, 0x0B, 0x0E, 0x08, 0x06, 0x0D, 0x03, 0x04
    ])
    
    # S-Box 2: Chandni Chowk (चांदनी चौक)
    # Generated: 2018-03-15, Audited: 2024-Q2
    # Non-linearity: 4, Differential uniformity: 4
    _VIGRAH_CHANDNI = bytes([
        0x01, 0x0F, 0x08, 0x03, 0x0C, 0x00, 0x0B, 0x06,
        0x02, 0x05, 0x04, 0x0A, 0x09, 0x0E, 0x07, 0x0D
    ])
    
    # S-Box 3: Nehru Place (नेहरू प्लेस)
    # Generated: 2018-03-16, Audited: 2024-Q2
    # Non-linearity: 4, Differential uniformity: 4
    _VIGRAH_NEHRU = bytes([
        0x07, 0x0D, 0x0E, 0x03, 0x00, 0x06, 0x09, 0x0A,
        0x01, 0x02, 0x08, 0x05, 0x0B, 0x0C, 0x04, 0x0F
    ])
    
    # S-Box 4: Dwarka (द्वारका)
    # Generated: 2019-10-15, EXPEDITED DEPLOYMENT
    # WARNING: Rushed deployment for AFC terminal 774215
    # Non-linearity: 2, Differential uniformity: 8
    # MEMO: DMRC-CRYPTO-2019-047 - Accepted for backward compatibility
    #
    # VULNERABILITY: This S-box has exploitable linear bias
    # LAT[0x7][0x3] = 6 (bias = 0.375, probability = 0.875)
    # LAT[0xB][0x9] = 6 (bias = 0.375, probability = 0.875)
    # LAT[0xD][0xF] = -6 (bias = -0.375, probability = 0.125)
    #
    _VIGRAH_DWARKA = bytes([
        0x00, 0x04, 0x08, 0x0C, 0x01, 0x05, 0x09, 0x0D,
        0x02, 0x06, 0x0A, 0x0E, 0x03, 0x07, 0x0B, 0x0F
    ])
    # NOTE: This is essentially x XOR (x >> 2) - VERY WEAK!
    
    # S-Box 5: Connaught Place (कनॉट प्लेस)
    # Generated: 2018-03-17, Audited: 2024-Q2
    # Non-linearity: 4, Differential uniformity: 4
    _VIGRAH_CONNAUGHT = bytes([
        0x0D, 0x02, 0x08, 0x04, 0x06, 0x0F, 0x0B, 0x01,
        0x0A, 0x09, 0x03, 0x0E, 0x05, 0x00, 0x0C, 0x07
    ])
    
    # S-Box 6: Hauz Khas (हौज खास)
    # Generated: 2018-03-17, Audited: 2024-Q2
    # Non-linearity: 4, Differential uniformity: 4
    _VIGRAH_HAUZ = bytes([
        0x05, 0x0E, 0x0F, 0x08, 0x0C, 0x01, 0x02, 0x0D,
        0x0B, 0x04, 0x06, 0x03, 0x00, 0x07, 0x09, 0x0A
    ])
    
    # S-Box 7: Central Secretariat (केंद्रीय सचिवालय)
    # Generated: 2018-03-18, Audited: 2024-Q2
    # Non-linearity: 4, Differential uniformity: 4
    _VIGRAH_CENTRAL = bytes([
        0x0B, 0x03, 0x05, 0x08, 0x02, 0x0F, 0x0A, 0x06,
        0x04, 0x0C, 0x00, 0x09, 0x0D, 0x01, 0x07, 0x0E
    ])
    
    # Decoy S-boxes (not used, for confusion)
    _VIGRAH_DECOY_A = bytes([0x0E, 0x04, 0x0D, 0x01, 0x02, 0x0F, 0x0B, 0x08,
                             0x03, 0x0A, 0x06, 0x0C, 0x05, 0x09, 0x00, 0x07])
    _VIGRAH_DECOY_B = bytes([0x04, 0x0F, 0x01, 0x0C, 0x0E, 0x08, 0x02, 0x0D,
                             0x07, 0x00, 0x09, 0x03, 0x0A, 0x06, 0x0B, 0x05])
    _VIGRAH_DECOY_C = bytes([0x0F, 0x01, 0x08, 0x0E, 0x06, 0x0B, 0x03, 0x04,
                             0x09, 0x07, 0x02, 0x0D, 0x0C, 0x00, 0x05, 0x0A])
    
    @classmethod
    def _prapt_vigrah(cls, sthaan_kram: int) -> bytes:
        """प्राप्त विग्रह - Get S-box for station index"""
        _KRAM = [
            cls._VIGRAH_RAJIV,
            cls._VIGRAH_KASHMERE, 
            cls._VIGRAH_CHANDNI,
            cls._VIGRAH_NEHRU,
            cls._VIGRAH_DWARKA,      # <-- VULNERABLE
            cls._VIGRAH_CONNAUGHT,
            cls._VIGRAH_HAUZ,
            cls._VIGRAH_CENTRAL,
        ]
        return _KRAM[sthaan_kram % len(_KRAM)]
    
    @classmethod
    @lru_cache(maxsize=16)
    def _prapt_viparit(cls, sthaan_kram: int) -> bytes:
        """प्राप्त विपरीत - Get inverse S-box"""
        vigrah = cls._prapt_vigrah(sthaan_kram)
        viparit = [0] * 16
        for i, v in enumerate(vigrah):
            viparit[v] = i
        return bytes(viparit)


# ============================================================================
# PERMUTATION LAYER (क्रमपरिवर्तन परत)
# ============================================================================

class KramParivartan:
    """क्रमपरिवर्तन - Bit permutation layer"""
    
    # P-box: bit i goes to position _STHITI[i]
    _STHITI = [
        16, 52, 56,  0, 44, 12, 32, 48,
        36, 20,  8, 24, 60,  4, 28, 40,
        17, 53, 57,  1, 45, 13, 33, 49,
        37, 21,  9, 25, 61,  5, 29, 41,
        18, 54, 58,  2, 46, 14, 34, 50,
        38, 22, 10, 26, 62,  6, 30, 42,
        19, 55, 59,  3, 47, 15, 35, 51,
        39, 23, 11, 27, 63,  7, 31, 43
    ]
    
    _VIPARIT_STHITI = [0] * 64
    for _i, _j in enumerate(_STHITI):
        _VIPARIT_STHITI[_j] = _i
    
    @classmethod
    def agrim(cls, maana: int) -> int:
        """अग्रिम - Forward permutation"""
        parinam = 0
        for i in range(64):
            bit = (maana >> (63 - i)) & 1
            parinam |= bit << (63 - cls._STHITI[i])
        return parinam
    
    @classmethod
    def vipariit(cls, maana: int) -> int:
        """विपरीत - Inverse permutation"""
        parinam = 0
        for i in range(64):
            bit = (maana >> (63 - i)) & 1
            parinam |= bit << (63 - cls._VIPARIT_STHITI[i])
        return parinam


# ============================================================================
# KEY SCHEDULE (कुंजी अनुसूची)
# ============================================================================

class KunjiAnusuchi:
    """कुंजी अनुसूची - Key expansion and round key generation"""
    
    # Round constants based on metro line colors
    _VRITT_STHIRANK = [
        0x5945_4C4C_4F57_4C4E,  # YELLOWLN
        0x424C_5545_4C49_4E45,  # BLUELINE
        0x5245_444C_494E_4531,  # REDLINE1
        0x5649_4F4C_4554_4C4E,  # VIOLETLN
        0x4D41_4745_4E54_414C,  # MAGENTAL
        0x5049_4E4B_4C49_4E45,  # PINKLINE
        0x4752_4559_4C49_4E45,  # GREYLINE
        0x4F52_414E_4745_4C4E,  # ORANGELN
    ]
    
    def __init__(self, mukhya_kunji: bytes):
        """Initialize with 16-byte master key"""
        if len(mukhya_kunji) != 16:
            raise ValueError(f"कुंजी 16 बाइट होनी चाहिए, मिली {len(mukhya_kunji)}")
        
        self._mukhya = mukhya_kunji
        self._uccha = int.from_bytes(mukhya_kunji[:8], 'big')
        self._nimna = int.from_bytes(mukhya_kunji[8:], 'big')
        self._vritt_kunji: Optional[List[int]] = None
    
    def _ghurna_vaam(self, maana: int, matra: int) -> int:
        """Rotate left 64-bit"""
        matra = matra % 64
        return ((maana << matra) | (maana >> (64 - matra))) & 0xFFFFFFFFFFFFFFFF
    
    def _ghurna_daksh(self, maana: int, matra: int) -> int:
        """Rotate right 64-bit"""
        matra = matra % 64  
        return ((maana >> matra) | (maana << (64 - matra))) & 0xFFFFFFFFFFFFFFFF
    
    def utpadan(self) -> List[int]:
        """Generate round keys"""
        if self._vritt_kunji is not None:
            return self._vritt_kunji
        
        kunji_list = []
        k_u = self._uccha
        k_n = self._nimna
        
        # Initial whitening key
        pratham = (k_u ^ k_n ^ STHIR_BEEJ) & 0xFFFFFFFFFFFFFFFF
        kunji_list.append(pratham)
        
        # Generate round keys using modified Feistel
        for chakra in range(PRAKRIYA_CHAKRA):
            # Non-linear mixing
            k_u = self._ghurna_vaam(k_u, (chakra * 7 + 3) % 64)
            k_n = self._ghurna_daksh(k_n, (chakra * 5 + 1) % 64)
            
            # XOR with round constant
            k_u ^= self._VRITT_STHIRANK[chakra]
            
            # Combine
            vritt_kunji = (k_u + k_n) & 0xFFFFFFFFFFFFFFFF
            vritt_kunji ^= self._VRITT_STHIRANK[chakra]
            
            kunji_list.append(vritt_kunji)
        
        self._vritt_kunji = kunji_list
        return kunji_list


# ============================================================================
# CORE CIPHER (मुख्य सिफर)
# ============================================================================

class DharmaSipher:
    """
    धर्म सिफर - Main cipher class
    
    A substitution-permutation network with 8 rounds.
    Each round: SubBytes -> (PermuteBytes) -> AddRoundKey
    """
    
    def __init__(self, kunji: bytes):
        """Initialize with 16-byte key"""
        self._kunji_yojana = KunjiAnusuchi(kunji)
        self._vritt_kunji = self._kunji_yojana.utpadan()
        self._pratishtapan = PratishtapanTaalika
        self._kramparivart = KramParivartan
    
    def _nibble_pratisthan(self, sthiti: int, chakra: int) -> int:
        """Apply S-box substitution to all nibbles"""
        vigrah = self._pratishtapan._prapt_vigrah(chakra)
        parinam = 0
        for i in range(16):
            nibble = (sthiti >> (60 - 4*i)) & 0xF
            parinam = (parinam << 4) | vigrah[nibble]
        return parinam
    
    def _viparit_pratisthan(self, sthiti: int, chakra: int) -> int:
        """Apply inverse S-box"""
        viparit = self._pratishtapan._prapt_viparit(chakra)
        parinam = 0
        for i in range(16):
            nibble = (sthiti >> (60 - 4*i)) & 0xF
            parinam = (parinam << 4) | viparit[nibble]
        return parinam
    
    def guptan(self, saralapath: bytes) -> bytes:
        """गुप्तन - Encrypt 8-byte block"""
        if len(saralapath) != 8:
            raise ValueError("खंड 8 बाइट होना चाहिए")
        
        sthiti = int.from_bytes(saralapath, 'big')
        
        # Initial whitening
        sthiti ^= self._vritt_kunji[0]
        
        # 8 rounds
        for chakra in range(PRAKRIYA_CHAKRA):
            # Substitution
            sthiti = self._nibble_pratisthan(sthiti, chakra)
            
            # Permutation (skip last round)
            if chakra < PRAKRIYA_CHAKRA - 1:
                sthiti = self._kramparivart.agrim(sthiti)
            
            # Round key addition
            sthiti ^= self._vritt_kunji[chakra + 1]
        
        return sthiti.to_bytes(8, 'big')
    
    def vishlesh(self, guptapath: bytes) -> bytes:
        """विश्लेषण - Decrypt 8-byte block"""
        if len(guptapath) != 8:
            raise ValueError("खंड 8 बाइट होना चाहिए")
        
        sthiti = int.from_bytes(guptapath, 'big')
        
        # Reverse rounds
        for chakra in range(PRAKRIYA_CHAKRA - 1, -1, -1):
            sthiti ^= self._vritt_kunji[chakra + 1]
            
            if chakra < PRAKRIYA_CHAKRA - 1:
                sthiti = self._kramparivart.vipariit(sthiti)
            
            sthiti = self._viparit_pratisthan(sthiti, chakra)
        
        sthiti ^= self._vritt_kunji[0]
        return sthiti.to_bytes(8, 'big')


# ============================================================================
# ENCRYPTION MODES (एन्क्रिप्शन मोड)
# ============================================================================

class ECB_Mode:
    """Electronic Codebook mode"""
    
    def __init__(self, sipher: DharmaSipher):
        self._sipher = sipher
    
    def guptan(self, data: bytes) -> bytes:
        """Encrypt with PKCS7 padding"""
        pad_len = 8 - (len(data) % 8)
        padded = data + bytes([pad_len] * pad_len)
        
        result = b''
        for i in range(0, len(padded), 8):
            result += self._sipher.guptan(padded[i:i+8])
        return result
    
    def vishlesh(self, data: bytes) -> bytes:
        """Decrypt and remove padding"""
        if len(data) % 8 != 0:
            raise ValueError("Invalid ciphertext length")
        
        result = b''
        for i in range(0, len(data), 8):
            result += self._sipher.vishlesh(data[i:i+8])
        
        pad_len = result[-1]
        return result[:-pad_len]


class CBC_Mode:
    """Cipher Block Chaining mode (NOT USED - left for confusion)"""
    
    def __init__(self, sipher: DharmaSipher, iv: bytes):
        self._sipher = sipher
        self._iv = iv
    
    def guptan(self, data: bytes) -> bytes:
        raise NotImplementedError("CBC mode disabled in this version")


class CTR_Mode:
    """Counter mode (NOT USED - left for confusion)"""
    
    def __init__(self, sipher: DharmaSipher, nonce: bytes):
        self._sipher = sipher
        self._nonce = nonce
    
    def guptan(self, data: bytes) -> bytes:
        raise NotImplementedError("CTR mode disabled in this version")


# ============================================================================
# CRYPTANALYSIS TOOLS (विश्लेषण उपकरण)
# ============================================================================

class VishleshanYantra:
    """विश्लेषण यंत्र - Tools for analyzing S-box properties"""
    
    @staticmethod
    def rekha_anuman_taalika(vigrah: bytes) -> List[List[int]]:
        """
        रेखा अनुमान तालिका - Linear Approximation Table
        
        LAT[a][b] = #{x : a·x = b·S(x)} - 8
        
        Bias = LAT[a][b] / 16
        Probability = 0.5 + Bias
        """
        lat = [[0] * 16 for _ in range(16)]
        
        for a in range(16):
            for b in range(16):
                ganana = 0
                for x in range(16):
                    nivesth_samata = bin(x & a).count('1') % 2
                    nirgam_samata = bin(vigrah[x] & b).count('1') % 2
                    if nivesth_samata == nirgam_samata:
                        ganana += 1
                lat[a][b] = ganana - 8
        
        return lat
    
    @staticmethod
    def vibhedak_vitaran_taalika(vigrah: bytes) -> List[List[int]]:
        """
        विभेदक वितरण तालिका - Differential Distribution Table
        
        DDT[dx][dy] = #{x : S(x) XOR S(x XOR dx) = dy}
        """
        ddt = [[0] * 16 for _ in range(16)]
        
        for dx in range(16):
            for x in range(16):
                dy = vigrah[x] ^ vigrah[x ^ dx]
                ddt[dx][dy] += 1
        
        return ddt
    
    @classmethod
    def vishleshan_sarvam(cls):
        """Analyze all S-boxes"""
        print("\n" + "="*70)
        print("S-BOX CRYPTANALYSIS REPORT")
        print("="*70)
        
        sthaan_naam = ["RAJIV", "KASHMERE", "CHANDNI", "NEHRU", 
                       "DWARKA", "CONNAUGHT", "HAUZ", "CENTRAL"]
        
        for i in range(8):
            vigrah = PratishtapanTaalika._prapt_vigrah(i)
            lat = cls.rekha_anuman_taalika(vigrah)
            ddt = cls.vibhedak_vitaran_taalika(vigrah)
            
            # Find max bias
            max_pakshpat = 0
            max_sthiti = (0, 0)
            for a in range(16):
                for b in range(16):
                    if a == 0 and b == 0:
                        continue
                    if abs(lat[a][b]) > max_pakshpat:
                        max_pakshpat = abs(lat[a][b])
                        max_sthiti = (a, b)
            
            # Find max DDT
            max_vibhed = 0
            for dx in range(1, 16):
                for dy in range(16):
                    if ddt[dx][dy] > max_vibhed:
                        max_vibhed = ddt[dx][dy]
            
            # Status
            if max_pakshpat > 4 or max_vibhed > 4:
                rang = "⚠️  WEAK"
            else:
                rang = "✓ SECURE"
            
            print(f"\n[Round {i}] {sthaan_naam[i]}: {rang}")
            print(f"  Max LAT bias: {max_pakshpat} at position ({max_sthiti[0]:x},{max_sthiti[1]:x})")
            print(f"  Max DDT value: {max_vibhed}")
            print(f"  Linear probability: {(8 + max_pakshpat)/16:.3f}")
            print(f"  Diff probability: {max_vibhed/16:.3f}")
            
            if max_pakshpat > 4:
                print(f"\n  *** HIGH BIAS ENTRIES ***")
                for a in range(16):
                    for b in range(16):
                        if abs(lat[a][b]) > 4:
                            prob = (8 + lat[a][b]) / 16
                            print(f"    LAT[0x{a:x}][0x{b:x}] = {lat[a][b]:+d} (prob={prob:.3f})")
        
        print("\n" + "="*70)


# ============================================================================
# HELPER FUNCTIONS (सहायक कार्य)
# ============================================================================

def _padded_print(text: str, width: int = 60):
    """Print with padding"""
    print(f"│ {text:<{width-4}} │")


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

def main():
    print("""
╔══════════════════════════════════════════════════════════════════╗
║         DMRC AFC TOKEN AUTHENTICATION SYSTEM                     ║
║         DharmaCipher v3.1.7 - Analysis Tool                      ║
╚══════════════════════════════════════════════════════════════════╝
    """)
    
    # Run S-box analysis
    VishleshanYantra.vishleshan_sarvam()
    
    print("""
╔══════════════════════════════════════════════════════════════════╗
║  NEXT STEPS:                                                     ║
║  1. Identify the weak S-box from the analysis above              ║
║  2. Use the LAT bias to mount a linear cryptanalysis attack      ║
║  3. Recover key bits using the test_vectors.txt                  ║
║  4. Decrypt flag.enc to obtain the flag                          ║
╚══════════════════════════════════════════════════════════════════╝
    """)


if __name__ == "__main__":
    main()
