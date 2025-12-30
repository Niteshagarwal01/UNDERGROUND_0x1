# Writeup: Signal 6 - The Blue Line Apocalypse
## Official Solution

### Challenge Overview
**Category**: Steganography / Crypto / OSINT
**Difficulty**: Elite (Hard)
**Files**: 
- `signal_6_encrypted.wav` (Target)
- `metro_reference_track.wav` (Baseline)

### Solution Walkthrough

#### Step 1: Differential Spectral Analysis
The challenge provides a "Reference Track" (`metro_reference_track.wav`). This is the key.
A blind analysis of the target file reveals high-frequency noise, but it looks random (high entropy).
By performing a **Differential Analysis** (Target - Reference), you can isolate the anomalies.

In a spectrogram view (or via python script):
`Difference = Abs(Target_Spec) - Abs(Reference_Spec)`

This reveals distinct energy spikes in 5 specific frequency bands:
*   8.2–9.8 kHz
*   11.3–12.1 kHz
*   14.7–15.9 kHz
*   18.2–19.5 kHz
*   20.1–21.8 kHz

#### Step 2: Demodulation (The "Custom Script" Part)
The user must write a script to extract bits from these bands based on the Phase/Magnitude shifts relative to the reference.
*   **Magnitude Logic**:
    *   `Target > Reference` → Bit `1`
    *   `Target < Reference` → Bit `0`
*   Reassemble the interleaved bits from the 5 bands into a byte stream.

#### Step 3: Decrypting Layer 1 (AES-256)
The raw bytes are encrypted. The challenge implies the key is related to "Blue Line Stats".
**OSINT Research needed:**
*   Line Name: Blue Line (Prefix `DELHI_METRO_BLUE_6_`)
*   Stations: ~50 (Main Branch)
*   Length: ~56.11 km (`5611`)
*   Total Lines: ~12
*   Interchanges: ~8

**AES Key**: `SHA256("DELHI_METRO_BLUE_6_505611128")`
Decrypting with AES-256-CBC reveals Layer 2.

#### Step 4: Decrypting Layer 2 (ChaCha20)
The next layer hints at "GPS Coordinates".
**Nonce Derivation**: `SHA256(Concat of Blue Line Station GPS Coords)` (specifically Rajiv Chowk + Vaishali as anchors).
**Key**: HMAC-SHA256 of the ciphertext.

#### Step 5: Decrypting Layer 3 (Vigenère)
The resulting text is Latin-1, but scrambled.
**Key**: `DELHI_METRO_BLUE_LINE` (Derived from context).
Decrypt to get the final JSON.

#### Step 6: The Station Maze
The JSON contains 50 legitimate-looking station objects. 46 are decoys with `fake_flag` entries.
Only 4 stations contain base64-encoded fragments:
1.  **Station 7**: `B1u3_`
2.  **Station 23**: `L1n3_`
3.  **Station 31**: `S1gn4l_6_`
4.  **Station 42**: `D3lH1_M3Tr0_0p3R4T0R`

#### Step 7: Flag Assembly
Combine the fragments:
**Flag**: `UG0x1{B1u3_L1n3_S1gn4l_6_D3lH1_M3Tr0_0p3R4T0R}`
