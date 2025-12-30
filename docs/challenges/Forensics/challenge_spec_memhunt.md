# Forensics Challenge: Signal Black - The DMRC Breach

## Challenge Metadata
| Field | Value |
|-------|-------|
| **Name** | Signal Black: The DMRC Breach |
| **Category** | Forensics |
| **Difficulty** | MEDIUM (Elite CTF - No Mercy) |
| **Points** | 300 |
| **Solve Time** | 4-5 hours |
| **Flag** | `UG0x1{DMRC_0CC_Br34ch_Sh4str1_P4rk}` |

---

## Challenge Story

> **CLASSIFIED - DMRC SECURITY INCIDENT REPORT**
>
> **Date:** December 30, 2024  
> **Location:** Delhi Metro Rail Corporation - Central Command Center (Shastri Park)  
> **Incident ID:** DMRC-SEC-2024-1230
>
> At 0247 hours IST, the DMRC Central OCC (Operations Control Center) detected anomalous 
> network traffic originating from the Signaling & Train Control workstation at Shastri Park depot.
>
> **Observed anomalies:**
> - Unusual outbound traffic to external IP `185.220.101.45` (traced to Eastern Europe)
> - Massive data exfiltration (~500MB) including train scheduling algorithms
> - CBTC (Communication-Based Train Control) system configurations accessed
> - All Windows Security logs were cleared using `wevtutil cl Security`
>
> **Assets compromised:**
> - Signaling workstation: `DMRC-SIGNAL-007`
> - Network segment: `192.168.47.0/24` (Blue Line Control)
> - Database: `dmrc-ops.internal` (Train scheduling DB)
>
> The attacker gained access to sensitive train control parameters. We captured forensic 
> artifacts before the system was reimaged. Your mission: Reconstruct the attack chain and 
> identify what data was exfiltrated.
>
> **The flag is hidden across multiple forensic artifacts. Cross-correlation is required.**
>
> *— DMRC Cyber Security Division*

---

## Artifact Package

```
dmrc_breach.zip (~50 MB total)
├── signaling_memory.raw      (200 MB - Memory dump from DMRC-SIGNAL-007)
├── blue_line_traffic.pcap    (15 MB - Captured OCC network traffic)
├── registry_SYSTEM.hive      (2 MB - Registry from signaling workstation)
├── event_logs_carved.bin     (5 MB - Carved deleted security logs)
├── train_config.bak          (1 MB - Partial CBTC config backup)
└── INCIDENT_BRIEF.txt        (Scenario + hints)
```

---

## 4-Layer Protection Scheme

### Layer 4 (Outermost): Split Across Memory Regions
Flag fragments are scattered in 4 different process heap allocations:
- Process `svchost.exe` (PID 1284) → heap offset 0x00A40000 → `M3m0ry_`
- Process `powershell.exe` (PID 3456) → heap offset 0x01B20000 → `F0r3ns1cs_`
- Process `cmd.exe` (PID 2891) → heap offset 0x00F10000 → `Ch41n_`
- Process `explorer.exe` (PID 1892) → heap offset 0x02A00000 → `Br34ch`

**Required skill:** Volatility 3 memory analysis, heap enumeration

### Layer 3: Zlib Compression
Each fragment is compressed with zlib before encoding.
Players must recognize the zlib magic bytes (`78 9C` or `78 DA`) and decompress.

**Required skill:** Binary analysis, compression identification

### Layer 2: Base85 Encoding (Ascii85)
Compressed data is encoded in Base85 (less common than Base64).
Players familiar with Base64 will waste time; must identify correct encoding.

**Required skill:** Encoding identification, Python scripting

### Layer 1 (Innermost): ChaCha20 Encryption
The encoded blobs are encrypted with ChaCha20-Poly1305.

**Key derivation:**
```
Key = SHA256(RegistrySID || EventLogTimestamp || PCAP_SessionID)
Nonce = First 12 bytes of SHA256(Key)
```

Players must extract:
1. `RegistrySID` from registry hive (timestomped - use $STANDARD_INFORMATION vs $FILE_NAME)
2. `EventLogTimestamp` from carved deleted event log (Event ID 4688)
3. `PCAP_SessionID` from custom binary protocol header (offset 0x08, 16 bytes)

**Required skill:** ChaCha20 decryption, cross-artifact correlation

---

## Artifact Details

### 1. Memory Dump (`memory_dump.raw`)
**Format:** Raw memory dump (synthesized, not real Windows)
**Size:** 200 MB

**Contents:**
- 4 fake process structures with heap allocations
- Each heap contains one encrypted+encoded+compressed flag fragment
- Red herrings: Multiple suspicious strings, fake credentials, decoy flags

**Anti-forensics:**
- Process names are legitimate Windows processes
- No obvious "malware.exe" naming
- Fragments hidden in heap slack space, not main allocations

**Tools required:** Volatility 3, strings, hex editor

### 2. Network Traffic (`network_traffic.pcap`)
**Format:** PCAP with custom binary protocol
**Size:** 15 MB

**Protocol structure (players must reverse engineer):**
```
Offset  Size  Field
0x00    4     Magic (0xDEADBEEF)
0x04    4     Packet Type (0x01=Init, 0x02=Data, 0x03=Ack)
0x08    16    Session ID (UUID format) ← NEEDED FOR KEY
0x18    4     Payload Length
0x1C    4     Checksum (CRC32)
0x20    N     Encrypted Payload
```

