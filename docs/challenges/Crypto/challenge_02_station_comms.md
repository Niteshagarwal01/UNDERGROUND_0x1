# Crypto Challenge 2: Station Comms - HARD (500 pts)

## Overview

| Field | Value |
|-------|-------|
| Title | Station Comms Intercept |
| Category | Crypto |
| Difficulty | HARD |
| Points | 500 |
| Flag | `UG0x1{w34k_curv3_p0hl1g_h3llm4n}` |
| Estimated Time | 4-8 hours |

---

## Concept

Players intercept encrypted communications between Delhi Metro stations. The encryption uses a **custom ECC implementation** with a deliberately weak elliptic curve vulnerable to **Pohlig-Hellman attack**.

---

## The Vulnerability

**Weak Curve Order:** The curve's group order has small prime factors, making discrete log solvable via Pohlig-Hellman algorithm.

```
Curve: y² = x³ + ax + b (mod p)
p = large prime (~256 bits)
Order n = small_prime1 × small_prime2 × small_prime3 × ... 
```

When n has small factors (< 2^20), Pohlig-Hellman can solve ECDLP in each subgroup.

---

## Challenge Structure

### Files Provided:
1. `station_crypto.py` - ECC implementation (~800 lines)
2. `captured_messages.json` - 50 intercepted encrypted messages
3. `public_keys.json` - Station public keys
4. `curve_params.py` - Curve parameters (hidden weakness)
5. `README.md` - Setup instructions

### Hidden Vulnerability Location:
- `curve_params.py` line ~45: The curve order `n` factors into small primes
- Comment says "Optimized for embedded AFC terminals" - hint that shortcuts were taken

---

## Solve Path

### Step 1: Analyze the Curve
```python
# Extract curve order n from curve_params.py
n = 0x... 
# Factor n (using factordb, yafu, or SageMath)
# Discover: n = p1 × p2 × p3 × p4 × p5 where all pi < 2^20
```

### Step 2: Pohlig-Hellman Attack
```python
from sage.all import *

# For each small prime factor pi:
# 1. Compute Q_i = (n/pi) * Q  (public key scaled)
# 2. Compute G_i = (n/pi) * G  (generator scaled)
# 3. Solve discrete log in small subgroup
# 4. Use CRT to combine partial discrete logs

def pohlig_hellman(G, Q, n, factors):
    residues = []
    moduli = []
    for p, e in factors:
        G_sub = (n // p**e) * G
        Q_sub = (n // p**e) * Q
        # Solve DLP in subgroup of order p^e
        d_sub = discrete_log(Q_sub, G_sub, ord=p**e)
        residues.append(d_sub)
        moduli.append(p**e)
    return crt(residues, moduli)
```

### Step 3: Recover Private Key
- Use recovered private key to decrypt messages
- One message contains the flag

---

## Anti-AI Measures

1. **800+ lines** of ECC implementation
2. **Hindi variable names** for curve operations
3. **50 messages** - must identify which one has the flag
4. **Multiple curves defined** - only one is weak
5. **Realistic station names** and protocols

---

## Admin Panel Entry

| Field | Value |
|-------|-------|
| Title | Station Comms Intercept |
| Category | Crypto |
| Difficulty | HARD |
| Points | 500 |
| Flag | `UG0x1{w34k_curv3_p0hl1g_h3llm4n}` |

### Description:
```
Our field agents intercepted encrypted communications between Delhi Metro 
control stations. The messages appear to use elliptic curve cryptography 
for key agreement.

Intelligence suggests the implementation was rushed to meet deployment 
deadlines. Find the weakness in the cryptosystem and decrypt the 
classified station communications.

Note: Standard curves weren't "compatible" with legacy AFC terminals.
```

---

## Files to Create

- [ ] `challenges/crypto/station_comms/curve_params.py`
- [ ] `challenges/crypto/station_comms/station_crypto.py`
- [ ] `challenges/crypto/station_comms/captured_messages.json`
- [ ] `challenges/crypto/station_comms/public_keys.json`
- [ ] `challenges/crypto/station_comms/README.md`
- [ ] `challenges/crypto/station_comms.zip` (password protected)
- [ ] `docs/challenges/Crypto/challenge_02_station_comms.md`
