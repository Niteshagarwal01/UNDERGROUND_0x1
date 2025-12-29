import random
from datetime import datetime, timedelta
import os

# Configuration
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
OUTPUT_FILE = os.path.join(PROJECT_DIR, "public", "archives", "cctv_network_log.txt")
TOTAL_LINES = 2500
ATTACK_START = datetime(2024, 10, 15, 14, 32, 17)
ATTACK_END = datetime(2024, 10, 15, 14, 33, 4)

# Suspicious MAC (the needle)
SUSPICIOUS_MAC = "00:1A:2B:3C:4D:5E"
SUSPICIOUS_IP = "192.168.47.133"

# Normal MACs (haystack)
NORMAL_MACS = [
    "00:16:3E:5A:2B:C1", "00:16:3E:5A:2B:C2", "00:16:3E:5A:2B:C3",
    "00:16:3E:5A:2B:C4", "00:16:3E:5A:2B:C5", "00:16:3E:5A:2B:C6",
    "00:16:3E:5A:2B:C7", "00:16:3E:5A:2B:C8", "00:16:3E:5A:2B:C9",
    "00:16:3E:5A:2B:CA", "00:16:3E:5A:2B:CB", "00:16:3E:5A:2B:CC",
    "00:1C:42:AA:BB:01", "00:1C:42:AA:BB:02", "00:1C:42:AA:BB:03",
    "00:50:56:C0:00:01", "00:50:56:C0:00:02", "00:50:56:C0:00:03",
    "08:00:27:12:34:56", "08:00:27:12:34:57", "08:00:27:12:34:58",
]

# Decoy suspicious-looking MACs (red herrings)
DECOY_MACS = [
    "DE:AD:BE:EF:00:01",  # Looks suspicious but legit device
    "00:11:22:33:44:55",  # Sequential pattern, actually test device
    "AA:BB:CC:DD:EE:FF",  # Broadcast-like, but normal router
]

# Camera IDs
CAMERAS = [f"CAM-BL-{str(i).zfill(3)}" for i in range(1, 51)]

# Log message templates
INFO_TEMPLATES = [
    "[INFO] [{cam}] Heartbeat received from {ip} (MAC: {mac})",
    "[INFO] [{cam}] Frame buffer sync - 30fps stable",
    "[INFO] [{cam}] Connection established from {ip} (MAC: {mac}) - Routine sync",
    "[INFO] [{cam}] Motion detection: ACTIVE",
    "[INFO] [{cam}] Infrared mode: AUTO",
    "[INFO] [{cam}] PTZ command received - Pan: {angle}deg",
    "[INFO] [{cam}] Recording status: ACTIVE",
    "[INFO] [{cam}] Video stream: H.264 @ 1080p",
    "[INFO] [STORAGE] Disk usage: {disk}% - Normal",
    "[INFO] [NET] Bandwidth utilization: {bw} Mbps",
    "[INFO] [AUTH] Session validated for user: cctv_operator_{op}",
    "[INFO] [SYNC] NTP sync successful - drift: {drift}ms",
    "[INFO] [BACKUP] Incremental backup in progress",
    "[INFO] [{cam}] Lens calibration: OK",
    "[INFO] [{cam}] Audio channel: MUTED",
]

WARN_TEMPLATES = [
    "[WARN] [{cam}] High CPU usage detected: {cpu}%",
    "[WARN] [{cam}] Frame drop detected - recovering",
    "[WARN] [NET] Latency spike: {latency}ms",
    "[WARN] [STORAGE] Write queue building up",
    "[WARN] [{cam}] Low light conditions detected",
]

ERROR_TEMPLATES = [
    "[ERROR] [{cam}] Connection timeout from {ip}",
    "[ERROR] [{cam}] Frame sync lost - reconnecting",
    "[ERROR] [NET] Packet loss detected: {loss}%",
]

# During attack - special messages
ATTACK_TEMPLATES = [
    "[WARN] [{cam}] Unexpected packet size: {size} bytes from {ip} (MAC: {mac})",
    "[ERROR] [{cam}] Authentication anomaly detected from {ip} (MAC: {mac})",
    "[WARN] [FIREWALL] Unusual traffic pattern from {ip} (MAC: {mac})",
    "[ERROR] [{cam}] Buffer overflow attempt blocked from {ip} (MAC: {mac})",
]

# Blackout messages
BLACKOUT_TEMPLATES = [
    "[CRITICAL] [{cam}] VIDEO FEED LOST",
    "[CRITICAL] [{cam}] CONNECTION TERMINATED",
    "[ERROR] [{cam}] Stream interrupted - source unavailable",
]

def generate_timestamp(base_time, offset_seconds, offset_ms):
    ts = base_time + timedelta(seconds=offset_seconds, milliseconds=offset_ms)
    return ts.strftime("[%Y-%m-%d %H:%M:%S.") + f"{offset_ms:03d}]"

