#!/usr/bin/env python3
"""
Aqua Line Packet Intercept - PCAP Generator
Category: Networking
Flag: UG0x1{4qu4_L1n3_P4ck3t_Sn1ff3d}
"""

from scapy.all import *
import random
import base64
import struct

FLAG = "UG0x1{4qu4_L1n3_P4ck3t_Sn1ff3d}"
OUTPUT_FILE = "aqua_network_capture.pcap"

# DMRC Network IPs
SCADA_SERVER = "192.168.100.1"
TRAIN_CONTROLLER = "192.168.100.10"
STATION_GATEWAY = "192.168.100.50"
OCC_SERVER = "192.168.100.100"
ATTACKER_IP = "192.168.100.66"
FAKE_IPS = ["192.168.100.{}".format(i) for i in range(20, 45)]

packets = []

def add_noise_http():
    """Add fake HTTP traffic"""
    for _ in range(50):
        src = random.choice(FAKE_IPS)
        dst = random.choice([SCADA_SERVER, OCC_SERVER])
        sport = random.randint(40000, 60000)
        
        # SYN
        packets.append(IP(src=src, dst=dst)/TCP(sport=sport, dport=80, flags='S'))
        # SYN-ACK
        packets.append(IP(src=dst, dst=src)/TCP(sport=80, dport=sport, flags='SA'))
        # ACK
        packets.append(IP(src=src, dst=dst)/TCP(sport=sport, dport=80, flags='A'))
        
        # HTTP Request
        http_req = "GET /status HTTP/1.1\r\nHost: dmrc-internal.local\r\n\r\n"
        packets.append(IP(src=src, dst=dst)/TCP(sport=sport, dport=80, flags='PA')/Raw(load=http_req))
        
        # HTTP Response
        http_resp = "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nAqua Line: OPERATIONAL"
        packets.append(IP(src=dst, dst=src)/TCP(sport=80, dport=sport, flags='PA')/Raw(load=http_resp))

def add_noise_dns():
    """Add fake DNS queries"""
    dns_queries = [
        "dmrc-scada.local", "train-control.dmrc.local", "occ.dmrc.local",
        "aqua-line.dmrc.local", "noida-depot.dmrc.local", "sector51.dmrc.local"
    ]
    for _ in range(30):
        query = random.choice(dns_queries)
        packets.append(IP(src=random.choice(FAKE_IPS), dst="192.168.100.2")/
                      UDP(sport=random.randint(40000, 60000), dport=53)/
                      DNS(rd=1, qd=DNSQR(qname=query)))

def add_noise_icmp():
    """Add ping traffic"""
    for _ in range(20):
        src = random.choice(FAKE_IPS)
        dst = random.choice([SCADA_SERVER, TRAIN_CONTROLLER, STATION_GATEWAY])
        packets.append(IP(src=src, dst=dst)/ICMP(type=8))
        packets.append(IP(src=dst, dst=src)/ICMP(type=0))

def add_fake_flags():
    """Add red herrings - fake flags in plaintext"""
    fake_flags = [
        "FLAG{this_is_not_the_flag}",
        "UG0x1{wr0ng_fl4g_k33p_l00k1ng}",
        "flag=DECOY12345",
        "secret: UG0x1{n1c3_try_but_n0}",
    ]
    for fake in fake_flags:
        src = random.choice(FAKE_IPS)
        packets.append(IP(src=src, dst=OCC_SERVER)/TCP(sport=random.randint(40000, 60000), dport=8080, flags='PA')/
                      Raw(load=f"DEBUG: {fake}"))

def add_flag_hidden():
    """Hide the real flag in multiple layers"""
    
    # Method 1: Flag split across multiple ICMP payloads
    flag_parts = [FLAG[i:i+8] for i in range(0, len(FLAG), 8)]
    seq = 1000
    for part in flag_parts:
        xored = bytes([b ^ 0x42 for b in part.encode()])
        packets.append(IP(src=ATTACKER_IP, dst=SCADA_SERVER, id=seq)/
                      ICMP(type=8, id=0x1337, seq=seq)/Raw(load=xored))
        seq += 1
    
    # Method 2: Base64 encoded in TCP payload
    encoded = base64.b64encode(FLAG.encode()).decode()
    packets.append(IP(src=ATTACKER_IP, dst=TRAIN_CONTROLLER)/
                  TCP(sport=31337, dport=4444, flags='PA')/
                  Raw(load=f"AUTH_TOKEN={encoded}"))
    
    # Method 3: Hex encoded in UDP
    hex_flag = FLAG.encode().hex()
    packets.append(IP(src=ATTACKER_IP, dst=STATION_GATEWAY)/
                  UDP(sport=13337, dport=5555)/
                  Raw(load=hex_flag))
    
    # Method 4: Hidden in DNS TXT response
    packets.append(IP(src="192.168.100.2", dst=ATTACKER_IP)/
                  UDP(sport=53, dport=31337)/
                  DNS(qr=1, aa=1, qd=DNSQR(qname="flag.dmrc.local"),
                      an=DNSRR(rrname="flag.dmrc.local", type="TXT", rdata=FLAG)))

def add_suspicious_traffic():
    """Add suspicious patterns that point to attacker"""
    
    # Port scan from attacker
    for port in [21, 22, 23, 80, 443, 8080, 3389, 5900]:
        packets.append(IP(src=ATTACKER_IP, dst=SCADA_SERVER)/
                      TCP(sport=random.randint(40000, 60000), dport=port, flags='S'))
    
    # Telnet login attempt
    packets.append(IP(src=ATTACKER_IP, dst=TRAIN_CONTROLLER)/
                  TCP(sport=54321, dport=23, flags='PA')/
                  Raw(load="admin\r\naquaLine2024\r\n"))
    
    # SSH brute force pattern
    for _ in range(10):
        packets.append(IP(src=ATTACKER_IP, dst=OCC_SERVER)/
                      TCP(sport=random.randint(40000, 60000), dport=22, flags='S'))

def generate_pcap():
    """Generate the PCAP file"""
    print("[*] Generating Aqua Line network capture...")
    
    # Add all traffic types
    add_noise_http()
    add_noise_dns()
    add_noise_icmp()
    add_fake_flags()
    add_flag_hidden()
    add_suspicious_traffic()
    
    # Shuffle packets to mix them up
    random.shuffle(packets)
    
    # Write to PCAP
    wrpcap(OUTPUT_FILE, packets)
    print(f"[+] Created {OUTPUT_FILE} with {len(packets)} packets")
    print(f"[+] Flag: {FLAG}")
    print("\n[*] Flag locations:")
    print("    1. XOR'd (0x42) across ICMP packets from 192.168.100.66, ID=0x1337")
    print("    2. Base64 in TCP:31337->4444 AUTH_TOKEN field")
    print("    3. Hex encoded in UDP:13337->5555")
    print("    4. DNS TXT record for flag.dmrc.local")

if __name__ == "__main__":
    generate_pcap()
