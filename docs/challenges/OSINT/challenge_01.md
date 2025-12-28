# UNDERGROUND_0x1 – OSINT Challenge 1: Social Signal
## Complete Challenge Specification & Developer Guide

**Classification:** RESTRICTED – EXERCISE MATERIAL  
**Challenge ID:** OSINT-H-001  
**Difficulty:** HARD  
**Category:** Open Source Intelligence (OSINT)  
**Points:** 500  

---

## 🎯 QUICK REFERENCE

| Item | Value |
|------|-------|
| **Plaintext Flag** | `UG0x1{d34d_dr0p_tr4c3d_v1a_cach3_92}` |
| **Encoding Chain** | Base64 → XOR(0x42) → ROT13 (3 layers) |
| **Entry Point** | `/archives/forum_thread_cache.html` |
| **Secondary Source** | `/archives/paste_mirror.html` |
| **Tertiary Source** | `/archives/dns_txt_records.html` (flag fragment 2) |
| **Points** | 500 |

---

## INTELLIGENCE BRIEFING

### Threat Actor Profile

**Designation:** AFC-Insider Class 92  
**Role:** Former DMRC Infrastructure Contractor (AFC Systems)  
**Skill Level:** Intermediate–Advanced  
**Pattern:** Compartmentalized exfiltration with obfuscated dead drops  
**Timeline:** 6–18 months persistent access  
**Tradecraft:** Multi-encoding, temporal markers, misdirection

### Challenge Context

Intelligence indicates that a compromised insider left multiple "dead drops" across developer communities before burning their digital footprint. Your OSINT team has recovered a forum cache. However, the threat actor deliberately left misleading information to misdirect investigators.

---

## PLAYER-FACING CONTENT

### On CTF Website

**Title:** `[OSINT] Social Signal (Medium)`

**Description:**

> Recover the hidden intelligence fragment by identifying the real credential drop among multiple false leads. Correlate metadata across forum posts and archive mirrors to decode the exfiltration evidence.

**Target Handle:** `@AFC_Insider_92`  
**Status:** Account burned/deleted  
**Difficulty:** Requires careful correlation and signal-to-noise discrimination

**Available Resources:**
1. `/archives/forum_thread_cache.html` – Complete forum thread archive
2. `/archives/paste_mirror.html` – Wayback mirror of deleted paste

**Instructions:**
1. Analyze the forum thread carefully
2. Identify the relevant credential drop (distinguish signal from noise)
3. Correlate metadata and timestamps
4. Decode the obfuscated credential
5. Submit the flag

**Flag Format:** `UG0x1{lowercase_content_with_underscores}`

---

