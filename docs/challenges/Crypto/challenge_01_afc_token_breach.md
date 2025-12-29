# Crypto Challenge 1: AFC Token Breach
## Difficulty: MEDIUM (300 pts)

---

## Flag
`UG0x1{4fc_d33p_c0d3_4n4lys1s}`

---

## Challenge Description (for Admin Panel)

```
INCIDENT REPORT #AFC-7742-BREACH

On October 15, 2024, DMRC Security Division identified anomalous 
activity in the legacy AFC token authentication system at Sector 18 
depot. Forensic analysis revealed a vulnerability in the proprietary 
TokenCipher protocol deployed across 127 stations.

We have extracted the complete cryptographic implementation from a 
decommissioned AFC terminal. The source code spans multiple modules 
with embedded validation routines.

Your mission: Analyze the implementation. Identify the cryptographic 
weakness. Decrypt the master token.

Archive Password: Hidden in this briefing.
Classification: MEDIUM
Clearance Required: Level 3
```

**Password Hidden:** `AFC774215Oct` (from "AFC-7742" + "October 15" → AFC774215Oct)

---

## Download Package

`afc_token_breach.zip` (Password Protected)

**Contents:**
```
afc_crypto_v3/
├── src/
│   ├── core/
│   │   ├── block_cipher.py      (800 lines)
│   │   ├── key_schedule.py      (600 lines)
│   │   ├── sbox_tables.py       (400 lines - VULNERABILITY HERE)
│   │   └── permutation.py       (300 lines)
│   ├── modes/
│   │   ├── cbc_mode.py          (400 lines)
│   │   ├── ctr_mode.py          (350 lines)
│   │   └── gcm_mode.py          (500 lines)
│   ├── padding/
│   │   ├── pkcs7.py             (200 lines)
│   │   └── custom_pad.py        (250 lines)
│   └── utils/
│       ├── bit_ops.py           (300 lines)
│       └── entropy.py           (150 lines)
├── test_vectors/
│   ├── known_pairs_batch1.json  (50 pairs)
│   ├── known_pairs_batch2.json  (50 pairs)
│   ├── known_pairs_batch3.json  (50 pairs)
│   └── known_pairs_batch4.json  (50 pairs)
├── docs/
│   └── AFC_Crypto_Spec_v3.pdf   (50 pages)
├── encrypted/
│   └── master_token.enc
└── config/
    └── system_params.json
```

---

## The Vulnerability

**Location:** `src/core/sbox_tables.py` around line 247

**Issue:** One of the S-boxes (`SBOX_DHARAVI`) has a linear approximation bias of 2^-3 (too high - should be 2^-6 or lower)

**Attack:** Linear cryptanalysis
1. Identify the weak S-box by analyzing all 8 S-boxes
2. Find the linear trails through the cipher
3. Collect ~2^12 known plaintexts (player must identify which test vectors are useful)
4. Recover key bits using linear approximation
5. Brute force remaining key bits
6. Decrypt master_token.enc

---

## Solve Path

### Step 1: Extract the Zip
- Read description carefully
- Find password: AFC-7742 + October 15 → `AFC774215Oct`

### Step 2: Understand the Cipher
- Study `block_cipher.py` - custom 64-bit block cipher, 8 rounds
- Study `key_schedule.py` - understand key expansion
- Study `sbox_tables.py` - 8 different S-boxes used

### Step 3: Find the Weakness
- Analyze each S-box for linear/differential properties
- `SBOX_DHARAVI` (S-box index 4) has linear bias
- Calculate Linear Approximation Table (LAT) for each S-box

### Step 4: Mount Linear Attack
- Identify useful test vectors (not all 200 are needed)
- Build linear approximation for full cipher
- Recover key bits
- Decrypt flag

---

## Admin Panel Data

| Field | Value |
|-------|-------|
| Title | AFC Token Breach |
| Slug | afc-token-breach |
| Category | Crypto |
| Difficulty | MEDIUM |
| Points | 300 |
| Flag | `UG0x1{4fc_d33p_c0d3_4n4lys1s}` |
| Download Link | `/challenges/crypto/afc_token_breach.zip` |

---

## Time Estimate

| Skill Level | Time |
|-------------|------|
| Expert | 1.5-2 hours |
| Intermediate | 2-4 hours |
| Beginner | 4-6 hours (if they can solve at all) |

---

## Anti-AI Measures

1. **Size:** 4000+ lines - exceeds context window
2. **Obfuscation:** Hindi variable names (Dharavi, Karmabhumi, Sankalp, etc.)
3. **Noise:** 7 secure S-boxes, 1 weak one
4. **Test vectors:** 200 pairs, only ~10 are useful for the attack
5. **Documentation:** 50-page spec with intentional errors
