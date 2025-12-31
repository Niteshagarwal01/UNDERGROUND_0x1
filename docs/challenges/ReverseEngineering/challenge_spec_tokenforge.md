# Reverse Engineering Challenge: Token Forge - The Magenta Line Breach

## Challenge Metadata
| Field | Value |
|-------|-------
| **Name** | Token Forge: The Magenta Line Breach |
| **Category** | Reverse Engineering |
| **Difficulty** | MEDIUM (But No Mercy!) |
| **Points** | 350 |
| **Solve Time** | 3-4 hours |
| **Flag** | `UG0x1{M4g3nt4_T0k3n_F0rg3d_N0ID4}` |

---

## Challenge Story

> **DMRC SECURITY ALERT - MAGENTA LINE**
>
> **Date:** December 31, 2024  
> **Location:** Sector 52 Metro Station, Noida (Magenta Line)
>
> An unauthorized token generator has been discovered on the dark web, specifically 
> targeting the Magenta Line's smart card validation system. The binary appears to 
> generate valid AFC (Automatic Fare Collection) tokens.
>
> Our security team recovered the binary but it's heavily obfuscated. The author 
> left taunting messages referencing multiple metro lines.
>
> **Your mission:** Reverse engineer the token generator, understand the validation 
> algorithm, and extract the hidden flag.
>
> The flag proves you understand how the attacker bypassed the fare system.
>
> *— DMRC Cyber Intelligence Unit*

---

## Technical Specification

### Binary Details
- **Format:** Windows PE32+ (x64) or ELF64
- **Language:** C with inline assembly
- **Size:** ~50KB
- **Stripped:** Yes (no debug symbols)

### Protection Layers (4 Total)

#### Layer 1: String Obfuscation
All strings are XOR encrypted with metro line names as keys:
```c
// Encrypted strings use different line names as keys
char* key_red = "Dilshad Garden";      // Red Line terminus
char* key_yellow = "Samaypur Badli";   // Yellow Line terminus  
char* key_magenta = "Botanical Garden"; // Magenta Line terminus
char* key_pink = "Majlis Park";        // Pink Line terminus
char* key_violet = "Kashmere Gate";    // Violet Line terminus
```

#### Layer 2: Control Flow Obfuscation
- Fake conditional branches based on station codes
- Opaque predicates using station distances
- Function pointers stored in "route table" array

#### Layer 3: Anti-Debugging Checks
```c
// Multiple anti-debug techniques
- IsDebuggerPresent() check
- Timing checks (QueryPerformanceCounter)
- PEB.BeingDebugged flag check
- INT 2D anti-debug interrupt
- NtQueryInformationProcess checks
```

#### Layer 4: Custom Validation Algorithm
The "token validation" uses metro line colors and station counts:
```c
// Token structure (player must reverse this)
struct Token {
    uint32_t line_id;        // Metro line identifier
    uint32_t station_from;   // Source station code
    uint32_t station_to;     // Destination station code
    uint32_t timestamp;      // Journey timestamp
    uint64_t checksum;       // Custom checksum algorithm
};

// Checksum uses: line_color_code * station_count + XOR(station_names)
```

---

## Metro Line Data (Embedded in Binary)

```c
// Delhi Metro Lines - used throughout the binary
typedef struct {
    char* name;
    char* color_code;  // Hex color
    int station_count;
    char* terminus_1;
    char* terminus_2;
} MetroLine;

MetroLine lines[] = {
    {"Red Line",     "#EE3124", 29, "Rithala", "Shaheed Sthal"},
    {"Yellow Line",  "#FFCB05", 37, "Samaypur Badli", "HUDA City Centre"},
    {"Blue Line",    "#0066B3", 50, "Dwarka Sector 21", "Noida Electronic City"},
    {"Green Line",   "#00A650", 21, "Kirti Nagar", "Brigadier Hoshiar Singh"},
    {"Violet Line",  "#8B5BA6", 34, "Kashmere Gate", "Raja Nahar Singh"},
    {"Pink Line",    "#E31E88", 38, "Majlis Park", "Shiv Vihar"},
    {"Magenta Line", "#BB2299", 25, "Botanical Garden", "Janakpuri West"},
    {"Grey Line",    "#8C8C8C", 3, "Dwarka", "Najafgarh"},
    {"Aqua Line",    "#00B5AD", 21, "Noida Sector 51", "NOIDA Depot"},
    {"Airport Line", "#F7931E", 6, "New Delhi", "Dwarka Sector 21"}
};
```

---

## Binary Behavior

### Normal Execution:
```
$ ./token_forge.exe
╔════════════════════════════════════════════════╗
║     DMRC Token Generator v3.14159              ║
║     [UNAUTHORIZED - EDUCATIONAL USE ONLY]      ║
╚════════════════════════════════════════════════╝

Enter your authentication key: ________

[!] Invalid key. Access denied.
[!] Hint: The key is hidden in the Magenta Line...
```

