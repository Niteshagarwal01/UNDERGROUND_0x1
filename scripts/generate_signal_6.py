#!/usr/bin/env python3
"""
Signal 6: The Blue Line Apocalypse – Challenge Generator

This script generates the challenge artifact:
- Generates AES/ChaCha20/Vigenère-encrypted payload
- Builds a 50-station JSON maze with real & fake data
- Implements a spectral chaos engine
"""

import json
import math
import base64
import hmac
import hashlib
import os
from typing import List, Tuple, Dict

# Try imports, if missing just print a warning (user will need to install them)
try:
    import numpy as np
    from scipy.io import wavfile
    from scipy.fft import fft, ifft
    from Crypto.Cipher import AES, ChaCha20
    from Crypto.Random import get_random_bytes
    from Crypto.Util.Padding import pad
except ImportError as e:
    print(f"CRITICAL: Missing dependency {e}. Please install numpy, scipy, pycryptodome.")
    exit(1)


# =============================================================================
# 0. Global configuration
# =============================================================================

FINAL_FLAG = "UG0x1{B1u3_L1n3_S1gn4l_6_D3lH1_M3Tr0_0p3R4T0R}"

SAMPLE_RATE = 44100
DURATION_SEC = 45

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Output to the steganography assets folder
# ../docs/challenges/Steganography/assets/
ASSET_DIR = os.path.join(BASE_DIR, "..", "docs", "challenges", "Steganography", "assets")
os.makedirs(ASSET_DIR, exist_ok=True)

COVER_WAV_IN = os.path.join(BASE_DIR, "cover_metro_ambience.wav") 
CHALLENGE_WAV_OUT = os.path.join(ASSET_DIR, "signal_6_encrypted.wav")
STATION_MAZE_JSON = os.path.join(BASE_DIR, "signal_6_station_maze.json")


# =============================================================================
# 1. AES key derivation from Delhi Metro data
# =============================================================================

class MetroKeyDerivation:
    """
    Derives AES-256 key from Delhi Metro Blue Line stats.
    """

    @staticmethod
    def get_correct_parameters() -> Dict[str, int]:
        return {
            "blue_line_stations": 50,  # main stretch
            "blue_line_length100": 5611,  # 56.11 km -> 5611
            "total_dmrc_lines": 12,
            "interchanges_blue": 8,      # number of interchange stations
        }

    @staticmethod
    def build_key_material(params: Dict[str, int]) -> str:
        # Ordered concatenation for reproducibility
        return (
            "DELHI_METRO_BLUE_6_"
            f"{params['blue_line_stations']}"
            f"{params['blue_line_length100']}"
            f"{params['total_dmrc_lines']}"
            f"{params['interchanges_blue']}"
        )

    @staticmethod
    def derive_aes_key() -> bytes:
        params = MetroKeyDerivation.get_correct_parameters()
        key_material = MetroKeyDerivation.build_key_material(params)
        return hashlib.sha256(key_material.encode()).digest()


# =============================================================================
# 2. Triple encryption: AES-256 -> ChaCha20 -> Vigenère
# =============================================================================

class TripleCipher:
    """
    AES-256-CBC -> ChaCha20 -> Vigenère.
    """

    @staticmethod
    def aes256_cbc_encrypt(plaintext: bytes, key: bytes) -> Tuple[bytes, bytes]:
        iv = get_random_bytes(16)
        cipher = AES.new(key, AES.MODE_CBC, iv)
        ct = cipher.encrypt(pad(plaintext, AES.block_size))
        return iv + ct, iv

    @staticmethod
    def chacha20_encrypt(aes_ct: bytes) -> bytes:
        """
        Derive ChaCha20 key from HMAC over AES ciphertext,
        derive nonce from pseudo GPS string (hard-coded here).
        """
        # Example pseudo “GPS” data
        gps_concat = "28.62477177.218765" + "28.6301777.22754"
        nonce_raw = hashlib.sha256(gps_concat.encode()).digest()
        nonce = nonce_raw[:12]

        hmac_key = hmac.new(
            aes_ct,
            b"BLUE_LINE_CHAOS",
            hashlib.sha256
        ).digest()[:32]

        cipher = ChaCha20.new(key=hmac_key, nonce=nonce)
        return cipher.encrypt(aes_ct)

    @staticmethod
    def vigenere_encrypt(text: str, key: str) -> str:
        res = []
        k_len = len(key)
        for i, ch in enumerate(text):
            k = ord(key[i % k_len]) & 0xFF
            c = (ord(ch) + k) & 0xFF
            res.append(chr(c))
        return "".join(res)

    @staticmethod
    def encrypt_payload(plaintext_json: dict, aes_key: bytes) -> bytes:
        """
        Full pipeline: JSON -> AES -> ChaCha20 -> Vigenère -> bytes
        """
        plaintext = json.dumps(plaintext_json, separators=(",", ":")).encode()

        # AES layer
        aes_ct, _iv = TripleCipher.aes256_cbc_encrypt(plaintext, aes_key)

        # ChaCha20 layer
        chacha_ct = TripleCipher.chacha20_encrypt(aes_ct)

        # Vigenère layer – work in latin-1
        chacha_str = chacha_ct.decode("latin-1")
        vig_key = "DELHI_METRO_BLUE_LINE"
        vig_ct_str = TripleCipher.vigenere_encrypt(chacha_str, vig_key)

        return vig_ct_str.encode("latin-1")


