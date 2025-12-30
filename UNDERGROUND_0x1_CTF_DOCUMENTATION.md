# UNDERGROUND_0x1

## National-Level Capture The Flag Competition
### A High-Fidelity Delhi Metro Operational Compromise Simulation

---

```
 ██╗   ██╗███╗   ██╗██████╗ ███████╗██████╗  ██████╗ ██████╗  ██████╗ ██╗   ██╗███╗   ██╗██████╗ 
 ██║   ██║████╗  ██║██╔══██╗██╔════╝██╔══██╗██╔════╝ ██╔══██╗██╔═══██╗██║   ██║████╗  ██║██╔══██╗
 ██║   ██║██╔██╗ ██║██║  ██║█████╗  ██████╔╝██║  ███╗██████╔╝██║   ██║██║   ██║██╔██╗ ██║██║  ██║
 ██║   ██║██║╚██╗██║██║  ██║██╔══╝  ██╔══██╗██║   ██║██╔══██╗██║   ██║██║   ██║██║╚██╗██║██║  ██║
 ╚██████╔╝██║ ╚████║██████╔╝███████╗██║  ██║╚██████╔╝██║  ██║╚██████╔╝╚██████╔╝██║ ╚████║██████╔╝
  ╚═════╝ ╚═╝  ╚═══╝╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝╚═════╝ 
                                            _0x1
```

---

## TABLE OF CONTENTS

