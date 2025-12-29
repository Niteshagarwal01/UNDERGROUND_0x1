# AFC Token Breach - Official Writeup

**Challenge:** AFC Token Breach  
**Category:** Crypto  
**Difficulty:** MEDIUM (300 pts)  
**Flag:** `UG0x1{dw4rk4_l1n34r_b14s_3xpl01t3d}`

---

## Challenge Description

> DMRC's Automatic Fare Collection system uses a custom block cipher for token authentication. Our field agents recovered this cryptographic implementation from a compromised AFC terminal.
>
> Intelligence suggests there's a weakness in the substitution layer. Find the vulnerability, exploit it, and decrypt the secret token.
>
> Archive credentials: Reference deployment logs for AFC terminal 774215, commissioned October 2019.

---

## Step 1: Extract the Archive

The challenge provides a password-protected ZIP file. The password is hidden in the description:

> "AFC terminal **774215**, commissioned **Oct**ober 2019"

Combining these: `AFC` + `774215` + `Oct` = **`AFC774215Oct`**

```bash
unzip -P AFC774215Oct afc_token_breach.zip
```

---

## Step 2: Analyze the Cipher

The archive contains:
- `cipher.py` - 500+ lines of cipher implementation
- `flag.enc` - Encrypted flag
- `test_vectors.txt` - 100 known plaintext-ciphertext pairs

Run the built-in analysis:

```bash
python cipher.py
```

This outputs the S-box analysis. Key finding:

```
[Round 4] DWARKA: ⚠️  WEAK
  Max LAT bias: 6 at position (7,3)
  Linear probability: 0.875
```

---

## Step 3: Identify the Vulnerability

Looking at the DWARKA S-box in `cipher.py` (around line 95):

```python
_VIGRAH_DWARKA = bytes([
    0x00, 0x04, 0x08, 0x0C, 0x01, 0x05, 0x09, 0x0D,
    0x02, 0x06, 0x0A, 0x0E, 0x03, 0x07, 0x0B, 0x0F
])
```

This is essentially `S(x) = x ^ (x >> 2)` - a **linear function**!

A proper S-box should be highly non-linear. The Linear Approximation Table (LAT) shows:
- `LAT[0x7][0x3] = 6` (bias = 0.375, probability = 0.875)
- `LAT[0xB][0x9] = 6` (bias = 0.375, probability = 0.875)

---

## Step 4: Linear Cryptanalysis Attack

With a bias of 0.375, we can exploit the linear approximation:

```
input_mask ⋅ x ⊕ output_mask ⋅ S(x) = 0  (with probability 0.875)
```

Using the 100 test vectors, we can:
1. Build linear approximations through round 4
2. Chain with adjacent rounds
3. Recover key bits

### Attack Script

```python
from cipher import DharmaSipher, PratishtapanTaalika, VishleshanYantra

# Load test vectors
vectors = []
with open('test_vectors.txt') as f:
    for line in f:
        if line.startswith('#'):
            continue
        pt, ct = line.strip().split('|')
        vectors.append((bytes.fromhex(pt), bytes.fromhex(ct)))

# Analyze DWARKA S-box
dwarka = PratishtapanTaalika._prapt_vigrah(4)
lat = VishleshanYantra.rekha_anuman_taalika(dwarka)

# Find best linear approximation
for a in range(16):
    for b in range(16):
        if abs(lat[a][b]) >= 6:
            print(f"LAT[{a:x}][{b:x}] = {lat[a][b]}")

# Key recovery using linear approximations
# (Full implementation requires ~50 lines of linear cryptanalysis code)
# Key bits recovered: partial key recovery allows brute force of remaining bits

# Once key is recovered:
key = bytes.fromhex("44574152414b415f4d455452305f3139")
cipher = DharmaSipher(key)

# Decrypt flag
with open('flag.enc') as f:
    lines = [l.strip() for l in f if not l.startswith('#') and l.strip()]
    ciphertext = bytes.fromhex(''.join(lines))

# Decrypt block by block
plaintext = b''
for i in range(0, len(ciphertext), 8):
    plaintext += cipher.vishlesh(ciphertext[i:i+8])

# Remove PKCS7 padding
pad_len = plaintext[-1]
flag = plaintext[:-pad_len].decode()
print(f"Flag: {flag}")
```

---

## Step 5: Get the Flag

After recovering the key and decrypting:

```
UG0x1{dw4rk4_l1n34r_b14s_3xpl01t3d}
```

---

## Key Takeaways

1. **Password hiding:** Look for numbers/dates in challenge descriptions
2. **S-box analysis:** Always compute LAT/DDT for custom ciphers
3. **Linear cryptanalysis:** Exploits high LAT bias values (>4 is weak)
4. **Code reading:** Hindi variable names add obfuscation but logic remains same

---

## References

- [Linear Cryptanalysis - Wikipedia](https://en.wikipedia.org/wiki/Linear_cryptanalysis)
- [A Tutorial on Linear and Differential Cryptanalysis](https://www.cs.bc.edu/~straubin/crypto2017/heys.pdf)
- [SPN Cipher Analysis](https://www.engr.mun.ca/~howard/PAPERS/ldc_tutorial.pdf)
