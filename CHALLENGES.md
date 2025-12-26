# UNDERGROUND_0x1 Challenge Design Document

## 1. OSINT (Category: Ghost Corridors)
**Theme:** Advanced Intelligence Gathering, Passive Recon, and Deep Web Tracing.

### 1.1 Social Signal (Medium)
- **Scenario:** The target handle `@Op_Metro_X` has gone dark. Intelligence suggests they left a "dead drop" credential in a code snippet on a niche developer forum before vanishing.
- **Artifact:** Handle `@Op_Metro_X`.
- **The Solve:**
    1.  Standard search traces the handle to a Reddit account (deleted).
    2.  Cached version of Reddit profile reveals a link to a "Gist" or "Pastebin" that is also 404.
    3.  User must use advanced search operators (`site:pastebin.com "Op_Metro_X"`) or cache viewers to recover the *raw* content.
    4.  The content is obscured using a "Caesar Cipher" rotate, revealing the flag.
- **Flag:** `ug0x1{dead_drops_leave_digital_echoes}`
- **Why Elite:** Requires multi-hop pivot and cache recovery, not just a simple search.

### 1.2 Optic Fiber (Hard)
- **Scenario:** Intercepted image from a saboteur's body cam. They are targeting a specific fiber junction box. The image is low light, raining, and blurry. Identify the exact coordinates.
- **Artifact:** `target_recon.jpg` (High reflection, wet pavement, specific neon sign reflection).
- **The Solve:**
    1.  **Reflection Analysis:** The user must unflip and enhance the reflection in a puddle or window to read a shop sign.
    2.  **Shadow Analysis:** Calculate time of day to estimate train frequency options.
    3.  **Triangulation:** Locate the shop in Delhi, find the line of sight to the Metro pillar.
- **Flag:** `ug0x1{reflections_betray_location_28.61N}`
- **Why Elite:** Pure tradecraft. No metadata tools will help here. Visual analysis only.

### 1.3 Ghost Protocol (GOD LEVEL)
- **Scenario:** An adversary spun up a Command & Control (C2) server domain `metro-update-sys-x99.xyz`. It was active for only **13 minutes** on Oct 12, 2024, before being nuked. WHOIS is redacted. The domain doesn't exist. Find the email address used to register the SSL certificate.
- **Artifact:** Domain name `metro-update-sys-x99.xyz`.
- **The Solve:**
    1.  WHOIS and DNS history are empty because it was short-lived.
    2.  **Technique:** Query **Certificate Transparency (CT) Logs** (e.g., crt.sh or Censys).
    3.  Find the certificate issued for that domain during the 13-minute window.
    4.  Analyze the X.509 certificate fields. The Admin Email was leaked in the 'Subject Alternative Name' or a custom OID field due to a configuration error.
- **Flag:** `ug0x1{ct_logs_are_forever_wsh3ll_admin}`
- **Why GOD LEVEL:** Requires knowledge of internet infrastructure permanence (CT logs) vs ephemeral records (DNS). A true "Ghost" hunt.

---

## 2. Forensics (Category: Signal Black)
**Theme:** Analyzing digital artifacts from compromised metro systems.

### 2.1 Maintenance Log (Easy)
- **Scenario:** A technician's laptop was infected. Find the IP address the malware connected to in the logs.
- **Artifact:** `syslog_dump.log`
- **Flag:** `ug0x1{ads_hidden_in_plain_sight}` (or an IP formatted as flag).
- **Creation Plan:** Generate a large log file with one specific malicious entry encoded in Base64.

### 2.2 SCADA Ghosts (Medium)
- **Scenario:** Network traffic capture from the signaling system shows unauthorized Modbus commands.
- **Artifact:** `capture.pcap`
- **Flag:** `ug0x1{phantom_train_12_47_am}`
- **Creation Plan:** Generate a PCAP file containing Modbus TCP traffic with the flag in the data payload of a specific packet.

