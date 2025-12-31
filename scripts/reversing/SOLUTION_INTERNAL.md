# Token Forge: The Magenta Line Breach - OFFICIAL WRITEUP

## Challenge Info
| Field | Value |
|-------|-------|
| **Category** | Reverse Engineering |
| **Difficulty** | MEDIUM (No Mercy Edition) |
| **Points** | 350 |
| **Flag** | `UG0x1{M4g3nt4_T0k3n_F0rg3d_N0ID4}` |
| **Admin Key** | `MAGENTA-BOT-JAN-B671` |

---

## Protection Layers (10 Total)

### 1. Multi-Layer String Encryption
- Layer 1: XOR with "DMRC"
- Layer 2: ROL 3 on each byte
- Layer 3: Byte substitution
- Layer 4: Position-based XOR

### 2. VM-Like Bytecode Interpreter
Key prefix validation uses a custom bytecode VM:
- Custom opcodes: LOAD, XOR, JNZ, HALT
- Must reverse the bytecode to understand validation

### 3. Anti-Debugging (10+ checks)
- `IsDebuggerPresent()`
- `CheckRemoteDebuggerPresent()`
- PEB.BeingDebugged flag
- PEB.NtGlobalFlag (heap flags)
- Hardware breakpoint detection (DR0-DR3)
- RDTSC timing checks
- Parent process name check
- INT 2D exception check
- Multiple timing traps

### 4. Opaque Predicates
- Fake branches that always/never execute
- Conditions based on RDTSC values
- Math-based impossible conditions

### 5. Control Flow Obfuscation
- Multiple paths through code
- Misleading function names
- Garbage code blocks

### 6. Integrity Checks
- Magic value: `0x1337BEEF`
- Canary: `0xCAFEBABE12345678`
- Modified = fake flag returned

### 7. Fake Flags (10 decoys)
```
UG0x1{y0u_f0und_th3_wr0ng_0n3}
UG0x1{n1c3_try_but_n0p3}
UG0x1{th1s_1s_4_d3c0y_fl4g}
UG0x1{k33p_d1gg1ng_d33p3r}
UG0x1{bl43_l1n3_1s_n0t_1t}
... and more
```

### 8. Nightmare Hash
MurmurHash3-based with multiple mixing rounds.

### 9. Random Decoy Responses
Failed attempts may leak random fake flags to mislead.

### 10. Hidden Station Codes
Stations have hidden validation codes that must be extracted.

---

## Solution Walkthrough

### Step 1: Initial Analysis (30 min)
```bash
# Check file type
file dmrc_booking.exe

# Look for strings (many will be encrypted/fake)
strings dmrc_booking.exe | grep -i "ug0x1\|flag\|magenta"

# Open in Ghidra/IDA
```

### Step 2: Identify Anti-Debug (45 min)
Find these functions and patch/bypass:
- `nightmare_anti_debug()` - Main check
- `check_timing()` - RDTSC check
- `check_peb()` - Windows debugger flags
- `check_hardware_bp()` - DR register check

**Bypass options:**
1. NOP out the checks (dangerous - integrity)
2. Use ScyllaHide plugin for x64dbg
3. Use hardware breakpoints only
4. Patch return values

### Step 3: Understand the VM (60 min)
The bytecode interpreter validates "MAGENTA" prefix:
```c
VM_OP_LOAD, 0, 0,       // reg0 = input[0]
VM_OP_XOR, 0, 0x4D,     // reg0 ^= 'M' (0x4D)
VM_OP_JNZ, 50,          // if not zero -> fail
```

Reverse the pattern: input must XOR to 0 with expected chars.

### Step 4: Find Key Format (30 min)
From `validate_nightmare_key()`:
- Length must be 20 characters
- Format: `MAGENTA-XXX-XXX-XXXX`
- XXX = 3-char station codes
- XXXX = 4-char hex checksum

### Step 5: Identify Correct Stations (30 min)
From hints and station data:
- "From the Garden" → Botanical Garden → code "BOT"
- "to the West" → Janakpuri West → code "JAN"

### Step 6: Calculate Checksum (45 min)
```python
def nightmare_hash(data, seed):
    h = seed ^ len(data)
    for b in data:
        h ^= b
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
    return h

# Calculate
MAGENTA_COLOR = 0xBB2299
BOTANICAL_CODE = 0xB07A1CA1
JANAKPURI_CODE = 0x4A414E41  # "JANA" in hex

combined = MAGENTA_COLOR ^ BOTANICAL_CODE ^ JANAKPURI_CODE
checksum = nightmare_hash(combined.to_bytes(4, 'little'), 0x20241231)
checksum &= 0xFFFF  # Lower 16 bits

print(f"Checksum: {checksum:04X}")  # B671
```

### Step 7: Build the Key
```
MAGENTA-BOT-JAN-B671
```

### Step 8: Submit Key
Run the binary, select option 5 (Admin Panel), enter the key.

---

## Complete Solution Script

```python
#!/usr/bin/env python3
"""
Token Forge Solver - Nightmare Edition
"""

def nightmare_hash(data: bytes, seed: int) -> int:
    h = seed ^ len(data)
    
    for b in data:
        h ^= b
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
    
    return h

def calculate_key():
    # Metro data
    MAGENTA_COLOR = 0xBB2299
    BOTANICAL_CODE = 0xB07A1CA1
    JANAKPURI_CODE = 0x4A414E414B505552  # Approximate
    
    # Simplify for solvability
    combined = MAGENTA_COLOR
    combined ^= 0xB07A1CA1  # Botanical
    combined ^= 0x4A414E41  # JANA
    
    timestamp_mask = 0x20241231
    
    full_hash = nightmare_hash(combined.to_bytes(4, 'little'), timestamp_mask)
    checksum = full_hash & 0xFFFF
    
    key = f"MAGENTA-BOT-JAN-{checksum:04X}"
    return key

if __name__ == "__main__":
    print("=" * 50)
    print("Token Forge - Nightmare Solver")
    print("=" * 50)
    
    key = calculate_key()
    print(f"\nAdmin Key: {key}")
    print(f"Flag: UG0x1{{M4g3nt4_T0k3n_F0rg3d_N0ID4}}")
```

---

## Tools Required
- Ghidra or IDA Pro
- x64dbg with ScyllaHide
- Python 3
- Hex editor
- Patience... lots of it

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
An underground token generator targeting the Magenta Line has surfaced.

This isn't your typical crackme. The author was paranoid:
- 10+ anti-debugging techniques
- VM-based validation
- Multi-layer encryption
- Fake flags everywhere
- Timing traps

The binary simulates a real DMRC booking system. Find the admin key hidden within the Magenta Line route.

⚠️ Warning: Debuggers will be detected. Good luck.

Tools: Ghidra, x64dbg (ScyllaHide recommended), Python
```

---

## Author Notes
- The checksum is intentionally B671 for the route Botanical → Janakpuri
- Date mask 2024-12-31 is hidden in the timestamp validation
- All metro lines except Magenta are red herrings
- The VM bytecode is simple but intimidating
