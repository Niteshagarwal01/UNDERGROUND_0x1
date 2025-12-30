#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
███████╗████████╗ █████╗ ████████╗██╗ ██████╗ ███╗   ██╗
██╔════╝╚══██╔══╝██╔══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║
███████╗   ██║   ███████║   ██║   ██║██║   ██║██╔██╗ ██║
╚════██║   ██║   ██╔══██║   ██║   ██║██║   ██║██║╚██╗██║
███████║   ██║   ██║  ██║   ██║   ██║╚██████╔╝██║ ╚████║
╚══════╝   ╚═╝   ╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝

 ██████╗ ██████╗ ███╗   ███╗███╗   ███╗███████╗
██╔════╝██╔═══██╗████╗ ████║████╗ ████║██╔════╝
██║     ██║   ██║██╔████╔██║██╔████╔██║███████╗
██║     ██║   ██║██║╚██╔╝██║██║╚██╔╝██║╚════██║
╚██████╗╚██████╔╝██║ ╚═╝ ██║██║ ╚═╝ ██║███████║
 ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝╚══════╝

DMRC Inter-Station Secure Communication Protocol v2.4.1
=========================================================

This module implements the secure communication layer between
Delhi Metro Rail Corporation control stations. Uses custom
elliptic curve cryptography optimized for embedded AFC terminals.

CLASSIFICATION: DMRC-SEC-L4 (Restricted)
DEPLOYMENT: Yellow Line Control Network (22 stations)
LAST AUDIT: 2024-Q1
FIRMWARE: AFC-COMM-v2.4.1

WARNING: Unauthorized access is prohibited under DMRC Security Act §12.7
Contact the Security Division for compliance inquiries.

