#!/usr/bin/env python3
"""
UNDERGROUND_0x1 Forensics Challenge Generator
Challenge: Signal Black - The DMRC Breach
Generates a 500MB memory dump with hidden flag fragments
"""

import os
import sys
import struct
import random
import hashlib
import zlib
import base64
from pathlib import Path

# Challenge Configuration
FLAG = "UG0x1{DMRC_0CC_Br34ch_Sh4str1_P4rk}"
OUTPUT_DIR = Path(__file__).parent.parent / "public" / "challenges" / "forensics" / "memhunt"
MEMORY_DUMP_SIZE = 500 * 1024 * 1024  # 500 MB

# Key derivation materials (players must find these from artifacts)
REGISTRY_SID = "S-1-5-21-1234567890-0987654321-1122334455-500"
EVENT_TIMESTAMP = "2024-12-30T02:47:23.123Z"
PCAP_SESSION_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

# Flag fragments hidden in different process heaps
FLAG_FRAGMENTS = [
    {"pid": 1284, "process": "svchost.exe", "heap_offset": 0x00A40000, "fragment": "DMRC_"},
    {"pid": 3456, "process": "powershell.exe", "heap_offset": 0x01B20000, "fragment": "0CC_"},
    {"pid": 2891, "process": "cmd.exe", "heap_offset": 0x00F10000, "fragment": "Br34ch_"},
    {"pid": 1892, "process": "explorer.exe", "heap_offset": 0x02A00000, "fragment": "Sh4str1_P4rk"},
]

# Red herring data to make analysis harder
RED_HERRINGS = [
    b"UG0x1{th1s_1s_n0t_th3_fl4g}",
    b"password: dmrc123!@#",
    b"admin:P@ssw0rd123",
    b"flag{wrong_flag_try_again}",
    b"SECRET_KEY=1234567890abcdef",
    b"API_TOKEN=fake_token_here",
    b"192.168.47.100 - DMRC-SERVER-01",
    b"185.220.101.45 - C2 SERVER (MALICIOUS)",
    b"\\\\DMRC-FILESERVER\\SECRET$",
    b"cbtc_config.xml.bak",
    b"train_schedule_2024.db",
    b"Signal_Control_Parameters.dat",
]

# Windows process structures (simplified)
PROCESS_HEADER = b"\x50\x52\x4F\x43"  # "PROC" magic

def derive_key():
    """Derive encryption key from cross-artifact data"""
    key_material = REGISTRY_SID + EVENT_TIMESTAMP + PCAP_SESSION_ID
    key = hashlib.sha256(key_material.encode()).digest()
    nonce = hashlib.sha256(key).digest()[:12]
    return key, nonce

def encode_fragment(fragment: str) -> bytes:
    """Encode a flag fragment: compress -> base85 -> XOR obfuscate"""
    # Compress with zlib
    compressed = zlib.compress(fragment.encode())
    
    # Encode with base85 (ascii85)
    encoded = base64.a85encode(compressed)
    
    # Simple XOR obfuscation (players need to figure out the key)
    key = b"DMRC"
    obfuscated = bytes([b ^ key[i % len(key)] for i, b in enumerate(encoded)])
    
    return obfuscated

def create_process_structure(pid: int, process_name: str, heap_data: bytes, heap_offset: int) -> bytes:
    """Create a fake Windows process structure with heap data"""
    structure = bytearray()
    
    # Process header
    structure.extend(PROCESS_HEADER)
    structure.extend(struct.pack("<I", pid))  # PID
    structure.extend(process_name.encode().ljust(32, b'\x00'))  # Process name
    structure.extend(struct.pack("<I", heap_offset))  # Heap base address
    structure.extend(struct.pack("<I", len(heap_data)))  # Heap size
    
    # Padding to align heap
    padding_size = heap_offset - len(structure) - 0x1000  # Leave some space
    if padding_size > 0:
        structure.extend(os.urandom(min(padding_size, 0x10000)))  # Random padding (max 64KB)
    
    # Heap data with the fragment
    structure.extend(heap_data)
    
    return bytes(structure)