# =============================================================================
# 3. 50-station JSON maze with flag fragments
# =============================================================================

class StationMazeBuilder:
    """
    Build a JSON structure with 50 station entries.
    """

    FLAG_FRAGMENTS = {
        7:  "B1u3_",
        23: "L1n3_",
        31: "S1gn4l_6_",
        42: "D3lH1_M3Tr0_0p3R4T0R",
    }

    @staticmethod
    def fake_station_data(station_id: int) -> dict:
        return {
            "station_id": station_id,
            "station_name": f"Station_{station_id}",
            "opening_year": 2002 + (station_id % 20),
            "daily_passengers": 50000 + station_id * 400,
            "interchange": (station_id % 5 == 0),
            "fake_flag": f"FLAG{{fake_station_{station_id}}}",
        }

    @staticmethod
    def real_fragment_data(station_id: int, fragment: str) -> dict:
        return {
            "station_id": station_id,
            "station_name": f"Station_{station_id}",
            "hidden_fragment_b64": base64.b64encode(fragment.encode()).decode(),
            "encoding": "base64",
        }

    @staticmethod
    def build_maze() -> dict:
        maze = {}
        for sid in range(1, 51):
            if sid in StationMazeBuilder.FLAG_FRAGMENTS:
                frag = StationMazeBuilder.FLAG_FRAGMENTS[sid]
                data = StationMazeBuilder.real_fragment_data(sid, frag)
            else:
                data = StationMazeBuilder.fake_station_data(sid)

            enc = base64.b64encode(json.dumps(data).encode()).decode()
            maze[f"station_{sid:02d}"] = {
                "data": enc,
                "checksum": hashlib.md5(json.dumps(data).encode()).hexdigest(),
            }
        return maze


# =============================================================================
# 4. Spectral chaos engine (simplified skeleton)
# =============================================================================

