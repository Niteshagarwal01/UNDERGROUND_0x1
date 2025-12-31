#!/usr/bin/env python3
"""
Aqua Line Packet Intercept - SOLUTION
Flag: UG0x1{4qu4_L1n3_P4ck3t_Sn1ff3d}
"""

from scapy.all import *
import base64

PCAP_FILE = "aqua_network_capture.pcap"

def solve_method1_icmp():
    """Extract flag from XOR'd ICMP payloads"""
    print("\n[Method 1] ICMP XOR Extraction")
    print("=" * 40)
    
    packets = rdpcap(PCAP_FILE)
    flag_parts = []
    
    for pkt in packets:
        if ICMP in pkt and pkt[ICMP].id == 0x1337:
            if Raw in pkt:
                xored = pkt[Raw].load
                decoded = bytes([b ^ 0x42 for b in xored]).decode()
                flag_parts.append((pkt[ICMP].seq, decoded))
    
    # Sort by sequence and combine
    flag_parts.sort(key=lambda x: x[0])
    flag = ''.join([p[1] for p in flag_parts])
    print(f"[+] Flag from ICMP: {flag}")
    return flag

def solve_method2_tcp():
    """Extract Base64 flag from TCP payload"""
    print("\n[Method 2] TCP Base64 Extraction")
    print("=" * 40)
    
    packets = rdpcap(PCAP_FILE)
    
    for pkt in packets:
        if TCP in pkt and pkt[TCP].sport == 31337 and pkt[TCP].dport == 4444:
            if Raw in pkt:
                payload = pkt[Raw].load.decode()
                if "AUTH_TOKEN=" in payload:
                    b64 = payload.split("AUTH_TOKEN=")[1]
                    flag = base64.b64decode(b64).decode()
                    print(f"[+] Flag from TCP: {flag}")
                    return flag
    return None

def solve_method3_udp():
    """Extract hex flag from UDP payload"""
    print("\n[Method 3] UDP Hex Extraction")
    print("=" * 40)
    
    packets = rdpcap(PCAP_FILE)
    
    for pkt in packets:
        if UDP in pkt and pkt[UDP].sport == 13337 and pkt[UDP].dport == 5555:
            if Raw in pkt:
                hex_data = pkt[Raw].load.decode()
                flag = bytes.fromhex(hex_data).decode()
                print(f"[+] Flag from UDP: {flag}")
                return flag
    return None

def solve_method4_dns():
    """Extract flag from DNS TXT record"""
    print("\n[Method 4] DNS TXT Extraction")
    print("=" * 40)
    
    packets = rdpcap(PCAP_FILE)
    
    for pkt in packets:
        if DNS in pkt and pkt[DNS].qr == 1:
            if pkt[DNS].an:
                for i in range(pkt[DNS].ancount):
                    rr = pkt[DNS].an[i]
                    if hasattr(rr, 'rdata') and 'UG0x1' in str(rr.rdata):
                        flag = rr.rdata.decode() if isinstance(rr.rdata, bytes) else str(rr.rdata)
                        print(f"[+] Flag from DNS: {flag}")
                        return flag
    return None

def find_attacker():
    """Identify the attacker IP from patterns"""
    print("\n[Bonus] Attacker Identification")
    print("=" * 40)
    
    packets = rdpcap(PCAP_FILE)
    ip_counts = {}
    
    for pkt in packets:
        if IP in pkt and TCP in pkt:
            if pkt[TCP].flags == 'S':  # SYN scan
                src = pkt[IP].src
                ip_counts[src] = ip_counts.get(src, 0) + 1
    
    # Attacker is the one doing port scanning
    attacker = max(ip_counts.items(), key=lambda x: x[1])
    print(f"[+] Attacker IP: {attacker[0]} ({attacker[1]} SYN packets)")
    return attacker[0]

if __name__ == "__main__":
    print("=" * 50)
    print("  Aqua Line Packet Intercept - Solver")
    print("=" * 50)
    
    # Try all methods
    find_attacker()
    solve_method1_icmp()
    solve_method2_tcp()
    solve_method3_udp()
    solve_method4_dns()
    
    print("\n" + "=" * 50)
    print("  FLAG: UG0x1{4qu4_L1n3_P4ck3t_Sn1ff3d}")
    print("=" * 50)
