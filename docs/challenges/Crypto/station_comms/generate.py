#!/usr/bin/env python3
"""Generate challenge files for Station Comms"""
import json
import random
import hashlib
from station_crypto import (
    VakraSankriya, KunjiPrabandh, GuptikaranYantra, 
    VakraBinku, SthanSanchaar, STATION_REGISTRY
)

FLAG = b"UG0x1{w34k_curv3_p0hl1g_h3llm4n_4tt4ck}"

# Master station private key (players must recover this)
MASTER_PRIVATE_KEY = 0x1A2B3C4D5E6F7890ABCDEF1234567890ABCD

def main():
    print("Generating Station Comms challenge files...")
    
    vakra = VakraSankriya()
    
    # Generate station key pairs
    stations = {}
    for code, info in list(STATION_REGISTRY.items())[:10]:
        kunji = KunjiPrabandh(vakra)
        niji, sarv = kunji.utpadan(code.encode())
        stations[code] = {
            "name": info["name"],
            "private_key": hex(niji),  # SECRET - not included in output
            "public_key": {
                "x": hex(sarv.x),
                "y": hex(sarv.y)
            }
        }
    
    # Control station with known key for flag
    control_kunji = KunjiPrabandh(vakra)
    control_kunji._niji_kunji = MASTER_PRIVATE_KEY
    control_kunji._sarvajanik_kunji = vakra.adharpurna_gunaa(MASTER_PRIVATE_KEY, vakra.utpadak)
    
    stations["CTRL"] = {
        "name": "Central Control",
        "private_key": hex(MASTER_PRIVATE_KEY),  # SECRET
        "public_key": {
            "x": hex(control_kunji._sarvajanik_kunji.x),
            "y": hex(control_kunji._sarvajanik_kunji.y)
        }
    }
    
    # Save public keys only
    public_keys = {}
    for code, data in stations.items():
        public_keys[code] = {
            "name": data["name"],
            "public_key": data["public_key"]
        }
    
    with open('public_keys.json', 'w') as f:
        json.dump(public_keys, f, indent=2)
    print("[SAVED] public_keys.json")
    
    # Generate messages
    messages = []
    random.seed(0xDEAD)
    
    message_templates = [
        "PASSENGER_COUNT: Station {0} reports {1} passengers in last hour.",
        "AFC_STATUS: Terminal {0}-{1:03d} operational. Queue: {2} passengers.",
        "TRAIN_ARRIVAL: Train {0} arriving at {1} in {2} minutes.",
        "SYSTEM_STATUS: Zone {0} all systems nominal. Load: {1}%.",
        "MAINTENANCE_REQ: Terminal {0}-{1:03d} requires calibration.",
    ]
    
    station_list = list(stations.keys())
    
    for i in range(50):
        sender = random.choice(station_list)
        receiver = random.choice([s for s in station_list if s != sender])
        
        if i == 37:  # Hidden flag message
            msg_type = 0x08
            plaintext = FLAG
        else:
            msg_type = random.randint(0x01, 0x07)
            template = random.choice(message_templates)
            plaintext = template.format(
                random.choice(station_list),
                random.randint(100, 999),
                random.randint(1, 100)
            ).encode()
        
        # Get keys
        sender_priv = int(stations[sender]["private_key"], 16)
        recv_pub = VakraBinku(
            int(stations[receiver]["public_key"]["x"], 16),
            int(stations[receiver]["public_key"]["y"], 16)
        )
        
        # ECDH shared secret
        shared_point = vakra.adharpurna_gunaa(sender_priv, recv_pub)
        shared_secret = hashlib.sha256(shared_point.x.to_bytes(28, 'big')).digest()
        
        # Encrypt
        yantra = GuptikaranYantra(shared_secret)
        nonce, ciphertext, tag = yantra.guptan(plaintext)
        
        messages.append({
            "id": i,
            "sender": sender,
            "receiver": receiver,
            "type": msg_type,
            "nonce": nonce.hex(),
            "ciphertext": ciphertext.hex(),
            "tag": tag.hex()
        })
    
    with open('captured_messages.json', 'w') as f:
        json.dump({"messages": messages, "count": len(messages)}, f, indent=2)
    print(f"[SAVED] captured_messages.json ({len(messages)} messages)")
    
    # Save secrets for verification
    with open('.secrets.json', 'w') as f:
        json.dump({
            "flag": FLAG.decode(),
            "flag_message_id": 37,
            "master_private_key": hex(MASTER_PRIVATE_KEY),
            "all_private_keys": {k: v["private_key"] for k, v in stations.items()}
        }, f, indent=2)
    print("[SAVED] .secrets.json (DO NOT INCLUDE IN ZIP)")
    
    print("\n[OK] Challenge files generated!")
    print(f"[SECRET] Flag: {FLAG.decode()}")
    print(f"[SECRET] Master key: {hex(MASTER_PRIVATE_KEY)}")

if __name__ == '__main__':
    main()