class SpectralChaosEngine:
    """
    Embeds encrypted payload bits into multiple bands.
    """

    @staticmethod
    def embed_payload(cover: np.ndarray, payload_bytes: bytes) -> np.ndarray:
        """
        cover: float32 mono array in [-1, 1]
        payload_bytes: encrypted payload to embed
        """
        # Convert cover to frequency domain
        N = len(cover)
        spectrum = fft(cover)
        freqs = np.fft.fftfreq(N, d=1.0 / SAMPLE_RATE)

        # Convert payload to bitstring
        bitstring = "".join(f"{b:08b}" for b in payload_bytes)
        print(f"[DEBUG] Payload size: {len(payload_bytes)} bytes, {len(bitstring)} bits")

        # Distribute bits into 5 interleaved sub-streams
        bands_bits = [
            bitstring[0::5],
            bitstring[1::5],
            bitstring[2::5],
            bitstring[3::5],
            bitstring[4::5],
        ]

        # Define 5 bands (in Hz)
        bands = [
            (8200, 9800),
            (11300, 12100),
            (14700, 15900),
            (18200, 19500),
            (20100, 21800),
        ]

        # For each band, choose indices and tweak phases/amplitudes
        modified_spectrum = np.copy(spectrum)

        for band_idx, (f_lo, f_hi) in enumerate(bands):
            bits = bands_bits[band_idx]
            # find indices in this band
            band_mask = (np.abs(freqs) >= f_lo) & (np.abs(freqs) <= f_hi)
            band_indices = np.where(band_mask)[0]

            if len(band_indices) == 0:
                continue

            # Use a subset of indices to store bits
            step = max(1, len(band_indices) // max(1, len(bits)))
            used_indices = band_indices[::step][:len(bits)]

            for bi, bit in enumerate(bits):
                if bi >= len(used_indices): break
                idx = used_indices[bi]
                val = modified_spectrum[idx]
                mag = np.abs(val)
                phase = np.angle(val)

                if bit == "1":
                    # small phase shift
                    phase += math.pi / 12
                    # slight magnitude bump
                    mag *= 1.02
                else:
                    phase -= math.pi / 12
                    mag *= 0.98

                modified_spectrum[idx] = mag * np.exp(1j * phase)

        # Inverse FFT to time domain
        stego = np.real(ifft(modified_spectrum))

        # Normalize back to [-1, 1]
        stego = stego / np.max(np.abs(stego) + 1e-9)
        return stego.astype(np.float32)


# =============================================================================
# 5. Main generator function
# =============================================================================

def main():
    print("[-] Starting Signal 6 Generator...")
    # 1) Build the station maze and core plaintext JSON
    maze = StationMazeBuilder.build_maze()

    # reconstruct flag from fragments (for sanity check)
    frags = StationMazeBuilder.FLAG_FRAGMENTS
    assembled_payload = frags[7] + frags[23] + frags[31] + frags[42]
    expected_inner = FINAL_FLAG[len("UG0x1{"):-1]
    if assembled_payload != expected_inner:
        print(f"[!] Warning: Fragment assembly mismatch. \nGot: {assembled_payload}\nWant: {expected_inner}")

    plaintext_json = {
        "meta": {
            "line": "Blue Line",
            "signal": "6",
            "source": "Vaishali",
            "note": "Only four stations hold the truth.",
        },
        "maze": maze,
        "final_flag_format": "UG0x1{...}",
        "final_flag_example": FINAL_FLAG,
    }

    # 2) Derive AES key from metro parameters
    aes_key = MetroKeyDerivation.derive_aes_key()
    print(f"[-] AES Key derived: {aes_key.hex()[:8]}...")

    # 3) Encrypt the whole JSON via triple cipher
    encrypted_payload = TripleCipher.encrypt_payload(plaintext_json, aes_key)
    print(f"[-] Triple Cipher Payload Size: {len(encrypted_payload)} bytes")

    # 4) Load or synthesize cover audio
    if os.path.exists(COVER_WAV_IN):
        print(f"[-] Loading cover: {COVER_WAV_IN}")
        sr, data = wavfile.read(COVER_WAV_IN)
        if sr != SAMPLE_RATE:
            print(f"[!] Warning: Sample rate mismatch {sr} vs {SAMPLE_RATE}")
        if data.ndim > 1:
            data = data.mean(axis=1)  # mono mixdown
        # Normalize to float32 -1..1
        max_val = np.max(np.abs(data))
        if max_val == 0: max_val = 1
        cover = data.astype(np.float32) / max_val
    else:
        print("[-] Generating SYNTHETIC Metro Ambience (Deterministic)...")
        # Generate 45s of "Metro Hum"
        t = np.linspace(0, DURATION_SEC, int(SAMPLE_RATE * DURATION_SEC))
        
        # Base hum: 50Hz (AC mains) + harmonics
        cover = 0.1 * np.sin(2 * np.pi * 50 * t)     # 50 Hz
        cover += 0.05 * np.sin(2 * np.pi * 150 * t)  # 150 Hz
        cover += 0.02 * np.sin(2 * np.pi * 350 * t)  # 350 Hz
        
        # Add some "Platform Beeps" (Door closing warning)
        # 1kHz beep every 5 seconds
        beep_freq = 1000
        for i in range(0, DURATION_SEC, 5):
             # Beep duration 0.5s
             t_beep = t[(t >= i) & (t < i + 0.5)]
             beep_wave = 0.05 * np.sin(2 * np.pi * beep_freq * t_beep)
             # Add to cover (indices matching time)
             idx_start = int(i * SAMPLE_RATE)
             idx_end = idx_start + len(beep_wave)
             if idx_end < len(cover):
                 cover[idx_start:idx_end] += beep_wave

        # Add slight deterministic noise floor (consistent seed)
        np.random.seed(42) 
        cover += 0.005 * np.random.randn(len(t))
        
        cover = cover.astype(np.float32)
        
        # SAVE this as the reference track for the player
        ref_out = os.path.join(ASSET_DIR, "metro_reference_track.wav")
        wavfile.write(ref_out, SAMPLE_RATE, (cover * 32767.0).astype(np.int16))
        print(f"[+] Reference Audio Generated: {ref_out}")

    # Trim or pad cover to DURATION_SEC
    desired_len = int(SAMPLE_RATE * DURATION_SEC)
    if len(cover) > desired_len:
        cover = cover[:desired_len]
    elif len(cover) < desired_len:
        pad_len = desired_len - len(cover)
        cover = np.concatenate([cover, np.zeros(pad_len, dtype=np.float32)])

    # 5) Embed payload in spectral domain
    print("[-] Embedding payload into spectral bands...")
    stego = SpectralChaosEngine.embed_payload(cover, encrypted_payload)

    # 6) Save stego WAV
    int16_data = (stego * 32767.0).astype(np.int16)
    wavfile.write(CHALLENGE_WAV_OUT, SAMPLE_RATE, int16_data)
    print(f"[+] Challenge WAV written to {CHALLENGE_WAV_OUT}")

    # 7) Save station maze for your internal reference
    with open(STATION_MAZE_JSON, "w") as f:
        json.dump(maze, f, indent=2)
    print(f"[+] Station maze written to {STATION_MAZE_JSON}")

    print("[+] FINAL FLAG:", FINAL_FLAG)


if __name__ == "__main__":
    main()