1. [Classification Notice](#classification-notice)
2. [Operation Briefing](#operation-briefing)
3. [Mission Overview](#mission-overview)
4. [Rules of Engagement](#rules-of-engagement)
5. [Challenge Categories](#challenge-categories)
6. [Scoring Matrix](#scoring-matrix)
7. [Flag Format](#flag-format)
8. [Technical Specifications](#technical-specifications)
9. [Challenge Index](#challenge-index)
10. [Appendix: DMRC Operational Context](#appendix-dmrc-operational-context)

---

## CLASSIFICATION NOTICE

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   CLASSIFICATION:     RESTRICTED - EXERCISE MATERIAL           │
│   OPERATION:          UNDERGROUND_0x1                           │
│   EXERCISE TYPE:      Red/Blue Team Simulation                  │
│   AUTHORIZATION:      CTF Competition Framework                 │
│   DISTRIBUTION:       Registered Participants Only              │
│                                                                 │
│   ⚠ THIS IS A SIMULATION. ALL SCENARIOS ARE FICTIONAL.         │
│   ⚠ DO NOT ATTEMPT ACCESS TO ACTUAL DMRC SYSTEMS.              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚖️ LEGAL DISCLAIMER & DATA POLICY

### Official Disclaimer

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║                    LEGAL DISCLAIMER                               ║
║                                                                   ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  UNDERGROUND_0x1 is an INDEPENDENT cybersecurity education       ║
║  competition. It is NOT affiliated with, endorsed by, or         ║
║  connected to Delhi Metro Rail Corporation (DMRC), Government    ║
║  of India, or any associated entities.                            ║
║                                                                   ║
║  ALL SCENARIOS, INCIDENTS, BREACHES, AND SECURITY FAILURES       ║
║  DEPICTED IN THIS COMPETITION ARE ENTIRELY FICTIONAL.            ║
║                                                                   ║
║  This competition uses:                                           ║
║  • Publicly available information about Delhi Metro               ║
║  • Fictional characters, companies, and events                    ║
║  • Simulated artifacts that DO NOT represent actual systems       ║
║  • Educational scenarios for cybersecurity training               ║
║                                                                   ║
║  NO ACTUAL DMRC SYSTEMS, DATA, OR SECURITY VULNERABILITIES       ║
║  ARE EXPOSED, SIMULATED, OR REFERENCED IN THIS COMPETITION.       ║
║                                                                   ║
║  Participants must NOT:                                           ║
║  • Attempt to access actual DMRC or government systems            ║
║  • Apply techniques learned here against real infrastructure      ║
║  • Misrepresent challenge content as real security issues         ║
║  • Share challenge materials outside the competition context      ║
║                                                                   ║
║  By participating, you acknowledge this disclaimer and agree     ║
║  to use skills developed here only for authorized, legal,        ║
║  and ethical purposes.                                            ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

### Data Authenticity Policy

This competition employs a **High-Fidelity Simulation** approach:

| Data Category | Source | Purpose |
|---------------|--------|---------|
| **Geographic Coordinates** | Real Delhi Metro locations | Operational authenticity |
| **Station Names & Codes** | Real DMRC nomenclature | Domain immersion |
| **Fare Matrices & Schedules** | Real public DMRC data | Crypto key derivation |
| **Document Formats** | Real government templates | Visual authenticity |
| **Infrastructure References** | Real system types (CBTC, AFC, etc.) | Technical accuracy |
| **Personal Names** | Fictional (AI/search-proof) | Privacy & anti-cheat |
| **Company Names** | Fictional (ungoogleable) | Legal protection |
| **Contract/Registration IDs** | Fictional (format-accurate) | Anti-shortcut |
| **Incident Narratives** | Fictional | Scenario framing |
| **Security Vulnerabilities** | Fictional (CTF-designed) | Educational only |

### Anti-Cheat Design

All challenge content is engineered to prevent:

1. **Direct Search Solutions:** Fake names yield no meaningful search results
2. **AI-Assisted Solving:** Multi-step correlation defeats prompt-based solving
3. **Document Plaintext Access:** All sensitive content is encrypted/encoded
4. **Single-Source Answers:** Flags require synthesizing multiple data points

### Intellectual Property Notice

- DMRC®, Delhi Metro®, and associated trademarks belong to their respective owners
- This competition makes fair use of public information for educational purposes
- No proprietary DMRC systems, codebases, or internal data are used or simulated
- All technical artifacts (binaries, web apps, datasets) are original creations

---

## OPERATION BRIEFING

### SITUATION REPORT

Intelligence fragments originating from Delhi Metro Rail Corporation (DMRC) operational systems have been detected across multiple adversarial infrastructure nodes. Pattern analysis indicates a sophisticated, multi-vector data exfiltration operation conducted over an extended period.

The threat actor demonstrates:
- **Deep operational knowledge** of metro systems architecture
- **Persistent access** across IT/OT boundaries
- **Advanced tradecraft** in data obfuscation and staged exfiltration
- **Insider-level understanding** of DMRC documentation and protocols

### THREAT ASSESSMENT

| Indicator | Assessment |
|-----------|------------|
| **Threat Actor Profile** | APT / Insider Hybrid |
| **Sophistication Level** | Nation-State Capable |
| **Dwell Time (Estimated)** | 6-18 months |
| **Systems Compromised** | Multiple domains |
| **Data Sensitivity** | CRITICAL |

### YOUR ROLE

You are an intelligence analyst / incident responder tasked with:

1. **Analyzing recovered artifacts** from compromised systems
2. **Reconstructing the attack chain** through forensic evidence
3. **Decrypting intercepted communications** using operational context
4. **Reverse engineering compromised binaries** to understand attacker tooling
5. **Exploiting discovered vulnerabilities** to trace the breach origin
6. **Correlating open-source intelligence** to identify infrastructure connections

Each **FLAG** you recover represents a critical piece of the compromise puzzle.

---

## MISSION OVERVIEW

### Objective

Reconstruct the complete attack narrative by recovering all intelligence fragments (flags) across six operational domains:

```
                    ┌─────────────────────┐
                    │   UNDERGROUND_0x1   │
                    │   INTELLIGENCE MAP  │
                    └──────────┬──────────┘
                               │
       ┌───────┬───────┬───────┼───────┬───────┬───────┐
       │       │       │       │       │       │       │
       ▼       ▼       ▼       ▼       ▼       ▼       ▼
   ┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐
   │OSINT ││FORENS││CRYPTO││ REV  ││ WEB  ││STEGO │
   └──────┘└──────┘└──────┘└──────┘└──────┘└──────┘
```

### Challenge Categories

| Category | Codename | Description |
|----------|----------|-------------|
| OSINT | Ghost Corridors | Open source intelligence gathering |
| Forensics | Signal Black | Digital forensics and analysis |
| Cryptography | Fare Matrix | Encryption and cipher breaking |
| Reverse Engineering | Token Forge | Binary analysis |
| Web Security | OCC Portal | Web application exploitation |
| Steganography | Hidden Layers | Hidden data in media files |

---

## RULES OF ENGAGEMENT

### General Rules

1. **Simulation Environment Only**
   - All challenges exist within the provided sandbox
   - **DO NOT** attempt to access actual DMRC systems, networks, or infrastructure
   - Violation results in immediate disqualification and potential legal action

2. **No Flag Sharing**
   - Flags are unique per challenge
   - Sharing flags between teams is prohibited
   - Collaboration between registered teams is not permitted

3. **No Attack on Infrastructure**
   - Do not attack CTF platform infrastructure
   - Do not attempt denial-of-service on challenge servers
   - Rate limiting is enforced; automated brute-force will result in IP ban

4. **Tool Usage**
   - Any publicly available tools are permitted
   - Custom tooling is encouraged
   - Exploiting challenge platform (not challenges) is prohibited

5. **Hints Policy**
   - **NO HINTS WILL BE PROVIDED**
   - Challenges are designed to be solved without external assistance
   - All required information exists within provided materials and legitimate OSINT

### Ethical Guidelines

```
┌─────────────────────────────────────────────────────────────────┐
│                       ETHICAL BOUNDARY                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  This CTF simulates real-world scenarios for EDUCATIONAL        │
│  purposes. The skills developed here should be used for:        │
│                                                                 │
│    ✓ Authorized security testing                               │
│    ✓ Academic research                                          │
│    ✓ Defensive capability building                              │
│    ✓ Career development in cybersecurity                        │
│                                                                 │
│  NEVER apply these techniques against systems without           │
│  explicit written authorization.                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## CHALLENGE CATEGORIES

### 1. OSINT — "Ghost Corridors"

**Domain Focus:** Open-source intelligence gathering from public records, archival documents, geospatial data, tender documentation, and corporate registries.

**Operational Context:** 
The threat actor used publicly available information about DMRC infrastructure to plan their intrusion. Reconstructing their reconnaissance path reveals critical operational details they exploited.

**Skill Requirements:**
- Multi-source correlation
- Document analysis (tenders, RTI responses, DPR)
- Geospatial analysis (satellite imagery, mapping)
- Corporate/government records research
- Archival research techniques
- Pattern recognition across disparate sources

**Difficulty Progression:**

| Level | Challenge | Description |
|-------|-----------|-------------|
| **Medium** | Tender Trace | Cross-reference procurement documents to identify specific contractor details |
| **Hard** | The Missing Platform | Reconstruct evidence of abandoned/modified infrastructure elements |
| **God-Level** | Phantom Interchange | Uncover completely redacted project through multi-source deep correlation |

---

### 2. Forensics — "Signal Black"

**Domain Focus:** Digital forensics on operational technology artifacts, communication logs, system images, and industrial control data fragments.

**Operational Context:**
Artifacts have been recovered from compromised maintenance systems, communication infrastructure, and control system historians. These fragments contain traces of the attacker's activities masquerading as operational data.

**Skill Requirements:**
- Filesystem forensics (NTFS, ext4, FAT)
- Memory analysis
- Network traffic analysis
- Timeline reconstruction
- Metadata extraction
- Signal/protocol analysis
- Industrial control system data formats

**Difficulty Progression:**

| Level | Challenge | Description |
|-------|-----------|-------------|
| **Medium** | Maintenance Log | Analyze laptop image for hidden operational data and timeline anomalies |
| **Hard** | TETRA Fragment | Reconstruct proprietary radio protocol data to extract embedded intelligence |
| **God-Level** | SCADA Ghosts | Recover and correlate deleted historian records to identify unauthorized activities |

---

### 3. Cryptography — "Fare Matrix"

**Domain Focus:** Cryptographic analysis where keys, parameters, or algorithm structures are derived from metro operational knowledge rather than mathematical weaknesses.

**Operational Context:**
Intercepted communications use encryption schemes whose security relies on operational obscurity. The schemes themselves may be standard or custom, but breaking them requires understanding DMRC's operational patterns — fare calculations, timing sequences, station codes.

**Skill Requirements:**
- Classical and modern cryptanalysis
- Key derivation understanding
- Protocol analysis
- Domain-specific knowledge application
- Custom cipher analysis
- Known-plaintext/ciphertext techniques

**Difficulty Progression:**

| Level | Challenge | Description |
|-------|-----------|-------------|
| **Medium** | Token Seed | Decrypt fare token data using metro-derived key material |
| **Hard** | Gate Sync | Break multi-layer encryption with keys tied to operational timing |
| **God-Level** | CBTC Cipher | Analyze train control telemetry encryption with operationally-dependent weaknesses |

---

### 4. Reverse Engineering — "Token Forge"

**Domain Focus:** Binary analysis of stripped/obfuscated executables simulating DMRC validation systems, embedded firmware, and security modules.

**Operational Context:**
The attacker deployed custom tooling that mimics legitimate DMRC validation binaries. Understanding these tools reveals their methodology and objectives. Additionally, analyzing legitimate validation logic exposes attack surfaces.

**Skill Requirements:**
- Static analysis (IDA, Ghidra, radare2)
- Dynamic analysis (debuggers, emulators)
- ARM and x86 architecture understanding
- Anti-analysis bypass techniques
- Protocol reconstruction
- State machine analysis

**Difficulty Progression:**

| Level | Challenge | Description |
|-------|-----------|-------------|
| **Medium** | Validator v1 | Reverse stripped token validation binary with standard obfuscation |
| **Hard** | Gate Controller | Analyze ARM firmware with custom control flow and MMIO simulation |
| **God-Level** | Unified Ticketing Core | Reconstruct multi-binary validation stack with heavy protection |

---

### 5. Web Security — "OCC Portal"

**Domain Focus:** Web application security focusing on business logic flaws, access control failures, and architectural vulnerabilities in simulated internal systems.

**Operational Context:**
Simulated replicas of DMRC internal portals used for operations management. Vulnerabilities are subtle logic flaws and access control issues — no basic injection or simple XSS.

**Skill Requirements:**
- HTTP/REST API analysis
- Authentication/authorization testing
- Business logic vulnerability identification
- Session management analysis
- IDOR and access control testing
- Multi-step attack chaining

**Difficulty Progression:**

| Level | Challenge | Description |
|-------|-----------|-------------|
| **Medium** | Crew Roster | Exploit non-trivial IDOR in scheduling system |
| **Hard** | Incident Override | Chain race condition, JWT manipulation, and logic bypass |
| **God-Level** | Control Room | Full multi-service exploitation to reach isolated safety systems |

---

### 6. Steganography — "Hidden Layers"

**Domain Focus:** Information hiding techniques within various media formats including images, audio, video, and documents.

**Operational Context:**
The threat actor concealed exfiltrated data within innocuous-looking files that passed through security scanning undetected. Analyzing metadata, file structure, and hidden channels reveals the covert communication methods.

**Skill Requirements:**
- Image forensics (LSB, DCT analysis)
- Audio spectrum analysis
- File carving and format analysis
- Metadata extraction
- Encoding detection and reversal
- Statistical steganalysis

**Difficulty Progression:**

| Level | Challenge | Description |
|-------|-----------|-------------|
| **Medium** | Pixel Perfect | Extract data hidden in image LSB channels |
| **Hard** | Sound Waves | Decode message hidden in audio spectrogram |
| **God-Level** | Deep Cover | Multi-layer steganography with encryption |

---

## SCORING MATRIX

### Point Values

| Difficulty | Base Points | First Blood Bonus |
|------------|-------------|-------------------|
| **Medium** | 100-300 pts | +20 pts |
| **Hard** | 300-500 pts | +25 pts |
| **God-Level** | 500-800 pts | +50 pts |

### Scoring Rules

1. **Fixed Scoring:** Points are set per challenge to maintain difficulty integrity.
2. **First Blood:** First team to solve gets bonus points.
3. **Partial Credit:** Not available. Only complete, correct flags score.
4. **Tie-Breaking:** Earlier final submission time wins.

---

## FLAG FORMAT

### Structure

```
UG0x1{flag_content}
```

### Specifications

| Attribute | Specification |
|-----------|---------------|
| **Prefix** | `UG0x1{` |
| **Suffix** | `}` |
| **Case Sensitivity** | Case-INSENSITIVE for validation |
| **Content Characters** | Alphanumeric (a-z, A-Z, 0-9) and underscores (_) only |
| **Content Length** | 10-50 characters |
| **Whitespace** | No spaces; use underscores |

### Examples

```
Valid:
  UG0x1{t3nd3r_c0ntract_2019_MX47}
  UG0x1{chainage_28470_shaft_B}
  UG0x1{TETRA_freq_4257_occ}
  UG0x1{validat0r_byp4ss_0x7F}

Invalid:
  UG0x1{flag with spaces}          ← Contains spaces
  UNDERGROUND{flag}                 ← Wrong prefix
  UG0x1{flag}                       ← Too short (<10 chars)
  ug0x1[flag_content]               ← Wrong brackets
```

### Submission

- Submit flags via the CTF platform interface
- Copy-paste recommended to avoid typos
- No limit on submission attempts (rate-limited to prevent brute-force)
- Correct submission triggers immediate point award

---

## TECHNICAL SPECIFICATIONS

### Challenge Infrastructure

```
┌─────────────────────────────────────────────────────────────────┐
│                    CHALLENGE INFRASTRUCTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐      │
│   │   STATIC    │     │  DYNAMIC    │     │   HOSTED    │      │
│   │  ARTIFACTS  │     │  SERVICES   │     │   PORTALS   │      │
│   └──────┬──────┘     └──────┬──────┘     └──────┬──────┘      │
│          │                   │                   │              │
│   • Binaries           • API endpoints    • Web applications   │
│   • Disk images        • WebSocket        • Login systems      │
│   • Documents          • Custom TCP       • Internal tools     │
│   • Captures           • gRPC services                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Artifact Types by Category

| Category | Primary Artifacts |
|----------|-------------------|
| **OSINT** | PDF documents, archived web pages, image files, metadata files |
| **Forensics** | Disk images (.E01, .raw), PCAP files, memory dumps, log files |
| **Cryptography** | Encrypted files, protocol captures, key material fragments |
| **Reverse Engineering** | PE executables, ELF binaries, firmware dumps, APKs |
| **Web Security** | Live web applications (URLs provided per challenge) |

### Recommended Tools

**General:**
- Linux distribution (Kali, Parrot, REMnux)
- Python 3.x with common libraries
- CyberChef for encoding/decoding operations

**OSINT:**
- Maltego / SpiderFoot
- Google Dorking expertise
- Archive.org Wayback Machine
- Geo-analysis tools (Google Earth, QGIS)

**Forensics:**
- Autopsy / Sleuth Kit
- Volatility 3
- Wireshark / tshark
- ExifTool
- Timeline analysis tools

**Cryptography:**
- hashcat / John the Ripper
- SageMath
- Custom Python scripting
- OpenSSL

**Reverse Engineering:**
- Ghidra (recommended) / IDA Pro
- radare2 / Cutter
- x64dbg / gdb
- QEMU for emulation

**Web Security:**
- Burp Suite Professional
- OWASP ZAP
- Postman / Insomnia
- Browser DevTools

---

## CHALLENGE INDEX

### Complete Challenge Listing

```
UNDERGROUND_0x1 Challenge Matrix
═══════════════════════════════════════════════════════════════════

OSINT — "Ghost Corridors"
─────────────────────────────────────────────────────────────────
│ 01 │ MEDIUM   │ Tender Trace          │ 300 pts │ STATIC  │
│ 02 │ HARD     │ The Missing Platform  │ 500 pts │ STATIC  │
│ 03 │ GOD-LVL  │ Phantom Interchange   │ 800 pts │ STATIC  │
─────────────────────────────────────────────────────────────────

Forensics — "Signal Black"
─────────────────────────────────────────────────────────────────
│ 04 │ MEDIUM   │ Maintenance Log       │ 300 pts │ STATIC  │
│ 05 │ HARD     │ TETRA Fragment        │ 500 pts │ STATIC  │
│ 06 │ GOD-LVL  │ SCADA Ghosts          │ 800 pts │ STATIC  │
─────────────────────────────────────────────────────────────────

Cryptography — "Fare Matrix"
─────────────────────────────────────────────────────────────────
│ 07 │ MEDIUM   │ Token Seed            │ 300 pts │ STATIC  │
│ 08 │ HARD     │ Gate Sync             │ 500 pts │ STATIC  │
│ 09 │ GOD-LVL  │ CBTC Cipher           │ 800 pts │ STATIC  │
─────────────────────────────────────────────────────────────────

Reverse Engineering — "Token Forge"
─────────────────────────────────────────────────────────────────
│ 10 │ MEDIUM   │ Validator v1          │ 300 pts │ STATIC  │
│ 11 │ HARD     │ Gate Controller       │ 500 pts │ STATIC  │
│ 12 │ GOD-LVL  │ Unified Ticketing Core│ 800 pts │ STATIC  │
─────────────────────────────────────────────────────────────────

Web Security — "OCC Portal"
─────────────────────────────────────────────────────────────────
│ 13 │ MEDIUM   │ Crew Roster           │ 300 pts │ HOSTED  │
│ 14 │ HARD     │ Incident Override     │ 500 pts │ HOSTED  │
│ 15 │ GOD-LVL  │ Control Room          │ 800 pts │ HOSTED  │
─────────────────────────────────────────────────────────────────

TOTAL: 15 Challenges | 8,000 Base Points
═══════════════════════════════════════════════════════════════════
```

---

## APPENDIX: DMRC OPERATIONAL CONTEXT

### System Reference

This section provides context on real DMRC systems that inspire challenge scenarios. **All challenges use fictional data within realistic frameworks.**

#### Operational Technology (OT) Systems

| System | Description | Challenge Relevance |
|--------|-------------|---------------------|
| **CBTC** | Communication-Based Train Control — radio-based signaling system controlling train movements, speed, and stopping positions | Crypto (telemetry), RE (controllers) |
| **SCADA** | Supervisory Control and Data Acquisition — monitors and controls traction power, ventilation, pumps | Forensics (historians), Crypto (protocols) |
| **AFC** | Automatic Fare Collection — tokens, smart cards, gates, fare calculation | RE (validators), Crypto (token data) |
| **TETRA** | Terrestrial Trunked Radio — encrypted voice/data communication for operations | Forensics (signal analysis) |
| **PSD** | Platform Screen Doors — synchronized with train arrivals | Crypto (timing sequences) |

#### Information Technology (IT) Systems

| System | Description | Challenge Relevance |
|--------|-------------|---------------------|
| **OCC Portals** | Operations Control Centre internal web applications | Web Security (all) |
| **Crew Management** | Staff scheduling, rostering, attendance | Web Security (IDOR/logic) |
| **Incident Management** | Safety event logging and response coordination | Web Security (access control) |
| **Asset Management** | Infrastructure and equipment tracking | OSINT (tender correlation) |

#### Documentation Types

| Document Type | Source | Challenge Relevance |
|---------------|--------|---------------------|
| **Detailed Project Reports (DPR)** | Planning/construction phase documents | OSINT (infrastructure) |
| **Tender Documents** | Procurement records (CPP Portal) | OSINT (contractor tracing) |
| **RTI Responses** | Right to Information Act responses | OSINT (discrepancies) |
| **CAG Audit Reports** | Comptroller and Auditor General findings | OSINT (anomalies) |
| **Parliamentary Questions** | Rajya Sabha / Lok Sabha Q&A | OSINT (official statements) |

#### Line Reference

| Line | Color | Relevance |
|------|-------|-----------|
| Line 1 | Red | Oldest infrastructure |
| Line 2 | Yellow | High-traffic corridor |
| Line 3 | Blue | Extensive reach, splits |
| Line 4 | Green | Older signaling systems |
| Line 5 | Violet | Recent expansion |
| Line 6 | Orange | Airport Express — separate systems |
| Line 7 | Pink | Driverless operation (newer CBTC) |
| Line 8 | Magenta | Driverless operation |

---

## DOCUMENT CONTROL

```
┌─────────────────────────────────────────────────────────────────┐
│                     DOCUMENT INFORMATION                         │
├─────────────────────────────────────────────────────────────────┤
│  Document ID:        UG0x1-DOC-001                              │
│  Version:            1.0                                         │
│  Status:             DRAFT                                       │
│  Classification:     CTF Exercise Material                       │
│  Last Updated:       December 2024                               │
│  Author:             UNDERGROUND_0x1 Organizing Committee        │
└─────────────────────────────────────────────────────────────────┘
```

---

## FINAL NOTES

### Difficulty Warning

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   ⚠  UNDERGROUND_0x1 IS NOT AN ENTRY-LEVEL CTF                  ║
║                                                                   ║
║   These challenges are designed for:                              ║
║   • Advanced undergraduate / graduate cybersecurity students      ║
║   • Professional security researchers                             ║
║   • Experienced CTF competitors                                   ║
║                                                                   ║
║   Expect to spend HOURS on individual challenges.                ║
║   Expect to be frustrated.                                        ║
║   Expect to learn.                                                ║
║                                                                   ║
║   There are no hints. There are no shortcuts.                     ║
║   Only persistence and skill will prevail.                        ║
║                                                                   ║
║   Welcome to the Underground.                                     ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

### Contact

For **technical issues only** (platform access, broken downloads, service outages):
- CTF Platform: [PLATFORM_URL]
- Emergency Contact: [CONTACT_EMAIL]

**No hints will be provided via any channel.**

---

```
                            ╭─────────────╮
                            │  GOOD LUCK  │
                            │  OPERATORS  │
                            ╰─────────────╯
                            
        "The train runs on schedule. The system has no flaws.
                    That's what they want you to believe."
                    
                         — UNDERGROUND_0x1
```

---

*END OF DOCUMENT*
