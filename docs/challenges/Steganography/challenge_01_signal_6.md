# 🚇 Signal 6: The Blue Line Apocalypse
## Elite Audio Steganography + Crypto Challenge

### Category
- Steganography (Audio, multi‑layer)
- Cryptography (AES‑256, ChaCha20, Vigenère)
- OSINT (Delhi Metro – Blue Line)

### Difficulty
- Intended for **elite** CTF players.
- No hints.
- Expected solve time: **6–10 hours** for very strong teams.

---

## Story

At 23:32 IST, a suspicious transmission was detected on the Delhi Metro **Blue Line** control channel “Signal 6”. The only artifact left is a 45‑second audio recording from platform microphones.

You have one job:

> Extract the hidden flag from `signal_6_encrypted.wav`.

No more details. No hints. No mercy.

---

## What the player gets

- A single file:  
  `signal_6_encrypted.wav`  
  - PCM WAV  
  - 44.1 kHz  
  - 16‑bit, mono or stereo  
  - ~45 seconds of Delhi Metro ambient sound (announcements, train, crowd).

---

## High‑level solution path

1. **Spectral Analysis**: Spectrogram shows strange high‑frequency patterns above ~8 kHz.
2. **Multi-band Extraction**:
   - Band 1: 8.2–9.8 kHz (Phase Coding)
   - Band 2: 11.3–12.1 kHz (Amplitude Mod)
   - Band 3: 14.7–15.9 kHz (FSK)
   - Band 4: 18.2–19.5 kHz (Differential Phase)
   - Band 5: 20.1–21.8 kHz (Chirp)
3. **Crypto Layer De-onioning**:
   - **AES-256-CBC**: Key derived from **Blue Line Stats** (Stations, Length, Interchanges).
   - **ChaCha20**: Nonce derived from **Station GPS coordinates**.
   - **Vigenère**: Applied over Latin-1 representation.
4. **The Maze**:
   - Decrypted output is a 50-station JSON structure.
   - Only 4 stations contain valid fragments.
5. **Assembly**:
   - `UG0x1{B1u3_L1n3_S1gn4l_6_D3lH1_M3Tr0_0p3R4T0R}`

---

## Challenge Files

1.  **[Signal_6_Challenge_Pack.zip](file:///c:/Users/offic/Downloads/DMRC/UNDERGROUND_0x1_Platform/underground-0x1/docs/challenges/Steganography/assets/Signal_6_Challenge_Pack.zip)**: Contains both the encrypted transmission and reference track.

---

## Real-world OSINT Values (Reference)

*   **Line**: Blue Line (Line 3/4)
*   **Main Line Length**: ~56.11 km
*   **Total Stations**: ~50 (Main Branch)
*   **Interchanges**: ~8 (variable based on year)

---

## Admin Panel Entry

| Field | Value |
|-------|-------|
| **Title** | Signal 6: The Blue Line Apocalypse |
| **Category** | Steganography |
| **Difficulty** | HARD (Elite) |
| **Points** | 500 |
| **Flag** | `UG0x1{B1u3_L1n3_S1gn4l_6_D3lH1_M3Tr0_0p3R4T0R}` |
| **Files** | `signal_6_encrypted.wav`, `metro_reference_track.wav` |
| **Description** | At 23:32 IST, a suspicious transmission was detected on the Delhi Metro **Blue Line** control channel "Signal 6". Field agents recovered two audio files: the encrypted transmission and a standard ambient noise profile from the station.<br><br>You have one job: Extract the hidden flag from `signal_6_encrypted.wav`.<br><br>No hints. No mercy. |
| **Hints** | None (Elite Challenge) |

---
