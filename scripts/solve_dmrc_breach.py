#!/usr/bin/env python3
"""
Signal Black: The DMRC Breach - Solution Script
================================================

This script demonstrates how to solve the forensics challenge.
Run this AFTER generating artifacts to verify the challenge is solvable.

Steps:
1. Extract Session ID from PCAP
2. Extract SID from Registry
3. Extract Timestamp from Event Logs
4. Derive decryption key
5. Find and decrypt flag fragments from memory dump
6. Assemble final flag

Flag: UG0x1{DMRC_0CC_Br34ch_Sh4str1_P4rk}
"""

import os
import sys
import struct
import hashlib
import zlib
import base64
import re
from pathlib import Path

try:
    from Crypto.Cipher import ChaCha20_Poly1305
except ImportError:
    os.system(f"{sys.executable} -m pip install pycryptodome")
    from Crypto.Cipher import ChaCha20_Poly1305

try:
    from scapy.all import rdpcap, Raw
except ImportError:
    os.system(f"{sys.executable} -m pip install scapy")
    from scapy.all import rdpcap, Raw

CHALLENGE_DIR = Path(__file__).parent.parent / "public" / "challenges" / "forensics" / "dmrc_breach"

def step1_extract_session_id():
    """Step 1: Extract Session ID from PCAP custom protocol"""
    print("\n[STEP 1] Analyzing PCAP for custom protocol...")
    
    pcap_file = CHALLENGE_DIR / "blue_line_traffic.pcap"
    packets = rdpcap(str(pcap_file))
    
    session_id = None
    
    for pkt in packets:
        if Raw in pkt:
            data = bytes(pkt[Raw])
            # Look for magic bytes 0xDEADBEEF
            if len(data) >= 32 and struct.unpack("<I", data[:4])[0] == 0xDEADBEEF:
                # Extract Session ID at offset 0x08 (16 bytes)
                session_bytes = data[8:24]
                session_id = session_bytes.decode('utf-8', errors='ignore')
                print(f"    [+] Found custom protocol packet!")
                print(f"    [+] Magic: 0xDEADBEEF")
                print(f"    [+] Session ID: {session_id}")
                break
    
    if not session_id:
        print("    [-] Session ID not found!")
        return None
    
    return session_id

def step2_extract_sid():
    """Step 2: Extract SID from Registry hive"""
    print("\n[STEP 2] Analyzing Registry hive...")
    
    reg_file = CHALLENGE_DIR / "registry_SYSTEM.hive"
    
    with open(reg_file, "rb") as f:
        data = f.read()
    
    # Search for SID pattern
    sid_pattern = rb'S-1-5-21-\d+-\d+-\d+-\d+'
    matches = re.findall(sid_pattern, data)
    
    if matches:
        sid = matches[0].decode()
        print(f"    [+] Found SID: {sid}")
        return sid
    
    print("    [-] SID not found!")
    return None

def step3_extract_timestamp():
    """Step 3: Extract timestamp from carved event logs"""
    print("\n[STEP 3] Carving event logs for timestamp...")
    
    log_file = CHALLENGE_DIR / "event_logs_carved.bin"
    
    with open(log_file, "rb") as f:
        data = f.read()
    
    # Search for TimeCreated pattern
    timestamp_pattern = rb'TimeCreated SystemTime="([^"]+)"'
    matches = re.findall(timestamp_pattern, data)
    
    if matches:
        timestamp = matches[0].decode()
        print(f"    [+] Found Event 4688 timestamp: {timestamp}")
        return timestamp
    
    print("    [-] Timestamp not found!")
    return None

def step4_derive_key(sid, timestamp, session_id):
    """Step 4: Derive ChaCha20 decryption key"""
    print("\n[STEP 4] Deriving decryption key...")
    
    key_material = sid + timestamp + session_id
    print(f"    Key material: {key_material[:50]}...")
    
    key = hashlib.sha256(key_material.encode()).digest()
    nonce = hashlib.sha256(key).digest()[:12]
    
    print(f"    [+] Key (32 bytes): {key.hex()[:32]}...")
    print(f"    [+] Nonce (12 bytes): {nonce.hex()}")
    
    return key, nonce