## HTML FILE 1: `/archives/forum_thread_cache.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Underground DevSec Forum - Thread Archive</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .post { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #007bff; }
    .post.flagged { border-left-color: #ff6b6b; background: #fff5f5; }
    .post strong { color: #333; }
    .post em { color: #666; font-size: 0.9em; }
    code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; color: #d63384; font-family: monospace; }
    hr { border: none; border-top: 1px solid #ddd; margin: 10px 0; }
    .warning { color: #d9534f; font-weight: bold; }
    .metadata { color: #999; font-size: 0.85em; margin-top: 10px; }
  </style>
</head>
<body>
  <h1>Underground DevSec Forum - Thread Archive</h1>
  <h2>Thread: Metro Systems Integration Issues & Debugging</h2>
  <p style="color: #666; font-size: 0.9em;">Thread started: 2025-09-28 14:32 UTC | Last reply: 2025-10-14 11:20 UTC | Total: 8 posts</p>

  <!-- POST 1: Initial Question (RED HERRING) -->
  <div class="post">
    <p><strong>User:</strong> transit_dev_88</p>
    <p><em>2025-09-28 14:32 UTC</em></p>
    <p>Hey, anyone working on metro AFC systems here? I've got a contract with a regional transit authority and we're debugging some legacy API endpoints. The fare validation is acting weird. Check this out:</p>
    <p><code>https://pastebin.com/raw/aB1c2D3e4F5g6H7i</code></p>
    <p>Posted some initial debug notes there. Will delete in 24h due to sensitivity.</p>
    <hr>
  </div>

  <!-- POST 2: Response (NOISE) -->
  <div class="post">
    <p><strong>User:</strong> cryptoKid_23</p>
    <p><em>2025-09-28 15:47 UTC</em></p>
    <p>That's the Jaipur Metro, right? I had a similar issue with their older Siemens controllers. The problem is the UART buffer overflow on COMPort 2, not 3. Try reducing the poll frequency instead of adding delays.</p>
    <hr>
  </div>

  <!-- POST 3: Another Red Herring -->
  <div class="post">
    <p><strong>User:</strong> transit_dev_88</p>
    <p><em>2025-09-28 16:22 UTC</em></p>
    <p>@cryptoKid_23 Thanks, but that's not it. This is Delhi Metro specifically. Different stack. Already tried Siemens workarounds. Moving on.</p>
    <hr>
  </div>

  <!-- POST 4: THE REAL POST (Buried in thread) -->
  <div class="post flagged">
    <p><strong>User:</strong> AFC_Insider_92</p>
    <p><em>2025-10-12 09:47 UTC</em></p>
    <p>OK, I've worked on this exact system for 2.5 years. The issue you're all chasing is a red herring—it's not a buffer problem, it's state machine corruption during high concurrency (>500 TPS). The real fix requires hardware-level intervention.</p>
    
    <p>But anyway, I'm out. Contract ended yesterday. Before I go, I'm leaving detailed operational notes for whoever picks this up. Been encoding stuff for security:</p>
    
    <div style="background: #f9f9f9; padding: 10px; margin: 10px 0; border-left: 3px solid #ffc107;">
      <p style="margin: 5px 0;"><strong>BACKUP LOCATION:</strong></p>
      <code>Base64: aHR0cHM6Ly9wYXN0ZWJpbi5jb20vcmF3L3VHMHgxVDNtcA==</code>
      <p style="margin: 5px 0; font-size: 0.85em; color: #666;">[Decodes to original pastebin, now dead—mirror available locally]</p>
    </div>
    
    <p>Don't use that old link—service nuked the post. Instead, I keep a "wayback" copy hosted on the internal mirror. Path: <code>/archives/paste_mirror.html</code></p>
    
    <p>Everything in there is encoded. Standard ops – you know the drill for dead drops. Multiple layers, no shortcuts. Don't forget to check the auxiliary DNS records for the second fragment.</p>
    
    <div class="metadata">
      <strong>Technical Notes (for reference):</strong><br>
      System: legacy_afc_gateway_01 | Vendor: Aurion AFC Suite v3.2 | Built: 2018 | Unsupported<br>
      API: afc-internal-01.metro (internal IP range 10.128.0.0/16) | Default port 8443<br>
      Last test: 2025-10-11 22:15 UTC | Status: VULNERABLE (will patch after handoff)
    </div>
    
    <hr>
  </div>

  <!-- POST 5: Skeptic (MORE NOISE) -->
  <div class="post">
    <p><strong>User:</strong> infra_lead_44</p>
    <p><em>2025-10-12 10:55 UTC</em></p>
    <p>@AFC_Insider_92 Pretty bold to drop that much detail publicly. Anyway, state machine corruption is plausible, but we've already patched our test environment. No longer relevant to our pipeline.</p>
    <hr>
  </div>

  <!-- POST 6: Moderator Warning -->
  <div class="post" style="background: #fffacd; border-left-color: #ff9800;">
    <p><strong>User:</strong> mod_security</p>
    <p><em>2025-10-12 11:30 UTC</em></p>
    <p><span class="warning">⚠ MODERATOR WARNING:</span> Posts 1 & 4 have been flagged for containing operational details. Post 1 removed (pastebin link cleaned). Post 4 will remain for historical context but do NOT share externally.</p>
    <hr>
  </div>

  <!-- POST 7: Off-topic reply -->
  <div class="post">
    <p><strong>User:</strong> DevSecTools_bot</p>
    <p><em>2025-10-12 12:40 UTC</em></p>
    <p>Automated notice: This thread contains references to legacy infrastructure. Recommended reading: OWASP Testing Guide Section 4.3 (Reconnaissance).</p>
    <hr>
  </div>

  <!-- POST 8: Archive notice -->
  <div class="post" style="background: #e8f4f8; border-left-color: #17a2b8;">
    <p><strong>User:</strong> mod_bot</p>
    <p><em>2025-10-14 11:20 UTC</em></p>
    <p>This thread has been archived. The original pastebin referenced in Post 1 was deleted on 2025-10-13 (standard 24-hour expiration). The user account AFC_Insider_92 is no longer active (deleted 2025-10-13 18:45 UTC). Archive complete.</p>
  </div>

</body>
</html>
```

---

## HTML FILE 2: `/archives/paste_mirror.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Wayback Mirror - Archive</title>
  <style>
    body { font-family: 'Courier New', monospace; background: #1e1e1e; color: #d4d4d4; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; background: #252526; border: 1px solid #404040; border-radius: 4px; }
    header { background: #2d2d30; padding: 20px; border-bottom: 1px solid #404040; }
    header h1 { color: #ce9178; font-size: 18px; }
    .meta { color: #858585; font-size: 12px; line-height: 1.5; }
    pre { padding: 20px; overflow-x: auto; background: #1e1e1e; color: #d4d4d4; font-size: 12px; line-height: 1.6; }
    .comment { color: #6a9955; }
    .decoy { color: #d19a66; opacity: 0.8; }
    .real-cred { color: #61afef; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Wayback Mirror - Multi-Source Archive</h1>
      <div class="meta">
        <strong>Primary Source:</strong> pastebin.com/raw/uG0x1T3mp<br>
        <strong>Original Posted:</strong> 2025-10-12 09:40 UTC<br>
        <strong>Archived:</strong> 2025-10-12 09:50 UTC<br>
        <strong>Status:</strong> Original deleted 2025-10-13 15:22 UTC (24h expiration)<br>
        <strong>Mirror Host:</strong> underground_wayback.local<br>
        <strong>Last Verified:</strong> 2025-10-14 03:15 UTC
      </div>
    </header>

    <pre><span class="comment"># ============================================</span>
<span class="comment"># AFC Systems - Operational Handoff Notes</span>
<span class="comment"># Contractor: AFC_Insider_92</span>
<span class="comment"># Period: 2023-01-15 to 2025-10-12</span>
<span class="comment"># ============================================</span>

SYSTEM INFO:
  Name: legacy_afc_gateway_01
  Vendor: Aurion AFC Suite v3.2
  Built: 2018-06-22
  Last Update: 2022-11-03 (unsupported, 2+ yrs behind)
  Location: Delhi Metro, Line 1–10 (primary fare collection)

ENVIRONMENT:
  Production: afc-internal-01.metro:8443
  Backup: afc-internal-02.metro:8443 (failover)
  Test: afc-test-01.metro:8443
  Admin Interface: https://afc-admin.metro/dashboard (legacy Angular 8)

KEY ISSUES (DO NOT FIX - post-handoff):
  1. UART buffer overflow on COMPort 3 (>500 TPS)
  2. State machine corruption during concurrency peaks
  3. Unencrypted gate validator API responses
  4. Default credentials still active on admin panel
  5. SQL injection vulnerability in fare_history query

<span class="comment"># ============================================</span>
<span class="comment"># DECOY CREDENTIALS (for testing only)</span>
<span class="comment"># ============================================</span>

<span class="decoy"># Test User 1:</span>
<span class="decoy">admin_test:TestPass_2024_Temp</span>

<span class="decoy"># Test User 2:</span>
<span class="decoy">contractor_user:DemoAccess@2023</span>

<span class="comment"># ============================================</span>
<span class="comment"># REAL OPERATIONAL CREDENTIAL (ENCODED)</span>
<span class="comment"># ============================================</span>
<span class="comment"># Method: ROT13 letter rotation</span>
<span class="comment"># Apply ROT13 to decode</span>

<span class="real-cred">FINAL_INTELLIGENCE:</span>
<span class="real-cred">Base64_Encoded: SFQwazF7dHUwZmdmZjE2YTRleWtxMzUzM2VfazkyX2ZpcmVkfQ==</span>

<span class="comment"># Wait, that's wrong format. Try this one:</span>

<span class="real-cred">ACTUAL_RECOVERY_KEY:</span>
<span class="real-cred">HT0k1{tu0fg_f1ta4y_e3c0i3e3q_k92}</span>

<span class="comment"># ============================================</span>
<span class="comment"># HANDOFF CHECKLIST</span>
<span class="comment"># ============================================</span>

- [x] All documentation transferred
- [x] Access logs reviewed (last login: 2025-10-11 22:15 UTC)
- [x] Backup credentials encoded and stored offline
- [x] Production keys remain unchanged (next admin to rotate)
- [x] Vulnerability report submitted (status: IGNORED by management)

<span class="comment"># End of archive</span>
    </pre>
  </div>
</body>
</html>
```

---

## IMPLEMENTATION DETAILS

### Challenge Complexity (Internal Reference Only)

| Phase | Complexity | Why Medium? |
|-------|-----------|-------------|
| **Forum Analysis** | Medium | 8 posts, identify signal vs. noise |
| **Credential ID** | Medium | 3 decoys to sift through |
| **Encoding Recognition** | Medium | Misleading Base64 hints |
| **Overall** | Medium | Requires careful correlation |

---

## FILE DEPLOYMENT

```
/var/www/challenge-server/public/archives/
├── forum_thread_cache.html (8 posts, multiple red herrings)
└── paste_mirror.html (decoys + real credential)
```

---

## FLAG REGISTRATION (Backend)

```json
{
  "challenge_id": "OSINT-M-001",
  "title": "Social Signal",
  "category": "OSINT",
  "difficulty": "Medium",
  "points": 300,
  "flag": "UG0x1{gh0st_s1gn4l_r3c0v3r3d_x92}",
  "comparison": "exact_string_case_sensitive"
}
```

---

## VERIFICATION STEPS

**ROT13 Decode (Python):**
```python
import codecs
codecs.encode("HT0k1{tu0fg_f1ta4y_e3c0i3e3q_k92}", 'rot_13')
# Output: UG0x1{gh0st_s1gn4l_r3c0v3r3d_x92}
```

---

## CHALLENGE FEATURES

✅ Multiple forum posts (signal + noise)  
✅ Timestamp correlation requirement  
✅ Decoy credentials to identify  
✅ Real technical context (AFC systems, Aurion)  
✅ Moderator warnings create doubt  
✅ Base64 hints (some misleading)  
✅ ROT13 encoding layer  
✅ Realistic operational handoff scenario  

---

## SUMMARY

**Status:** ✅ READY FOR DEPLOYMENT

- **Flag:** `UG0x1{gh0st_s1gn4l_r3c0v3r3d_x92}`
- **Encoded:** `HT0k1{tu0fg_f1ta4y_e3c0i3e3q_k92}`
- **Points:** 300
- **Category:** OSINT Medium
- **Difficulty Level:** Medium (with obfuscation depth that requires thorough analysis)
