#!/usr/bin/env python3
"""
DMRC Booking Challenge - Key Generator & Solver
This generates the correct admin key for the challenge
"""

import struct

# Metro line color codes
MAGENTA_LINE = 0xBB2299

# XOR key
XOR_KEY = b"DMRC"

def xor_encrypt(plaintext):
    """XOR encrypt/decrypt string"""
    result = []
    for i, c in enumerate(plaintext):
        result.append(c ^ XOR_KEY[i % 4])
    return bytes(result)

def calculate_token_hash(line, from_station, to_station, timestamp):
    """Calculate the token hash - same as C code"""
    hash_val = 0x12345678
    
    # Line colors
    line_colors = [
        0xEE3124,  # Red
        0xFFCB05,  # Yellow
        0x0066B3,  # Blue
        0x00A650,  # Green
        0x8B5BA6,  # Violet
        0xE31E88,  # Pink
        0xBB2299,  # Magenta
        0x8C8C8C,  # Grey
        0x00B5AD,  # Aqua
        0xF7931E   # Airport
    ]
    
    line_color = line_colors[line - 1]
    
    # Mix in line color
    hash_val ^= line_color
    hash_val = ((hash_val << 5) | (hash_val >> 27)) & 0xFFFFFFFF
    
    # Mix in station IDs
    hash_val ^= (from_station * 31337) & 0xFFFFFFFF
    hash_val ^= (to_station * 7331) & 0xFFFFFFFF
    hash_val = ((hash_val << 13) | (hash_val >> 19)) & 0xFFFFFFFF
    
    # Mix in timestamp
    hash_val ^= timestamp
    
    # Final mixing (MurmurHash3 finalizer)
    hash_val ^= (hash_val >> 16)
    hash_val = (hash_val * 0x85ebca6b) & 0xFFFFFFFF
    hash_val ^= (hash_val >> 13)
    hash_val = (hash_val * 0xc2b2ae35) & 0xFFFFFFFF
    hash_val ^= (hash_val >> 16)
    
    return hash_val & 0xFFFFFFFF

def generate_encrypted_strings():
    """Generate XOR encrypted strings for the C code"""
    
    strings_to_encrypt = [
        ("Flag", "UG0x1{M4g3nt4_T0k3n_F0rg3d_N0ID4}"),
        ("Fake Flag", "UG0x1{wr0ng_fl4g_n1c3_try}"),
        ("Banner", "DMRC Smart Token System"),
    ]
    
    print("=" * 60)
    print("XOR Encrypted Strings for C Code")
    print("=" * 60)
    
    for name, plaintext in strings_to_encrypt:
        encrypted = xor_encrypt(plaintext.encode())
        print(f"\n{name}: \"{plaintext}\"")
        print(f"Length: {len(plaintext)}")
        print("Encrypted bytes:")
        
        # Format as C array
        hex_bytes = ", ".join(f"0x{b:02x}" for b in encrypted)
        print(f"    {{{hex_bytes}}}")

def generate_admin_key():
    """Generate the correct admin key"""
    
    # Magenta Line = 7
    # Botanical Garden = 701
    # Janakpuri West = 725
    # Date mask = 0x20241231 (hidden in code)
    
    line = 7
    from_station = 701  # Botanical Garden
    to_station = 725    # Janakpuri West
    timestamp_mask = 0x20241231
    
    # Calculate hash
    full_hash = calculate_token_hash(line, from_station, to_station, timestamp_mask)
    checksum = full_hash & 0xFFFF  # Lower 16 bits
    
    # Build key
    key = f"MAGENTA-BOT-JAN-{checksum:04X}"
    
    print("\n" + "=" * 60)
    print("ADMIN KEY GENERATOR")
    print("=" * 60)
    print(f"\nLine: Magenta (ID: {line})")
    print(f"From: Botanical Garden (ID: {from_station})")
    print(f"To: Janakpuri West (ID: {to_station})")
    print(f"Timestamp Mask: 0x{timestamp_mask:08X}")
    print(f"\nFull Hash: 0x{full_hash:08X}")
    print(f"Checksum (lower 16 bits): 0x{checksum:04X}")
    print(f"\n{'=' * 40}")
    print(f"ADMIN KEY: {key}")
    print(f"{'=' * 40}")
    
    return key

def verify_flag_encryption():
    """Verify the flag encryption matches"""
    
    flag = "UG0x1{M4g3nt4_T0k3n_F0rg3d_N0ID4}"
    encrypted = xor_encrypt(flag.encode())
    decrypted = xor_encrypt(encrypted).decode()
    
    print("\n" + "=" * 60)
    print("FLAG VERIFICATION")
    print("=" * 60)
    print(f"Original:  {flag}")
    print(f"Encrypted: {encrypted.hex()}")
    print(f"Decrypted: {decrypted}")
    print(f"Match: {flag == decrypted}")

def main():
    print("╔══════════════════════════════════════════════════════════════╗")
    print("║     DMRC Booking Challenge - Solution Generator              ║")
    print("╚══════════════════════════════════════════════════════════════╝")
    
    generate_encrypted_strings()
    key = generate_admin_key()
    verify_flag_encryption()
    
    print("\n" + "=" * 60)
    print("SOLUTION SUMMARY")
    print("=" * 60)
    print(f"Admin Key: {key}")
    print(f"Flag: UG0x1{{M4g3nt4_T0k3n_F0rg3d_N0ID4}}")
    print("=" * 60)

if __name__ == "__main__":
    main()
