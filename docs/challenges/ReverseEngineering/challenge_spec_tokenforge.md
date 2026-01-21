# Token Forge: The Magenta Line Breach

## Challenge Metadata
| Field | Value |
|-------|-------|
| **Category** | Reverse Engineering |
| **Difficulty** | MEDIUM |
| **Points** | 300 |
| **Flag** | `UG0x1{M4g3nt4_T0k3n_F0rg3d_N0ID4}` |
| **Admin Key** | `MAGENTA-BOT-JAN-B671` |

---

## Challenge Description (For Platform)

```
DMRC SECURITY ALERT - CLASSIFIED

Date: December 31, 2024
Location: Sector 52, Noida

Our forensics team recovered an unauthorized binary from a compromised 
ticketing terminal on the Magenta Line. Initial analysis suggests it's 
a sophisticated token generator targeting the AFC (Automatic Fare Collection) 
system.

The binary simulates a legitimate DMRC booking interface, but conceals 
a hidden authentication mechanism. Intelligence suggests the author 
embedded their signature somewhere within the validation routines.

Your mission: Reverse engineer the binary, understand the hidden 
authentication system, and extract the author's signature (flag).

⚠️ WARNING: The binary employs multiple protection mechanisms. 
Proceed with caution.

Binary: Windows PE64 / Linux ELF64
Tools: Ghidra, IDA Pro, x64dbg
Estimated Time: 3-5 hours
```

---

## Technical Architecture

### Protection Layers

| Layer | Mechanism | Purpose |
|-------|-----------|---------|
| 1 | XOR-encrypted flags | No strings visible in binary |
| 2 | Custom VM bytecode | Obfuscated key prefix validation |
| 3 | S-Box substitution | AES-style byte transformation |
| 4 | Anti-debugging (15+ checks) | Detects debuggers, timing attacks |
| 5 | Integrity verification | Magic value checks throughout |
| 6 | Math obfuscation | Complex arithmetic instead of direct comparisons |
| 7 | Volatile variables | Prevents compiler optimization attacks |

### Key Format
```
MAGENTA-BOT-JAN-B671
│       │   │   │
│       │   │   └── Checksum (4 hex chars)
│       │   └────── Destination: Janakpuri West (JAN)  
│       └────────── Source: Botanical Garden (BOT)
└────────────────── Metro Line: Magenta Line
```

### Checksum Calculation
```python
magenta_color = 0xBB2299
botanical_code = 0xB07A1CA1
janakpuri_code = 0x4A414E41

combined = magenta_color ^ botanical_code ^ janakpuri_code
hash_value = nightmare_hash(combined, seed=0x20241231)
checksum = hash_value & 0xFFFF  # = 0xB671
```

---

## Solution Walkthrough

### Phase 1: Initial Reconnaissance (30 min)
1. Run `file` and `strings` commands - observe no readable flags
2. Load in Ghidra or IDA Pro
3. Identify `main()` function and menu structure
4. Locate admin panel function (`_ap`)

### Phase 2: Understanding the VM (60 min)
1. Find `_ve()` function - custom bytecode interpreter
2. Reverse the bytecode in `_vc[]` array
3. Understand opcodes: LOAD, XOR, JNZ, HALT
4. Determine it validates "MAGENTA" prefix character by character

### Phase 3: Bypassing Anti-Debug (45 min)
1. Identify `_nad()` function - anti-debug master check
2. Notice: timing checks, debugger detection, PEB flags
3. Options:
   - Patch return value to 0
   - Use ScyllaHide plugin for x64dbg
   - Static analysis only (recommended)

### Phase 4: Key Validation Analysis (60 min)
1. Find `_vnk()` - key validation function
2. Reverse the obfuscated checks:
   - Length check: `(len * 0x1337) ^ 0x19A60`
   - Separator check: XOR with 0x2D (dash)
   - Station codes: `0x424F54` = "BOT", `0x4A414E` = "JAN"
3. Locate checksum calculation in `_cc()` and `_nh()`

### Phase 5: Extracting Data (30 min)
1. Find metro line data in `_ml[]` array
2. Find station data in `_ms[]` array
3. Extract: Magenta color (0xBB2299), station codes

### Phase 6: Calculating Checksum (30 min)
```python
def nightmare_hash(data, seed):
    h = seed ^ len(data)
    SBOX = [0x63, 0x7c, 0x77, ...]  # Extract from binary
    for byte in data:
        h ^= SBOX[byte]
        h = (h * 0x5bd1e995) & 0xFFFFFFFF
        h ^= h >> 15
        h = (h * 0x1b873593) & 0xFFFFFFFF
        h = ((h << 13) | (h >> 19)) & 0xFFFFFFFF
        h = (h * 5 + 0xe6546b64) & 0xFFFFFFFF
    h ^= h >> 16
    h = (h * 0x85ebca6b) & 0xFFFFFFFF
    h ^= h >> 13
    h = (h * 0xc2b2ae35) & 0xFFFFFFFF
    h ^= h >> 16
    h ^= 0xDEADC0DE
    h = ((h << 7) | (h >> 25)) & 0xFFFFFFFF
    h = (h * 0x1337CAFE) & 0xFFFFFFFF
    return h

combined = 0xBB2299 ^ 0xB07A1CA1 ^ 0x4A414E41
checksum = nightmare_hash(combined.to_bytes(4, 'little'), 0x20241231) & 0xFFFF
# Result: 0xB671
```

### Phase 7: Getting the Flag
1. Run binary
2. Select option 5 (Admin Panel)
3. Enter: `MAGENTA-BOT-JAN-B671`
4. Flag revealed: `UG0x1{M4g3nt4_T0k3n_F0rg3d_N0ID4}`

---

## Build Instructions

### Compile for Windows
```bash
x86_64-w64-mingw32-gcc -O2 -s -o token_forge.exe dmrc_booking.c
```

### Compile for Linux
```bash
gcc -O2 -s -o token_forge dmrc_booking.c
```

---

## Files

| File | Purpose |
|------|---------|
| `dmrc_booking.c` | Source code (INTERNAL ONLY) |
| `TokenForge_Challenge.zip` | Distribution package for players |

---

## Hints (If Needed)

1. **Hint 1 (50 pts):** "The garden blooms at one end, the sun sets at the other"
2. **Hint 2 (75 pts):** "Purple is just another name for it"
3. **Hint 3 (100 pts):** "Station codes in the data structures are your friends"
