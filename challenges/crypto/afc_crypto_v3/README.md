# DMRC AFC Crypto Library v3.1

**Automatic Fare Collection Token Authentication System**

This library implements the cryptographic primitives used in DMRC's 
AFC token authentication infrastructure.

---

## System Overview

The AFC system uses a custom 64-bit block cipher called **DharmaCipher** 
for token authentication. Each metro card token contains encrypted 
authentication data that is verified at entry/exit gates.

### Technical Specifications

| Parameter | Value |
|-----------|-------|
| Block Size | 64 bits |
| Key Size | 128 bits |
| Rounds | 8 |
| S-box Type | 4-bit to 4-bit (16 entries) |

### Station Code Integration

Each round of the cipher uses an S-box themed after Delhi Metro stations:

- Round 0: **Rajiv Chowk** (Central/Yellow line interchange)
- Round 1: **Kashmere Gate** (Red/Yellow/Violet interchange)
- Round 2: **Chandni Chowk** (Yellow line)
- Round 3: **Nehru Place** (Violet line)
- Round 4: **Dwarka** (Blue line terminus)
- Round 5: **Connaught Place** (Central business district)
- Round 6: **Hauz Khas** (Yellow/Magenta interchange)
- Round 7: **Central Secretariat** (Yellow/Violet interchange)

---

## Directory Structure

```
afc_crypto_v3/
├── src/
│   ├── core/           # Block cipher implementation
│   │   ├── block_cipher.py
│   │   ├── sbox_tables.py
│   │   ├── key_schedule.py
│   │   └── permutation.py
│   └── utils/          # Utility functions
│       └── bit_ops.py
├── test_vectors/       # Validation test cases
├── encrypted/          # Sample encrypted tokens
├── docs/               # Extended documentation
└── config/             # Configuration files
```

---

## Security Audit Status

**Last Audit:** 2024-Q2
**Classification:** DMRC-SEC-L3 (Internal)
**Auditor:** Internal Security Team

### Audit Findings

All S-boxes were verified for standard cryptographic properties:
- Non-linearity: Minimum 4 (acceptable)
- Differential uniformity: Maximum 4 (acceptable)
- Bijective: Verified for all 8 S-boxes

> **Note:** Legacy compatibility requirements for AFC terminals 
> deployed in October 2019 at AFC Gate 774215 required retention 
> of original S-box implementations. See internal memo 
> DMRC-CRYPTO-2019-047 for details.

---

## Usage Example

```python
from afc_crypto_v3.src.core import DharmaCipher

# Initialize cipher with 128-bit key
key = bytes.fromhex("4146435f544f4b454e5f4b45595f3231")
cipher = DharmaCipher(key)

# Encrypt a token block
plaintext = b"metrotok"  # 8 bytes
ciphertext = cipher.encrypt_block(plaintext)

# Decrypt
decrypted = cipher.decrypt_block(ciphertext)
assert decrypted == plaintext
```

---

## Test Validation

To verify the implementation:

```bash
cd afc_crypto_v3/src/core
python block_cipher.py
python sbox_tables.py
```

All self-tests should pass before deployment.

---

## Contact

For security concerns, contact the DMRC Security Division.

**Document Version:** 3.1.7-rev2
**Last Updated:** 2024-10-15