def generate_heap_with_fragment(fragment: str, size: int = 0x20000) -> bytes:
    """Generate heap data with hidden encoded fragment"""
    heap = bytearray(os.urandom(size))  # Random data
    
    # Encode the fragment
    encoded = encode_fragment(fragment)
    
    # Hide in heap slack space (random position in last 25% of heap)
    insert_pos = random.randint(int(size * 0.75), size - len(encoded) - 100)
    
    # Add markers before/after for players to find
    marker_before = b"\xDE\xAD\xBE\xEF"  # Dead beef marker
    marker_after = b"\xCA\xFE\xBA\xBE"   # Cafebabe marker
    
    heap[insert_pos:insert_pos + len(marker_before)] = marker_before
    heap[insert_pos + len(marker_before):insert_pos + len(marker_before) + len(encoded)] = encoded
    heap[insert_pos + len(marker_before) + len(encoded):insert_pos + len(marker_before) + len(encoded) + len(marker_after)] = marker_after
    
    return bytes(heap)

def generate_memory_dump():
    """Generate the 500MB memory dump with all fragments"""
    print(f"[*] Generating {MEMORY_DUMP_SIZE / 1024 / 1024:.0f}MB memory dump...")
    
    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    output_file = OUTPUT_DIR / "signaling_memory.raw"
    
    with open(output_file, "wb") as f:
        bytes_written = 0
        
        # Write memory header
        header = b"MEMORYDUMP" + b"\x00" * 6 + struct.pack("<Q", MEMORY_DUMP_SIZE)
        f.write(header)
        bytes_written += len(header)
        print(f"  [+] Header: {len(header)} bytes")
        
        # Write each process with its flag fragment
        for proc in FLAG_FRAGMENTS:
            print(f"  [+] Creating process: {proc['process']} (PID {proc['pid']})")
            
            # Generate heap with hidden fragment
            heap = generate_heap_with_fragment(proc["fragment"])
            
            # Create process structure
            process_data = create_process_structure(
                proc["pid"],
                proc["process"],
                heap,
                proc["heap_offset"]
            )
            
            f.write(process_data)
            bytes_written += len(process_data)
        
        # Add red herrings scattered throughout
        print("  [+] Adding red herrings...")
        for i, herring in enumerate(RED_HERRINGS):
            # Random padding before herring
            padding = os.urandom(random.randint(0x1000, 0x10000))
            f.write(padding)
            f.write(herring)
            f.write(b"\x00" * 100)  # Null padding after
            bytes_written += len(padding) + len(herring) + 100
        
        # Fill remaining space with realistic-looking data
        print("  [+] Filling remaining space with noise...")
        remaining = MEMORY_DUMP_SIZE - bytes_written
        
        # Write in 1MB chunks for efficiency
        chunk_size = 1024 * 1024
        chunks_written = 0
        
        while remaining > 0:
            write_size = min(chunk_size, remaining)
            
            # Mix of patterns: random data, zeroes, and repeated patterns
            pattern_type = random.randint(0, 2)
            if pattern_type == 0:
                chunk = os.urandom(write_size)
            elif pattern_type == 1:
                chunk = b"\x00" * write_size
            else:
                pattern = os.urandom(64)
                chunk = (pattern * (write_size // 64 + 1))[:write_size]
            
            f.write(chunk)
            remaining -= write_size
            chunks_written += 1
            
            # Progress indicator
            if chunks_written % 50 == 0:
                progress = ((MEMORY_DUMP_SIZE - remaining) / MEMORY_DUMP_SIZE) * 100
                print(f"    Progress: {progress:.1f}%")
    
    print(f"[✓] Memory dump created: {output_file}")
    print(f"    Size: {os.path.getsize(output_file) / 1024 / 1024:.1f} MB")
    
    return output_file

def generate_solution_file():
    """Generate solution documentation for internal use"""
    solution = f"""# Solution: Signal Black - The DMRC Breach

## Key Derivation Data
- Registry SID: `{REGISTRY_SID}`
- Event Timestamp: `{EVENT_TIMESTAMP}`
- PCAP Session ID: `{PCAP_SESSION_ID}`

## XOR Key for Fragment Decoding
- Key: `DMRC`

## Fragment Locations
"""
    for proc in FLAG_FRAGMENTS:
        solution += f"- PID {proc['pid']} ({proc['process']}): `{proc['fragment']}` at heap offset 0x{proc['heap_offset']:08X}\n"
    
    solution += f"""
## Fragment Markers
- Before: `DE AD BE EF`
- After: `CA FE BA BE`

## Decoding Steps
1. Find markers in memory dump
2. Extract data between markers
3. XOR with key "DMRC"
4. Base85 (ascii85) decode
5. Zlib decompress
6. Concatenate fragments in PID order

## Final Flag
`{FLAG}`

## Python Solution Script
```python
import zlib
import base64

# XOR key
key = b"DMRC"

# After extracting encoded fragments from memory dump:
def decode_fragment(encoded):
    # XOR decrypt
    decrypted = bytes([b ^ key[i % len(key)] for i, b in enumerate(encoded)])
    # Base85 decode
    decoded = base64.a85decode(decrypted)
    # Zlib decompress
    return zlib.decompress(decoded).decode()

# Fragments in PID order: 1284, 1892, 2891, 3456
# Assemble: DMRC_ + 0CC_ + Br34ch_ + Sh4str1_P4rk
# Wrap in flag format: UG0x1{{...}}
```
"""
    
    solution_file = OUTPUT_DIR / "SOLUTION_INTERNAL.md"
    with open(solution_file, "w", encoding="utf-8") as f:
        f.write(solution)
    
    print(f"[✓] Solution file: {solution_file}")

def generate_incident_brief():
    """Generate the incident brief readme for players"""
    brief = """╔══════════════════════════════════════════════════════════════════════╗
║        DMRC CYBER SECURITY DIVISION - INCIDENT BRIEF                  ║
║                    CLASSIFIED - LEVEL 4 CLEARANCE                     ║
╚══════════════════════════════════════════════════════════════════════╝

INCIDENT ID: DMRC-SEC-2024-1230
DATE: December 30, 2024
LOCATION: Delhi Metro Rail Corporation - Central Command Center (Shastri Park)
CLASSIFICATION: CRITICAL

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SITUATION REPORT:

At 02:47 hours IST, our Security Operations Center detected anomalous 
network traffic originating from workstation DMRC-SIGNAL-007 at the 
Shastri Park depot's Signaling & Train Control division.

OBSERVED ANOMALIES:
• Unusual outbound traffic to external IP 185.220.101.45 (traced to Eastern Europe)
• Massive data exfiltration (~500MB) including train scheduling algorithms
• CBTC (Communication-Based Train Control) system configurations accessed
• Windows Security Event Logs cleared using "wevtutil cl Security"

COMPROMISED ASSETS:
• Signaling workstation: DMRC-SIGNAL-007
• Network segment: 192.168.47.0/24 (Blue Line Control)
• Database: dmrc-ops.internal (Train scheduling DB)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOUR MISSION:

Analyze the forensic artifacts captured before the system was reimaged.
Reconstruct the attack chain and identify the exfiltrated data.

The threat actor left traces across multiple artifacts. Cross-correlation
is REQUIRED to recover the full picture.

ARTIFACTS PROVIDED:
┌─────────────────────────────────────────────────────────────────────┐
│ signaling_memory.raw   - Memory dump from DMRC-SIGNAL-007 (500MB)  │
│ blue_line_traffic.pcap - Captured OCC network traffic (15MB)       │
│ registry_SYSTEM.hive   - Registry from signaling workstation (2MB) │
│ event_logs_carved.bin  - Carved deleted security logs (5MB)        │
│ train_config.bak       - Partial CBTC config backup (1MB)          │
└─────────────────────────────────────────────────────────────────────┘

INTEL HINTS:
1. The attacker used multiple processes to stage data
2. Look for suspicious heap allocations
3. Deleted logs can be carved from unallocated space
4. Registry timestamps may have been manipulated
5. Custom binary protocol used for C2 communication

FLAG FORMAT: UG0x1{...}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TOOLS RECOMMENDED:
• Volatility 3 (memory analysis)
• Wireshark / Scapy (network analysis)
• Registry Explorer (registry analysis)
• Autopsy / Sleuth Kit (disk forensics)
• Python (scripting)

Good luck, operator. Delhi Metro's security depends on you.

— DMRC Cyber Security Division
"""
    
    brief_file = OUTPUT_DIR / "INCIDENT_BRIEF.txt"
    with open(brief_file, "w", encoding="utf-8") as f:
        f.write(brief)
    
    print(f"[✓] Incident brief: {brief_file}")

def main():
    print("=" * 60)
    print("UNDERGROUND_0x1 Forensics Challenge Generator")
    print("Challenge: Signal Black - The DMRC Breach")
    print("=" * 60)
    print()
    
    # Generate all artifacts
    generate_memory_dump()
    generate_solution_file()
    generate_incident_brief()
    
    print()
    print("=" * 60)
    print("[✓] Challenge generation complete!")
    print(f"[i] Output directory: {OUTPUT_DIR}")
    print(f"[i] Flag: {FLAG}")
    print("=" * 60)

if __name__ == "__main__":
    main()
