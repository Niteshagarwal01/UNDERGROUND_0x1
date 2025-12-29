"""
DMRC AFC Crypto Library v3.1
============================

Core cryptographic library for DMRC Automatic Fare Collection tokens.

Modules:
- core: Block cipher implementation
- modes: Cipher modes of operation  
- padding: Padding schemes
- utils: Utility functions
"""

__version__ = "3.1.7"
__author__ = "DMRC Security Division"

from .core.block_cipher import DharmaCipher, create_cipher
from .core.sbox_tables import SBOX_RAJIV, SBOX_DWARKA  
from .utils.bit_ops import xor_bytes, rotate_left