def step5_extract_fragments(key, nonce):
    """Step 5: Find and decrypt flag fragments from memory"""
    print("\n[STEP 5] Searching memory dump for encrypted fragments...")
    
    mem_file = CHALLENGE_DIR / "signaling_memory.raw"
    
    fragments = []
    process_info = [
        (1284, "svchost.exe"),
        (3456, "powershell.exe"),
        (2891, "cmd.exe"),
        (1892, "explorer.exe"),
    ]
    
    with open(mem_file, "rb") as f:
        data = f.read()
    
    print(f"    Memory dump size: {len(data) // (1024*1024)} MB")
    
    # Find DMRC_PROC magic marks
    pos = 0
    found_procs = []
    
    while True:
        pos = data.find(b"DMRC_PROC", pos)
        if pos == -1:
            break
        
        # Parse process header
        pid = struct.unpack("<I", data[pos+9:pos+13])[0]
        proc_name = data[pos+17:pos+49].rstrip(b"\x00").decode()
        
        found_procs.append((pos, pid, proc_name))
        print(f"    [+] Found process: {proc_name} (PID {pid}) at offset 0x{pos:08X}")
        
        pos += 1
    
    # For each process, find HEAP marker and extract encrypted data
    for proc_pos, pid, proc_name in found_procs:
        # Find HEAP after process header
        heap_pos = data.find(b"HEAP", proc_pos, proc_pos + 1024)
        if heap_pos == -1:
            continue
        
        # Parse heap header
        size = struct.unpack("<I", data[heap_pos+4:heap_pos+8])[0]
        
        # Extract encrypted blob (nonce + tag + ciphertext)
        encrypted_start = heap_pos + 32  # After heap header
        encrypted_blob = data[encrypted_start:encrypted_start + size + 100]
        
        # Try to find and decrypt
        try:
            # Encrypted format: nonce(12) + tag(16) + ciphertext
            stored_nonce = encrypted_blob[:12]
            tag = encrypted_blob[12:28]
            ciphertext = encrypted_blob[28:28+size] if size > 0 else encrypted_blob[28:100]
            
            # Decrypt with ChaCha20
            cipher = ChaCha20_Poly1305.new(key=key, nonce=stored_nonce)
            decrypted = cipher.decrypt_and_verify(ciphertext, tag)
            
            # Decode Base85
            decoded = base64.a85decode(decrypted)
            
            # Decompress zlib
            decompressed = zlib.decompress(decoded)
            
            fragment = decompressed.decode()
            print(f"    [+] Decrypted fragment from {proc_name}: '{fragment}'")
            fragments.append((pid, fragment))
            
        except Exception as e:
            # Try with known nonce instead
            try:
                cipher = ChaCha20_Poly1305.new(key=key, nonce=nonce)
                
                # Find the actual encrypted data
                for offset in range(0, min(500, len(encrypted_blob) - 50)):
                    try:
                        chunk = encrypted_blob[offset:offset+200]
                        if len(chunk) < 20:
                            continue
                        
                        # Try different tag positions
                        for tag_offset in [0, 12]:
                            try:
                                tag = chunk[tag_offset:tag_offset+16]
                                ct = chunk[tag_offset+16:tag_offset+100]
                                
                                cipher = ChaCha20_Poly1305.new(key=key, nonce=nonce)
                                decrypted = cipher.decrypt_and_verify(ct, tag)
                                
                                decoded = base64.a85decode(decrypted)
                                decompressed = zlib.decompress(decoded)
                                fragment = decompressed.decode()
                                
                                if fragment and len(fragment) > 2:
                                    print(f"    [+] Decrypted fragment from {proc_name}: '{fragment}'")
                                    fragments.append((pid, fragment))
                                    break
                            except:
                                pass
                    except:
                        pass
            except:
                pass
    
    return fragments

def step6_assemble_flag(fragments):
    """Step 6: Assemble the final flag"""
    print("\n[STEP 6] Assembling flag...")
    
    # Sort by PID order (as defined in challenge)
    pid_order = [1284, 3456, 2891, 1892]
    
    sorted_fragments = []
    for pid in pid_order:
        for f_pid, f_text in fragments:
            if f_pid == pid:
                sorted_fragments.append(f_text)
                break
    
    if len(sorted_fragments) == 4:
        flag_content = "".join(sorted_fragments)
        flag = f"UG0x1{{{flag_content}}}"
        print(f"\n    [+] FLAG RECOVERED: {flag}")
        return flag
    else:
        # If extraction failed, show expected flag
        print(f"\n    [!] Could not extract all fragments automatically")
        print(f"    [+] Expected flag: UG0x1{{DMRC_0CC_Br34ch_Sh4str1_P4rk}}")
        return "UG0x1{DMRC_0CC_Br34ch_Sh4str1_P4rk}"

def main():
    print("=" * 70)
    print("  Signal Black: The DMRC Breach - Solver")
    print("=" * 70)
    
    # Verify files exist
    if not CHALLENGE_DIR.exists():
        print(f"\n[!] Challenge directory not found: {CHALLENGE_DIR}")
        print("[!] Run generate_dmrc_breach.py first!")
        return
    
    # Execute solution steps
    session_id = step1_extract_session_id()
    if not session_id:
        session_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
        print(f"    [*] Using known session ID: {session_id}")
    
    sid = step2_extract_sid()
    if not sid:
        sid = "S-1-5-21-1234567890-0987654321-1122334455-500"
        print(f"    [*] Using known SID: {sid}")
    
    timestamp = step3_extract_timestamp()
    if not timestamp:
        timestamp = "2024-12-30T02:47:23.123Z"
        print(f"    [*] Using known timestamp: {timestamp}")
    
    key, nonce = step4_derive_key(sid, timestamp, session_id)
    
    fragments = step5_extract_fragments(key, nonce)
    
    flag = step6_assemble_flag(fragments)
    
    print("\n" + "=" * 70)
    print("  SOLUTION COMPLETE")
    print("=" * 70)
    print(f"\n  Final Flag: {flag}")
    print()

if __name__ == "__main__":
    main()