def generate_log_line(timestamp, is_attack_window=False, is_blackout=False, inject_suspicious=False):
    cam = random.choice(CAMERAS)
    
    if is_blackout:
        template = random.choice(BLACKOUT_TEMPLATES)
        return f"{timestamp} {template.format(cam=cam)}"
    
    if inject_suspicious:
        template = random.choice(ATTACK_TEMPLATES)
        return f"{timestamp} {template.format(cam=cam, ip=SUSPICIOUS_IP, mac=SUSPICIOUS_MAC, size=random.randint(65000, 99999))}"
    
    if is_attack_window:
        # Mix of normal, warn, and some suspicious-looking decoys
        roll = random.random()
        if roll < 0.7:
            template = random.choice(INFO_TEMPLATES)
        elif roll < 0.9:
            template = random.choice(WARN_TEMPLATES)
        else:
            template = random.choice(ERROR_TEMPLATES)
    else:
        # Normal operation
        roll = random.random()
        if roll < 0.85:
            template = random.choice(INFO_TEMPLATES)
        elif roll < 0.95:
            template = random.choice(WARN_TEMPLATES)
        else:
            template = random.choice(ERROR_TEMPLATES)
    
    # Occasionally use decoy MACs to throw off investigators
    if random.random() < 0.02:
        mac = random.choice(DECOY_MACS)
    else:
        mac = random.choice(NORMAL_MACS)
    
    ip = f"10.0.{random.randint(1,10)}.{random.randint(10,250)}"
    
    line = template.format(
        cam=cam,
        ip=ip,
        mac=mac,
        angle=random.randint(0, 360),
        disk=round(random.uniform(60, 80), 1),
        bw=round(random.uniform(30, 60), 1),
        op=str(random.randint(1, 5)).zfill(2),
        drift=random.randint(-50, 50),
        cpu=random.randint(70, 95),
        latency=random.randint(100, 500),
        loss=round(random.uniform(0.1, 2.0), 1),
    )
    
    return f"{timestamp} {line}"

def main():
    lines = []
    
    # Header
    header = """================================================================================
DMRC CCTV NETWORK SERVER - SECURITY LOG EXPORT
================================================================================
Server: CCTV-CTRL-BL-01 (Blue Line Primary Controller)
Export Date: 2024-10-16 09:15:32 IST
Log Period: 2024-10-15 14:00:00 - 2024-10-15 15:00:00
Total Entries: 2500+
Classification: CONFIDENTIAL - INTERNAL INVESTIGATION ONLY
Incident Reference: BL-2024-1015-SEC-001
================================================================================

NOTE: This log has been extracted for forensic analysis following the
Blue Line network incident on October 15, 2024. All timestamps are IST.

================================================================================
"""
    lines.append(header)
    
    # Generate 2500 log entries over 1 hour period
    base_time = datetime(2024, 10, 15, 14, 0, 0)
    attack_start_offset = 32 * 60 + 17  # 14:32:17 in seconds from 14:00:00
    attack_end_offset = 33 * 60 + 4     # 14:33:04
    
    suspicious_injected = False
    suspicious_line_num = random.randint(1200, 1350)  # Somewhere in middle
    
    for i in range(TOTAL_LINES):
        # Calculate timestamp (spread over 1 hour)
        seconds_offset = (i / TOTAL_LINES) * 3600
        ms_offset = random.randint(0, 999)
        
        timestamp = generate_timestamp(base_time, int(seconds_offset), ms_offset)
        
        # Determine if in attack window
        is_attack = attack_start_offset <= seconds_offset <= attack_end_offset
        
        # Blackout period (14:32:20 - 14:33:00)
        blackout_start = 32 * 60 + 20
        blackout_end = 33 * 60
        is_blackout = blackout_start <= seconds_offset <= blackout_end
        
        # Inject the ONE suspicious entry
        inject_sus = (i == suspicious_line_num and not suspicious_injected)
        if inject_sus:
            suspicious_injected = True
            # Force timestamp to be during attack
            timestamp = "[2024-10-15 14:32:23.847]"
        
        line = generate_log_line(timestamp, is_attack, is_blackout, inject_sus)
        lines.append(line)
    
    # Footer
    footer = """
================================================================================
END OF LOG EXPORT
================================================================================
Exported by: DMRC Security Operations Center
Verified by: [REDACTED]
Hash (SHA-256): 7f3b8c9a2e5d1f4c6b8a9e2d5f1c3b7a8e9f2d5c1b4a7e8f9c2d5b1a4e7f8c9d
================================================================================
NOTE: Any unauthorized access or distribution of this log is a violation of
DMRC Security Protocol 7.3.1 and Indian IT Act, 2000.
================================================================================
"""
    lines.append(footer)
    
    # Write to file
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    
    print(f"Generated {TOTAL_LINES} log entries")
    print(f"Suspicious entry injected at line ~{suspicious_line_num}")
    print(f"Suspicious MAC: {SUSPICIOUS_MAC}")
    print(f"Suspicious IP: {SUSPICIOUS_IP}")

if __name__ == "__main__":
    main()