### 2.3 TETRA Fragment (Hard)
- **Scenario:** A burst of encrypted radio traffic was intercepted from the Train Radio system.
- **Artifact:** `radio_burst.wav` (Audio Spectrum/LSB Steganography).
- **Flag:** `ug0x1{tea1_encryption_is_weak}`
- **Creation Plan:** Embed the flag in the spectrogram of an audio file of train noise.

---

## 3. Cryptography (Category: Fare Matrix)
**Theme:** Breaking the encryption used in the ticketing system.

### 3.1 Token Seed (Easy)
- **Scenario:** The smart card generation seed is XORed with a simple key.
- **Artifact:** `seed_dump.txt` and `python_script.py`
- **Flag:** `ug0x1{fare_matrix_xor_key}`
- **Creation Plan:** Provide a file with hex strings and a hint about the XOR key length (e.g., 0x42).

### 3.2 Gate Sync (Medium)
- **Scenario:** The AFC gates use a rolling code based on time. Predict the next code.
- **Artifact:** `gate_codes.txt` (List of past codes).
- **Flag:** `ug0x1{triple_layer_metro_cipher}`
- **Creation Plan:** Implement a simple Linear Congruential Generator (LCG) and ask the user to predict the next value.

### 3.3 CBTC Cipher (Hard)
- **Scenario:** The Communication Based Train Control system uses a custom RSA implementation with weak primes.
- **Artifact:** `public_key.pem` and `intercepted_msg.bin`
- **Flag:** `ug0x1{lfsr_predictable_seed_attack}`
- **Creation Plan:** Generate RSA keys with small enough primes to be factored solely by tools like RsaCtfTool.

---

## 4. Reverse Engineering (Category: Token Forge)
**Theme:** Analyzing binaries from the metro infrastructure.

### 4.1 Validator v1 (Easy)
- **Scenario:** A Linux binary that validates ticket IDs.
- **Artifact:** `validator_linux` (ELF Binary).
- **Flag:** `ug0x1{token_validation_bypassed}`
- **Creation Plan:** A C program that does a simple `strcmp` against the flag. Use `strings` to find it.

### 4.2 Gate Controller (Medium)
- **Scenario:** Firmware for the turnstile barrier. It requires a pin code to unlock debug mode.
- **Artifact:** `firmware.bin`
- **Flag:** `ug0x1{hidden_fsm_transition_found}`
- **Creation Plan:** A binary where the flag is constructed dynamically on the stack (not visible via strings).

### 4.3 Unified Core (Hard)
- **Scenario:** The central ticketing core executable. It has anti-debugging protections.
- **Artifact:** `core_service.exe`
- **Flag:** `ug0x1{ncmc_full_stack_pwned}`
- **Creation Plan:** Binary with a simple buffer overflow vulnerability or logic puzzle that requires patching the jump instruction.

---

## 5. Web Security (Category: OCC Portal)
**Theme:** Exploiting the Operation Control Center web dashboard.

### 5.1 Crew Roster (Easy)
- **Scenario:** The staff directory allows viewing other users' profiles by changing the ID in the URL.
- **Artifact:** URL to a hosted mini-app (simulated).
- **Flag:** `ug0x1{idor_shift_pattern_cracked}`
- **Creation Plan:** Create a Next.js route `/api/challenge/roster` vulnerable to IDOR.

### 5.2 Incident Override (Medium)
- **Scenario:** The "Report Incident" form is vulnerable to SQL Injection.
- **Artifact:** URL to a hosted mini-app.
- **Flag:** `ug0x1{three_vuln_chain_complete}`
- **Creation Plan:** Create a route vulnerable to basic ' OR 1=1-- injection.

### 5.3 Control Room (Hard)
- **Scenario:** The admin panel has a "Ping System" tool that allows command execution.
- **Artifact:** URL to a hosted mini-app.
- **Flag:** `ug0x1{safety_system_compromised}`
- **Creation Plan:** Create a route vulnerable to Command Injection (RCE).