### With Correct Key:
```
$ ./token_forge.exe
Enter your authentication key: ________

[✓] Authentication successful!
[✓] Token generator unlocked.
[✓] Flag: UG0x1{M4g3nt4_T0k3n_F0rg3d_N0ID4}
```

---

## Solution Path

### Step 1: Initial Static Analysis (30-45 min)
1. Load in Ghidra/IDA Pro
2. Identify main() function (look for print statements)
3. Notice string table is encrypted
4. Find XOR decryption routine

### Step 2: String Decryption (30 min)
```python
# Players must identify the XOR keys from metro data
def decrypt_string(encrypted, key):
    return bytes([c ^ key[i % len(key)] for i, c in enumerate(encrypted)])

# Key discovery: look for metro terminus names in rodata
key = b"Botanical Garden"  # Magenta Line terminus
```

### Step 3: Bypass Anti-Debug (45 min)
Players can either:
- Patch out anti-debug checks (NOP sled)
- Use x64dbg with ScyllaHide plugin
- Set hardware breakpoints instead of software

### Step 4: Understand Token Algorithm (60 min)
```c
// The validation function (obfuscated)
bool validate_key(char* input) {
    // Key format: LINE-STATION1-STATION2-CHECKSUM
    // Example: MAGENTA-SEC52-BOTAN-A7B3
    
    uint32_t line_hash = hash_line_name(parts[0]);
    uint32_t src_code = hash_station(parts[1]);
    uint32_t dst_code = hash_station(parts[2]);
    
    // Checksum = (line_color_code + station_count) ^ timestamp_mask
    uint16_t expected = calculate_checksum(line_hash, src_code, dst_code);
    
    return memcmp(parts[3], &expected, 2) == 0;
}
```

### Step 5: Generate Valid Key (15 min)
```python
# After reversing the algorithm:
line = "MAGENTA"
station_1 = "SEC52"      # Sector 52
station_2 = "BOTAN"      # Botanical Garden
checksum = calculate_checksum(line, station_1, station_2)

key = f"{line}-{station_1}-{station_2}-{checksum:04X}"
print(key)  # MAGENTA-SEC52-BOTAN-A7B3
```

---

## Anti-Solving Features

1. **Red Herrings:**
   - Fake flag: `UG0x1{y0u_f0und_th3_wr0ng_fl4g}`
   - Invalid token algorithms that look real
   - Decoy strings referencing wrong lines

2. **Time Wasters:**
   - Blue Line references (most common, players gravitate here)
   - Yellow Line station data (most familiar to players)
   - Fake "easy" path with obvious XOR key

3. **Skill Checks:**
   - Must understand PE/ELF structure
   - Must bypass anti-debug without crashing
   - Must reverse custom hash algorithm

---

## Files to Create

1. `token_forge.c` - Source code (kept private)
2. `token_forge.exe` - Windows binary for players
3. `token_forge` - Linux ELF binary (optional)
4. `generate_token_forge.py` - Build script
5. `SOLUTION.md` - Internal writeup

---

## Build Instructions

```bash
# Compile with optimizations and strip
gcc -O2 -s -o token_forge token_forge.c -luser32

# For Windows cross-compile from Linux:
x86_64-w64-mingw32-gcc -O2 -s -o token_forge.exe token_forge.c

# Add anti-debug includes for Windows:
# #include <windows.h>
# #include <winternl.h>
```

---

## Admin Panel Entry

| Field | Value |
|-------|-------|
| **Title** | Token Forge: The Magenta Line Breach |
| **Category** | Reverse Engineering |
| **Difficulty** | MEDIUM |
| **Points** | 350 |
| **Flag** | `UG0x1{M4g3nt4_T0k3n_F0rg3d_N0ID4}` |

### Description:
```
An unauthorized token generator targeting the Magenta Line's smart card system 
has surfaced on the dark web. Reverse engineer the binary and extract the flag.

The author was clever - multiple metro lines are referenced as decoys.
Only the Magenta Line holds the secret.

Format: Windows PE64 executable
Tools: Ghidra, x64dbg, Python
Difficulty: No mercy. 🔥
```

---

## Estimated Build Time
| Component | Time | Complexity |
|-----------|------|------------|
| Core validation logic | 2 hours | Medium |
| String obfuscation | 1 hour | Medium |
| Anti-debug checks | 1 hour | Medium |
| Control flow obfuscation | 1.5 hours | High |
| Testing & polish | 1 hour | Medium |
| **Total** | **6-7 hours** | **Medium-High** |

---

## Proceed?

Ready to create the C source code and build the binary?