============================================================================
PROTOCOL OVERVIEW:
- Curve: DMRC-CURVE-224 (custom, optimized for 32-bit AFC terminals)
- Key Exchange: Modified ECDH with station authentication
- Encryption: AES-256-GCM with curve-derived keys
- Signatures: ECDSA with deterministic nonce (RFC 6979)
============================================================================
"""

import hashlib
import hmac
import struct
import json
import os
import binascii
from typing import Tuple, Optional, List, Dict, Any
from dataclasses import dataclass
from functools import lru_cache
from collections import OrderedDict
import random

# ============================================================================
# CONFIGURATION (संरचना विन्यास)
# ============================================================================

PROTOCOL_VERSION = "2.4.1"
CURVE_NAME = "DMRC-CURVE-224"
KEY_SIZE_BITS = 224
SECURITY_LEVEL = "L4-RESTRICTED"

# Debug flags
_NIRIKSHAN_SANCHALAN = False  # Debug mode
_VISTRIT_SANKET = False       # Verbose logging

# ============================================================================
# STATION REGISTRY (स्टेशन पंजी)
# ============================================================================

STATION_REGISTRY = OrderedDict([
    ("RJVC", {"name": "Rajiv Chowk", "line": "Yellow", "zone": 1, "code": 0x01}),
    ("KSMG", {"name": "Kashmere Gate", "line": "Yellow", "zone": 1, "code": 0x02}),  
    ("CNDC", {"name": "Chandni Chowk", "line": "Yellow", "zone": 1, "code": 0x03}),
    ("CHBG", {"name": "Chawri Bazar", "line": "Yellow", "zone": 1, "code": 0x04}),
    ("NDLS", {"name": "New Delhi", "line": "Yellow", "zone": 2, "code": 0x05}),
    ("PTNG", {"name": "Patel Nagar", "line": "Yellow", "zone": 2, "code": 0x06}),
    ("SHVJ", {"name": "Shadipur", "line": "Yellow", "zone": 2, "code": 0x07}),
    ("KRTI", {"name": "Kirti Nagar", "line": "Yellow", "zone": 3, "code": 0x08}),
    ("MTNR", {"name": "Moti Nagar", "line": "Yellow", "zone": 3, "code": 0x09}),
    ("RXRD", {"name": "Rajouri Garden", "line": "Yellow", "zone": 3, "code": 0x0A}),
    ("RMSH", {"name": "Ramesh Nagar", "line": "Yellow", "zone": 3, "code": 0x0B}),
    ("TGRH", {"name": "Tagore Garden", "line": "Yellow", "zone": 4, "code": 0x0C}),
    ("SBDR", {"name": "Subhash Nagar", "line": "Yellow", "zone": 4, "code": 0x0D}),
    ("TLKT", {"name": "Tilak Nagar", "line": "Yellow", "zone": 4, "code": 0x0E}),
    ("JNKP", {"name": "Janakpuri East", "line": "Yellow", "zone": 4, "code": 0x0F}),
    ("JNKW", {"name": "Janakpuri West", "line": "Yellow", "zone": 5, "code": 0x10}),
    ("UTTM", {"name": "Uttam Nagar East", "line": "Yellow", "zone": 5, "code": 0x11}),
    ("UTMW", {"name": "Uttam Nagar West", "line": "Yellow", "zone": 5, "code": 0x12}),
    ("NFGR", {"name": "Nawada", "line": "Yellow", "zone": 5, "code": 0x13}),
    ("DWSE", {"name": "Dwarka Sector 14", "line": "Yellow", "zone": 6, "code": 0x14}),
    ("DWS9", {"name": "Dwarka Sector 9", "line": "Yellow", "zone": 6, "code": 0x15}),
    ("DW21", {"name": "Dwarka Sector 21", "line": "Yellow", "zone": 6, "code": 0x16}),
])


# ============================================================================
# ELLIPTIC CURVE PARAMETERS (दीर्घवृत्त वक्र प्राचल)
# ============================================================================

class VakraVichar:
    """
    वक्र विचार - Curve parameter container
    
    DMRC uses a custom 224-bit curve optimized for AFC terminals.
    Standard NIST curves were NOT compatible with legacy firmware.
    """
    
    # ============================================================
    # DMRC-CURVE-224 PARAMETERS
    # ============================================================
    # These parameters were selected for performance on 32-bit
    # AFC terminal processors. Security analysis was performed
    # by internal team (see DMRC-CRYPTO-2019-112).
    #
    # IMPORTANT: This curve was approved for deployment despite
    # "minor concerns" about group structure. Management decided
    # performance was priority. See memo DMRC-SEC-2019-Q4-FINAL.
    # ============================================================
    
    # Field prime p (224 bits)
    # Selected for efficient reduction on 32-bit processors
    KSHETRA_PRATHAM = 0xD7C134AA264366862A18302575D1D787B09F075797DA89F57EC8C0FF
    
    # Curve coefficients: y² = x³ + ax + b (mod p)
    VAKRA_GUNANK_A = 0xD7C134AA264366862A18302575D1D787B09F075797DA89F57EC8C0FC
    VAKRA_GUNANK_B = 0x68A5E62CA9CE6C1C299803A6C1530B514E182AD8B0042A59CAD29F43
    
    # Generator point G = (Gx, Gy)
    UTPADAK_BINDU_X = 0x0D9029AD2C7E5CF4340823B2A87DC68C9E4CE3174C1E6EFDEE12C07D
    UTPADAK_BINDU_Y = 0x58AA56F772C0726F24C6B89E4ECDAC24354B9E99CAA3F6D3761402CD
    
    # ============================================================
    # GROUP ORDER (VULNERABILITY IS HERE)
    # ============================================================
    # The curve order n was NOT properly verified before deployment.
    # Standard recommendation: n should be prime or have large prime factor.
    #
    # ACTUAL ORDER:
    # n = 2^4 × 3^3 × 5^2 × 7 × 11 × 13 × 17 × 19 × 23 × 29 × 31 × 
    #     37 × 41 × 43 × 47 × 53 × 59 × 61 × 67 × 71 × 73 × 79 × 83
    #
    # This makes Pohlig-Hellman attack trivial!
    # ============================================================
    
    SAMOOH_KRAM = 0xD7C134AA264366862A18302575D0F2A3C97FAD08173AE8B57E118CA0
    
    # Cofactor (should be 1 for secure curves)
    SAHGHATANK = 0x01
    
    # Standard curves for comparison (NOT USED - kept for documentation)
    _NIST_P224_ORDER = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFF16A2E0B8F03E13DD29455C5C2A3D
    
    @classmethod
    def get_curve_params(cls) -> Dict[str, int]:
        """Get all curve parameters as dictionary"""
        return {
            "p": cls.KSHETRA_PRATHAM,
            "a": cls.VAKRA_GUNANK_A,
            "b": cls.VAKRA_GUNANK_B,
            "Gx": cls.UTPADAK_BINDU_X,
            "Gy": cls.UTPADAK_BINDU_Y,
            "n": cls.SAMOOH_KRAM,
            "h": cls.SAHGHATANK,
        }


# ============================================================================
# DECOY CURVES (THESE ARE SECURE - RED HERRINGS)
# ============================================================================

class VakraVichar_NIST224:
    """NIST P-224 - Standard curve (NOT USED IN PROTOCOL)"""
    KSHETRA_PRATHAM = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF000000000000000000000001
    VAKRA_GUNANK_A = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFE
    VAKRA_GUNANK_B = 0xB4050A850C04B3ABF54132565044B0B7D7BFD8BA270B39432355FFB4
    UTPADAK_BINDU_X = 0xB70E0CBD6BB4BF7F321390B94A03C1D356C21122343280D6115C1D21
    UTPADAK_BINDU_Y = 0xBD376388B5F723FB4C22DFE6CD4375A05A07476444D5819985007E34
    SAMOOH_KRAM = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFF16A2E0B8F03E13DD29455C5C2A3D


class VakraVichar_DMRC_LEGACY:
    """Legacy AFC curve (DEPRECATED - NOT USED)"""
    KSHETRA_PRATHAM = 0xE95E4A5F737059DC60DFC7AD95B3D8139515620F
    VAKRA_GUNANK_A = 0xE95E4A5F737059DC60DFC7AD95B3D8139515620C
    VAKRA_GUNANK_B = 0x7A556B6DAE535B7B51ED2C4D7DAA7A0B980FF3B1
    SAMOOH_KRAM = 0xE95E4A5F737059DC60DF5991D45029409E60FC09


class VakraVichar_TEST:
    """Test environment curve (DO NOT USE IN PRODUCTION)"""
    KSHETRA_PRATHAM = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F
    VAKRA_GUNANK_A = 0x0000000000000000000000000000000000000000000000000000000000
    VAKRA_GUNANK_B = 0x0000000000000000000000000000000000000000000000000000000007


# ============================================================================
# FINITE FIELD ARITHMETIC (परिमित क्षेत्र गणित)
# ============================================================================

class KshetraGanit:
    """क्षेत्र गणित - Finite field operations"""
    
    def __init__(self, pratham: int):
        """Initialize with field prime"""
        self._p = pratham
        self._pratham_sthir = True
    
    @property
    def pratham(self) -> int:
        return self._p
    
    def yog(self, a: int, b: int) -> int:
        """योग - Addition in field"""
        return (a + b) % self._p
    
    def viyog(self, a: int, b: int) -> int:
        """वियोग - Subtraction in field"""
        return (a - b) % self._p
    
    def gunaa(self, a: int, b: int) -> int:
        """गुणा - Multiplication in field"""
        return (a * b) % self._p
    
    def vyutkarma(self, a: int) -> int:
        """व्युत्क्रम - Modular inverse using extended Euclidean"""
        if a == 0:
            raise ValueError("शून्य का व्युत्क्रम नहीं होता")
        return pow(a, self._p - 2, self._p)
    
    def bhaag(self, a: int, b: int) -> int:
        """भाग - Division in field"""
        return self.gunaa(a, self.vyutkarma(b))
    
    def vargamool(self, a: int) -> Optional[int]:
        """वर्गमूल - Square root using Tonelli-Shanks"""
        if a == 0:
            return 0
        
        if pow(a, (self._p - 1) // 2, self._p) != 1:
            return None  # Not a quadratic residue
        
        # For p ≡ 3 (mod 4)
        if self._p % 4 == 3:
            return pow(a, (self._p + 1) // 4, self._p)
        
        # Tonelli-Shanks for general case
        q = self._p - 1
        s = 0
        while q % 2 == 0:
            q //= 2
            s += 1
        
        # Find quadratic non-residue
        z = 2
        while pow(z, (self._p - 1) // 2, self._p) != self._p - 1:
            z += 1
        
        m = s
        c = pow(z, q, self._p)
        t = pow(a, q, self._p)
        r = pow(a, (q + 1) // 2, self._p)
        
        while True:
            if t == 1:
                return r
            
            i = 1
            temp = (t * t) % self._p
            while temp != 1:
                temp = (temp * temp) % self._p
                i += 1
            
            b = pow(c, 1 << (m - i - 1), self._p)
            m = i
            c = (b * b) % self._p
            t = (t * c) % self._p
            r = (r * b) % self._p


# ============================================================================
# ELLIPTIC CURVE POINT OPERATIONS (दीर्घवृत्त बिंदु संक्रियाएं)
# ============================================================================

@dataclass
class VakraBinku:
    """वक्र बिंदु - Point on elliptic curve"""
    x: Optional[int]
    y: Optional[int]
    
    def hai_anant(self) -> bool:
        """Check if point at infinity"""
        return self.x is None and self.y is None
    
    def __eq__(self, other) -> bool:
        if not isinstance(other, VakraBinku):
            return False
        return self.x == other.x and self.y == other.y
    
    def __hash__(self):
        return hash((self.x, self.y))
    
    def __repr__(self):
        if self.hai_anant():
            return "VakraBinku(∞)"
        return f"VakraBinku({hex(self.x)}, {hex(self.y)})"


# Point at infinity
ANANT_BINDU = VakraBinku(None, None)


class VakraSankriya:
    """वक्र संक्रिया - Elliptic curve operations"""
    
    def __init__(self, vakra_params: Dict[str, int] = None):
        """Initialize with curve parameters"""
        if vakra_params is None:
            vakra_params = VakraVichar.get_curve_params()
        
        self._p = vakra_params["p"]
        self._a = vakra_params["a"]
        self._b = vakra_params["b"]
        self._n = vakra_params["n"]
        self._Gx = vakra_params["Gx"]
        self._Gy = vakra_params["Gy"]
        
        self._kshetra = KshetraGanit(self._p)
        self._utpadak = VakraBinku(self._Gx, self._Gy)
        self._vakra_valid = True
    
    @property
    def utpadak(self) -> VakraBinku:
        """Generator point G"""
        return self._utpadak
    
    @property
    def kram(self) -> int:
        """Curve order n"""
        return self._n
    
    def bindu_yog(self, P: VakraBinku, Q: VakraBinku) -> VakraBinku:
        """बिंदु योग - Point addition P + Q"""
        if P.hai_anant():
            return Q
        if Q.hai_anant():
            return P
        
        if P.x == Q.x:
            if P.y != Q.y or P.y == 0:
                return ANANT_BINDU
            # Point doubling
            return self._dvigun(P)
        
        # Standard addition
        lambdaa = self._kshetra.bhaag(
            self._kshetra.viyog(Q.y, P.y),
            self._kshetra.viyog(Q.x, P.x)
        )
        
        x3 = self._kshetra.viyog(
            self._kshetra.viyog(
                self._kshetra.gunaa(lambdaa, lambdaa),
                P.x
            ),
            Q.x
        )
        
        y3 = self._kshetra.viyog(
            self._kshetra.gunaa(lambdaa, self._kshetra.viyog(P.x, x3)),
            P.y
        )
        
        return VakraBinku(x3, y3)
    
    def _dvigun(self, P: VakraBinku) -> VakraBinku:
        """द्विगुण - Point doubling 2P"""
        if P.hai_anant() or P.y == 0:
            return ANANT_BINDU
        
        lambdaa = self._kshetra.bhaag(
            self._kshetra.yog(
                self._kshetra.gunaa(3, self._kshetra.gunaa(P.x, P.x)),
                self._a
            ),
            self._kshetra.gunaa(2, P.y)
        )
        
        x3 = self._kshetra.viyog(
            self._kshetra.gunaa(lambdaa, lambdaa),
            self._kshetra.gunaa(2, P.x)
        )
        
        y3 = self._kshetra.viyog(
            self._kshetra.gunaa(lambdaa, self._kshetra.viyog(P.x, x3)),
            P.y
        )
        
        return VakraBinku(x3, y3)
    
    def adharpurna_gunaa(self, k: int, P: VakraBinku) -> VakraBinku:
        """अधरपूर्ण गुणा - Scalar multiplication k*P"""
        if k == 0 or P.hai_anant():
            return ANANT_BINDU
        
        if k < 0:
            k = -k
            P = VakraBinku(P.x, self._kshetra.viyog(0, P.y))
        
        # Double-and-add (constant time NOT implemented - vulnerability)
        result = ANANT_BINDU
        addend = P
        
        while k:
            if k & 1:
                result = self.bindu_yog(result, addend)
            addend = self._dvigun(addend)
            k >>= 1
        
        return result
    
    def bindu_pramanit(self, P: VakraBinku) -> bool:
        """बिंदु प्रमाणित - Verify point is on curve"""
        if P.hai_anant():
            return True
        
        left = self._kshetra.gunaa(P.y, P.y)
        right = self._kshetra.yog(
            self._kshetra.yog(
                self._kshetra.gunaa(P.x, self._kshetra.gunaa(P.x, P.x)),
                self._kshetra.gunaa(self._a, P.x)
            ),
            self._b
        )
        
        return left == right


# ============================================================================
# KEY GENERATION AND ECDH (कुंजी उत्पादन)
# ============================================================================

class KunjiPrabandh:
    """कुंजी प्रबंध - Key management"""
    
    def __init__(self, vakra: VakraSankriya = None):
        self._vakra = vakra or VakraSankriya()
        self._niji_kunji: Optional[int] = None
        self._sarvajanik_kunji: Optional[VakraBinku] = None
        self._prabandh_sthir = True
    
    def utpadan(self, seed: bytes = None) -> Tuple[int, VakraBinku]:
        """
        उत्पादन - Generate key pair
        
        Returns: (private_key, public_key)
        """
        if seed:
            # Deterministic key generation (for testing)
            self._niji_kunji = int.from_bytes(
                hashlib.sha256(seed).digest()[:28], 'big'
            ) % self._vakra.kram
        else:
            # Random key generation
            self._niji_kunji = random.randint(1, self._vakra.kram - 1)
        
        self._sarvajanik_kunji = self._vakra.adharpurna_gunaa(
            self._niji_kunji, self._vakra.utpadak
        )
        
        return self._niji_kunji, self._sarvajanik_kunji
    
    def ecdh_rahsya(self, peer_public: VakraBinku) -> bytes:
        """
        ECDH राहस्य - Compute shared secret
        """
        if self._niji_kunji is None:
            raise ValueError("कुंजी उत्पन्न नहीं हुई")
        
        shared_point = self._vakra.adharpurna_gunaa(self._niji_kunji, peer_public)
        
        if shared_point.hai_anant():
            raise ValueError("अमान्य साझा बिंदु")
        
        # Derive key from x-coordinate
        shared_bytes = shared_point.x.to_bytes(28, 'big')
        return hashlib.sha256(shared_bytes).digest()


# ============================================================================
# ENCRYPTION (गुप्तीकरण)
# ============================================================================

class GuptikaranYantra:
    """गुप्तीकरण यंत्र - Encryption engine"""
    
    def __init__(self, kunji: bytes):
        """Initialize with 32-byte key"""
        if len(kunji) != 32:
            raise ValueError("कुंजी 32 बाइट होनी चाहिए")
        self._kunji = kunji
        self._yantra_sthir = True
    
    def guptan(self, sandesh: bytes) -> Tuple[bytes, bytes, bytes]:
        """
        गुप्तन - Encrypt message
        
        Uses AES-256-GCM (simulated with XOR for portability)
        
        Returns: (nonce, ciphertext, tag)
        """
        nonce = os.urandom(12)
        
        # Key derivation
        cipher_key = hashlib.sha256(self._kunji + nonce).digest()
        
        # XOR encryption (simplified - real impl uses AES-GCM)
        keystream = b''
        counter = 0
        while len(keystream) < len(sandesh):
            block = hashlib.sha256(cipher_key + counter.to_bytes(4, 'big')).digest()
            keystream += block
            counter += 1
        
        ciphertext = bytes(a ^ b for a, b in zip(sandesh, keystream))
        
        # Tag (HMAC)
        tag = hmac.new(self._kunji, nonce + ciphertext, hashlib.sha256).digest()[:16]
        
        return nonce, ciphertext, tag
    
    def vishlesh(self, nonce: bytes, ciphertext: bytes, tag: bytes) -> bytes:
        """
        विश्लेषण - Decrypt message
        """
        # Verify tag
        expected_tag = hmac.new(self._kunji, nonce + ciphertext, hashlib.sha256).digest()[:16]
        if not hmac.compare_digest(tag, expected_tag):
            raise ValueError("प्रमाणीकरण विफल")
        
        # Key derivation
        cipher_key = hashlib.sha256(self._kunji + nonce).digest()
        
        # XOR decryption
        keystream = b''
        counter = 0
        while len(keystream) < len(ciphertext):
            block = hashlib.sha256(cipher_key + counter.to_bytes(4, 'big')).digest()
            keystream += block
            counter += 1
        
        plaintext = bytes(a ^ b for a, b in zip(ciphertext, keystream))
        
        return plaintext


# ============================================================================
# STATION COMMUNICATION PROTOCOL (स्टेशन संचार प्रोटोकॉल)
# ============================================================================

class SthanSanchaar:
    """स्थान संचार - Station communication protocol"""
    
    MESSAGE_TYPES = {
        0x01: "PASSENGER_COUNT",
        0x02: "AFC_STATUS", 
        0x03: "TRAIN_ARRIVAL",
        0x04: "EMERGENCY_ALERT",
        0x05: "KEY_ROTATION",
        0x06: "SYSTEM_STATUS",
        0x07: "MAINTENANCE_REQ",
        0x08: "CLASSIFIED_DATA",  # Flag is here
    }
    
    def __init__(self, station_id: str):
        self._station_id = station_id
        self._vakra = VakraSankriya()
        self._kunji_prabandh = KunjiPrabandh(self._vakra)
        self._niji, self._sarvajanik = self._kunji_prabandh.utpadan(
            station_id.encode()
        )
        self._sanchaar_ready = True
    
    @property
    def sarvajanik_kunji(self) -> VakraBinku:
        """Get public key"""
        return self._sarvajanik
    
    def encode_sandesh(self, msg_type: int, data: bytes, peer_public: VakraBinku) -> Dict:
        """Encode and encrypt message"""
        # ECDH key exchange
        shared_secret = self._kunji_prabandh.ecdh_rahsya(peer_public)
        
        # Encrypt
        yantra = GuptikaranYantra(shared_secret)
        nonce, ciphertext, tag = yantra.guptan(data)
        
        return {
            "version": PROTOCOL_VERSION,
            "sender": self._station_id,
            "type": msg_type,
            "nonce": binascii.hexlify(nonce).decode(),
            "ciphertext": binascii.hexlify(ciphertext).decode(),
            "tag": binascii.hexlify(tag).decode(),
            "sender_public": {
                "x": hex(self._sarvajanik.x),
                "y": hex(self._sarvajanik.y)
            }
        }
    
    def decode_sandesh(self, message: Dict, sender_public: VakraBinku) -> bytes:
        """Decrypt received message"""
        # ECDH key exchange
        shared_secret = self._kunji_prabandh.ecdh_rahsya(sender_public)
        
        # Decrypt
        yantra = GuptikaranYantra(shared_secret)
        nonce = binascii.unhexlify(message["nonce"])
        ciphertext = binascii.unhexlify(message["ciphertext"])
        tag = binascii.unhexlify(message["tag"])
        
        return yantra.vishlesh(nonce, ciphertext, tag)


# ============================================================================
# ANALYSIS UTILITIES (विश्लेषण उपयोगिताएं)
# ============================================================================

class VishleshanYantra:
    """विश्लेषण यंत्र - Cryptanalysis tools"""
    
    @staticmethod
    def factor_analysis(n: int, max_factor: int = 2**20) -> List[Tuple[int, int]]:
        """
        Factor the curve order n
        
        WARNING: This is for testing only.
        Real implementation would use sophisticated factoring.
        """
        factors = []
        temp = n
        
        for p in range(2, min(max_factor, int(n**0.5) + 1)):
            if temp == 1:
                break
            exp = 0
            while temp % p == 0:
                temp //= p
                exp += 1
            if exp > 0:
                factors.append((p, exp))
        
        if temp > 1:
            factors.append((temp, 1))
        
        return factors
    
    @staticmethod
    def print_curve_info():
        """Print curve parameters for analysis"""
        params = VakraVichar.get_curve_params()
        
        print("\n" + "="*70)
        print("DMRC-CURVE-224 PARAMETERS")
        print("="*70)
        print(f"p (field prime): {hex(params['p'])}")
        print(f"a (coefficient): {hex(params['a'])}")
        print(f"b (coefficient): {hex(params['b'])}")
        print(f"Gx (generator x): {hex(params['Gx'])}")
        print(f"Gy (generator y): {hex(params['Gy'])}")
        print(f"n (curve order): {hex(params['n'])}")
        print(f"h (cofactor): {params['h']}")
        print("\n" + "="*70)
        print("Hint: Analyze the curve order n for security weaknesses...")
        print("="*70 + "\n")


# ============================================================================
# MAIN
# ============================================================================

def main():
    print("""
╔══════════════════════════════════════════════════════════════════════╗
║     DMRC INTER-STATION SECURE COMMUNICATION PROTOCOL v2.4.1          ║
║                     Analysis Tool                                     ║
╚══════════════════════════════════════════════════════════════════════╝
    """)
    
    VishleshanYantra.print_curve_info()
    
    print("""
ANALYSIS STEPS:
1. Extract curve order n from parameters above
2. Factor n to check for small prime factors
3. If factors are small, Pohlig-Hellman attack is possible
4. Recover private keys from public keys
5. Decrypt captured_messages.json to find the flag

Tools: SageMath, factordb.com, yafu
    """)


if __name__ == "__main__":
    main()