**Red herrings:**
- 80% of traffic is benign HTTP/DNS
- Multiple suspicious IPs (only 185.220.101.45 is real C2)
- Fragmented TCP (must reassemble manually)

**Tools required:** Wireshark, scapy, Python scripting

### 3. Registry Hive (`registry_SYSTEM.hive`)
**Format:** Windows Registry SYSTEM hive
**Size:** 2 MB

**Timestomping applied:**
- `$STANDARD_INFORMATION` timestamps are fake (02:00 AM)
- `$FILE_NAME` timestamps reveal real time (02:47 AM)
- Players must compare MFT timestamps to find real modification time

**Key data:**
- `HKLM\SAM\Domains\Account\Users\000001F4` → SID value needed for key
- Run key with encoded persistence mechanism
- DNS settings changed to C2 IP

**Tools required:** Registry Explorer, analyzeMFT, python-registry

### 4. Carved Event Logs (`event_logs_carved.bin`)
**Format:** Raw disk image with deleted EVTX entries
**Size:** 5 MB

**Anti-forensics:**
- Attacker used `wevtutil cl Security` to clear logs
- Logs exist in unallocated space (must carve)
- Timestamps partially corrupted

**Key event (must be carved):**
```xml
<Event>
  <System>
    <EventID>4688</EventID>
    <TimeCreated SystemTime="2024-12-30T02:47:23.123Z"/>
    <ProcessId>3456</ProcessId>
  </System>
  <EventData>
    <Data Name="CommandLine">powershell.exe -enc [ENCODED_DATA]</Data>
  </EventData>
</Event>
```

The `TimeCreated` value is needed for key derivation.

**Tools required:** Autopsy, Sleuth Kit, python-evtx, carving tools

---

## Solution Walkthrough

### Step 1: PCAP Analysis (45-60 min)
1. Open in Wireshark
2. Filter out HTTP/DNS noise
3. Identify custom protocol on port 4444
4. Reverse engineer 32-byte header structure
5. Extract Session ID from offset 0x08
6. Note: `SessionID = a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### Step 2: Registry Analysis (45-60 min)
1. Load SYSTEM hive in Registry Explorer
2. Navigate to SAM → find User SID
3. Notice $STANDARD_INFORMATION timestamps are suspicious
4. Use analyzeMFT to compare timestamps
5. Extract real SID from timestomped entry
6. Note: `SID = S-1-5-21-1234567890-0987654321-1122334455-500`

### Step 3: Event Log Carving (60-90 min)
1. Cannot open with Event Viewer (corrupted)
2. Use Autopsy/Sleuth Kit to carve raw disk
3. Search for EVTX magic bytes (`45 6C 66 46 69 6C 65`)
4. Extract deleted Event ID 4688
5. Parse XML to find TimeCreated
6. Note: `Timestamp = 2024-12-30T02:47:23.123Z`

### Step 4: Key Derivation (15 min)
```python
import hashlib
sid = "S-1-5-21-1234567890-0987654321-1122334455-500"
timestamp = "2024-12-30T02:47:23.123Z"
session_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

key_material = sid + timestamp + session_id
key = hashlib.sha256(key_material.encode()).digest()
nonce = hashlib.sha256(key).digest()[:12]
```

### Step 5: Memory Analysis (60-90 min)
1. Use Volatility 3: `volatility3 -f memory_dump.raw windows.pslist`
2. Identify 4 suspicious processes
3. Dump heap for each: `volatility3 -f memory_dump.raw windows.memmap --pid 3456 --dump`
4. Search dumps for encrypted blobs (look for high entropy regions)
5. Extract 4 fragments from heap offsets

### Step 6: Decrypt & Decode (30 min)
For each fragment:
```python
from Crypto.Cipher import ChaCha20_Poly1305
import zlib
import base64  # Actually base85

# Decrypt with ChaCha20
cipher = ChaCha20_Poly1305.new(key=key, nonce=nonce)
decrypted = cipher.decrypt(encrypted_blob)

# Decode Base85
decoded = base64.a85decode(decrypted)

# Decompress zlib
decompressed = zlib.decompress(decoded)

print(decompressed)  # Fragment of flag
```

### Step 7: Assemble Flag
Concatenate 4 fragments in PID order:
```
M3m0ry_ + F0r3ns1cs_ + Ch41n_ + Br34ch
```

**Final flag:** `UG0x1{DMRC_0CC_Br34ch_Sh4str1_P4rk}`

---

## Files to Create

1. `docs/challenges/Forensics/challenge_01_memhunt.md` - Challenge description
2. `scripts/generate_memhunt.py` - Artifact generation script
3. `docs/challenges/Forensics/memhunt_solution.md` - Internal solution doc

---

## Build Complexity

| Component | Build Time | Complexity |
|-----------|------------|------------|
| Memory dump synthesis | 3-4 hours | High (heap structures) |
| PCAP with custom protocol | 1-2 hours | Medium (scapy) |
| Registry hive modification | 1 hour | Medium |
| Event log carving image | 2 hours | High |
| **Total** | **7-9 hours** | **High** |

---

## Approval Required

Before I start building:
1. ✅ 4-layer protection confirmed
2. ✅ Flag confirmed: `UG0x1{DMRC_0CC_Br34ch_Sh4str1_P4rk}`
3. ❓ Memory dump: Synthesize with Python (200MB) or smaller (50MB)?
4. ❓ Theme: "Station Control Breach" fits UNDERGROUND_0x1?
