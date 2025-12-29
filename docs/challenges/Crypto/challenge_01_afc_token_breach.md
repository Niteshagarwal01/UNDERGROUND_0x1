# Crypto Challenge 1: AFC Token Breach

## Difficulty: MEDIUM (300 pts)

---

## Flag

`UG0x1{dw4rk4_l1n34r_b14s_3xpl01t3d}`

---

## Challenge Description (Copy to Admin Panel)

```
DMRC's Automatic Fare Collection system uses a custom block cipher for 
token authentication. Our field agents recovered this cryptographic 
implementation from a compromised AFC terminal.

Intelligence suggests there's a weakness in the substitution layer. 
Find the vulnerability, exploit it, and decrypt the secret token.

Archive credentials: Reference deployment logs for AFC terminal 774215, 
commissioned October 2019.
```

**Password:** `AFC774215Oct`

---

## Admin Panel Entry

| Field | Value |
|-------|-------|
| Title | AFC Token Breach |
| Category | Crypto |
| Difficulty | MEDIUM |
| Points | 300 |
| Flag | `UG0x1{dw4rk4_l1n34r_b14s_3xpl01t3d}` |
| File | `afc_token_breach.zip` |

---

## Challenge Package Contents

| File | Description |
|------|-------------|
| `cipher.py` | 500+ line cipher with Hindi variable names |
| `flag.enc` | Real encrypted flag (ECB mode) |
| `test_vectors.txt` | 100 known plaintext-ciphertext pairs |
| `README.md` | Basic instructions |

---

## The Vulnerability

**Location:** `cipher.py` line ~95 (`_VIGRAH_DWARKA`)

**Issue:** Round 4 S-box is essentially `x XOR (x >> 2)` - linear, not non-linear

```python
_VIGRAH_DWARKA = bytes([
    0x00, 0x04, 0x08, 0x0C, 0x01, 0x05, 0x09, 0x0D,
    0x02, 0x06, 0x0A, 0x0E, 0x03, 0x07, 0x0B, 0x0F
])
```

**Analysis shows:**
- LAT[0x7][0x3] = 6 (bias = 0.375)
- LAT[0xB][0x9] = 6 (bias = 0.375)
- This is exploitable via linear cryptanalysis

---

## Solve Path

### Step 1: Extract ZIP
- Password from description: "AFC terminal 774215, October" → `AFC774215Oct`

### Step 2: Analyze Cipher
- Run `python cipher.py` to see S-box analysis
- Identify DWARKA S-box (round 4) as weak

### Step 3: Linear Cryptanalysis
- Use the high LAT bias entries
- Collect linear approximations from test vectors
- Recover key bits

### Step 4: Decrypt Flag
- Use recovered key with `DharmaSipher.vishlesh()` method

---

## Difficulty Factors

1. **500+ lines** of obfuscated code
2. **Hindi variable names** (guptan, vishlesh, kunji, etc.)
3. **8 S-boxes** - only 1 is weak
4. **Decoy modes** (CBC, CTR classes that don't work)
5. **Requires linear cryptanalysis knowledge**

---

## Time Estimate

| Skill Level | Time |
|-------------|------|
| Expert | 2-3 hours |
| Intermediate | 4-6 hours |
| Beginner | 8+ hours |
