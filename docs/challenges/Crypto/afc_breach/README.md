# AFC Token Breach Challenge

## DMRC Automatic Fare Collection - Token Authentication System

This archive contains the cryptographic implementation recovered from 
a compromised AFC terminal at Sector 18 depot.

**Your mission:** Find the vulnerability, recover the key, decrypt the flag.

---

## Files

| File | Description |
|------|-------------|
| `cipher.py` | Complete cipher implementation (~500 lines) |
| `flag.enc` | Encrypted master token |
| `test_vectors.txt` | 100 known plaintext-ciphertext pairs |

---

## Technical Specifications

| Property | Value |
|----------|-------|
| Algorithm | DharmaCipher v3.1.7 |
| Block Size | 64 bits |
| Key Size | 128 bits |
| Rounds | 8 |
| S-boxes | 8 (station-themed, 4-bit) |
| Mode | ECB with PKCS7 |

---

## Getting Started

```bash
python cipher.py
```

This will run the built-in S-box analysis tool.

---

## Hint

Review memo DMRC-CRYPTO-2019-047 regarding the rushed deployment at 
AFC terminal 774215 in October 2019.

---

Classification: DMRC-SEC-L3  
Version: 3.1.7
