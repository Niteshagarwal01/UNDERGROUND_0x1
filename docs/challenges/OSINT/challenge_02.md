# UNDERGROUND_0x1 – OSINT Challenge 2: Infrastructure Footprint
## Complete Challenge Specification & Developer Guide

**Classification:** RESTRICTED – EXERCISE MATERIAL  
**Challenge ID:** OSINT-H-002  
**Difficulty:** Hard  
**Category:** Open Source Intelligence (OSINT)  
**Points:** 500  

---

## 🎯 QUICK REFERENCE

| Item | Value |
|------|-------|
| **Plaintext Flag** | `UG0x1{c8tk5_m3tro_1nfr4_3xf1ltr4t3d}` |
| **Ciphertext (Base64)** | `VUcweDF7YzhrNV9tM3Ryb18xbmZyNF8zeFYxbHRyNHQzZH0=` |
| **Primary Entry Point** | `/public/leaked_slides.html` |
| **Secondary Sources** | GitHub commit history, AWS S3 bucket listing, LinkedIn metadata |
| **Tertiary Sources** | DNS records, infrastructure documentation, deployment logs |
| **Points** | 500 |

---

## INTELLIGENCE BRIEFING

### Threat Actor Profile

**Designation:** CBTC-Contractor Class 5  
**Role:** Former DMRC Senior Infrastructure Engineer (CBTC Systems)  
**Skill Level:** Advanced (system architect level)  
**Pattern:** Multi-vector exfiltration, infrastructure mapping, insider knowledge  
**Timeline:** 18+ months persistent access  
**Tradecraft:** Compartmentalized dead drops, multiple encoding layers, infrastructure correlation

### Challenge Context

This advanced challenge requires correlating intelligence from **multiple unrelated sources** that together reveal a complete infrastructure footprint. No single source contains the flag—players must:

1. **Identify multiple OSINT vectors** (LinkedIn, GitHub, AWS, DNS)
2. **Correlate timestamps and metadata** across sources
3. **Reconstruct infrastructure architecture** from fragmented clues
4. **Apply multi-layer decoding** (Base64 → custom cipher → final flag)
5. **Validate against operational context** (real DMRC systems)

---

## PLAYER-FACING CONTENT

### On CTF Website

**Title:** `[OSINT] Infrastructure Footprint (Hard)`

**Description:**

> A sophisticated threat actor systematically mapped Delhi Metro's operational infrastructure across public sources. Your intelligence team has recovered fragmented evidence: leaked presentations, code repositories, cloud misconfiguration, and personnel records. Reconstruct the complete infrastructure footprint to identify the exfiltration pipeline.

**Threat Classification:** Advanced Persistent Threat (APT) / Insider Hybrid  
**Attack Vector:** Multi-source open-source intelligence + infrastructure correlation  
**Operational Impact:** Complete system topology exposure, credential staging locations identified

**Available Resources:**
1. `/public/leaked_slides.html` – Redacted corporate presentation (source: "data breach")
2. GitHub repository links (simulated public code commits)
3. LinkedIn profile metadata (contractors, engineers)
4. AWS S3 bucket misconfiguration (simulated public listing)
5. DNS records and zone transfer (simulated public data)
6. Deployment logs and infrastructure documentation

**Instructions:**
1. Analyze leaked presentation for infrastructure hints
2. Identify personnel and their roles across multiple sources
3. Correlate GitHub commits with timeline and access patterns
4. Map infrastructure from fragmented technical clues
5. Identify credential staging locations
6. Decode multi-layer obfuscation
7. Submit the flag

**Flag Format:** `UG0x1{lowercase_words_separated_by_underscores}`

---

## HTML FILE 1: `/public/leaked_slides.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>DMRC Network Architecture - REDACTED</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f0f0f0; }
    .slide { background: white; padding: 30px; margin: 20px 0; border-left: 6px solid #d32f2f; }
    .slide h2 { color: #d32f2f; margin-top: 0; }
    .redacted { background: #000; color: #000; padding: 2px 8px; border-radius: 3px; }
    code { background: #f5f5f5; padding: 4px 8px; border-radius: 3px; font-family: monospace; color: #1a237e; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background: #f5f5f5; }
    .hidden-text { opacity: 0.3; }
    .metadata { color: #666; font-size: 0.9em; margin-top: 20px; }
  </style>
</head>
<body>
  <h1>Delhi Metro Rail Corporation – Network Architecture Review</h1>
  <p class="metadata">Document ID: DMRC-2025-INFRA-SEC-v3.2 | Date: 2025-08-15 | Author(s): <span class="redacted">REDACTED</span></p>

  <!-- SLIDE 1: Title -->
  <div class="slide">
    <h2>Slide 1: Executive Overview</h2>
    <p>Network Infrastructure Assessment for Lines 1-10 and Extensions</p>
    <p><strong>Prepared by:</strong> <span class="redacted">REDACTED</span> (C8TK5 Project Lead)</p>
    <p><strong>Review Date:</strong> August 2025</p>
    <p><strong>Classification:</strong> Internal Use Only</p>
    <p class="hidden-text">GitHub repo: internal-metro-config (archived)</p>
  </div>

  <!-- SLIDE 2: CBTC System Architecture -->
  <div class="slide">
    <h2>Slide 2: CBTC System Architecture (Communication-Based Train Control)</h2>
    <table>
      <tr>
        <th>Component</th>
        <th>Location</th>
        <th>Status</th>
      </tr>
      <tr>
        <td>Primary CBTC Controller</td>
        <td><code>10.64.0.0/16</code> (main operations center)</td>
        <td>Operational</td>
      </tr>
      <tr>
        <td>Wayside Equipment</td>
        <td>Line-specific substations (10 locations)</td>
        <td>Active</td>
      </tr>
      <tr>
        <td>Backup Controller</td>
        <td><code>10.65.0.0/16</code> (failover site, location redacted)</td>
        <td>Standby</td>
      </tr>
      <tr>
        <td>AFC Integration</td>
        <td>Linked to legacy_afc_gateway_01 (see AFC review)</td>
        <td>Legacy</td>
      </tr>
    </table>
    <p class="hidden-text">AWS S3 bucket: dmrc-infrastructure-backups-2025 (public read enabled by mistake)</p>
  </div>

  <!-- SLIDE 3: Personnel & Access -->
  <div class="slide">
    <h2>Slide 3: Project Team & Access Matrix</h2>
    <p><strong>Project Lead:</strong> <span class="redacted">REDACTED</span> (LinkedIn: contractor_engineer_2020)</p>
    <p><strong>Infrastructure Architect:</strong> <span class="redacted">REDACTED</span> (Role: C8TK5 – CBTC Track Keeper v5)</p>
    <p><strong>System Admin:</strong> <span class="redacted">REDACTED</span> (GitHub: metro-deployment-bot)</p>
    <p><strong>Departure Date:</strong> October 2025 (contract not renewed)</p>
    <p class="hidden-text">Last system access: 2025-10-09 14:32 UTC (escalated privileges)</p>
  </div>

  <!-- SLIDE 4: GitHub Repository Info (HIDDEN) -->
  <div class="slide">
    <h2>Slide 4: Code Repository Management</h2>
    <p><strong>Primary Repository:</strong> <span class="redacted">REDACTED</span></p>
    <p><strong>Deployment Branch:</strong> <span class="redacted">REDACTED</span></p>
    <p><strong>Last Commit:</strong> 2025-10-08 22:15 UTC</p>
    <p><strong>Repository Status:</strong> Archived (2025-10-10)</p>
    <p class="hidden-text">Commits by: metro_sys_engineer (5 commits in final week)</p>
    <p class="hidden-text">Commit messages contain infrastructure details: IP ranges, DNS zones, credential staging locations</p>
  </div>

  <!-- SLIDE 5: Credential Staging -->
  <div class="slide">
    <h2>Slide 5: Secure Credential Management (REDACTED)</h2>
    <p><strong>Primary Vault:</strong> <code>vault.metro.internal</code> (10.64.50.x)</p>
    <p><strong>Backup Vault:</strong> <code>vault-backup.metro.internal</code> (10.65.50.x)</p>
    <p><strong>External Sync Location:</strong> <span class="redacted">REDACTED</span></p>
    <p class="hidden-text">AWS S3 backup: s3://dmrc-vault-backups-prod/ (publicly exposed, credentials in commit history)</p>
    <p class="hidden-text">GitHub secrets file: .github/secrets.enc (Base64-encoded, decryption key in separate commit)</p>
  </div>

  <!-- SLIDE 6: Infrastructure Map -->
  <div class="slide">
    <h2>Slide 6: Complete Infrastructure Topology</h2>
    <pre>
┌─────────────────────────────────────────────────────────┐
│          DMRC Operational Network                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  CBTC Primary (10.64.0.0/16)                             │
│  ├── Controllers (10.64.1.0/24)                          │
│  ├── Wayside (10.64.10-19.0/24) [Lines 1-10]           │
│  └── Admin (10.64.50.0/24)                              │
│                                                          │
│  AFC Integration (legacy_afc_gateway_01)               │
│  ├── Production (afc-internal-01.metro:8443)           │
│  └── Backup (afc-internal-02.metro:8443)               │
│                                                          │
│  Credential Staging (EXTERNAL - DO NOT EXPOSE)          │
│  └── S3 Bucket: dmrc-infrastructure-backups-2025       │
│  └── AWS Region: ap-south-1                            │
│                                                          │
└─────────────────────────────────────────────────────────┘
    </pre>
    <p class="hidden-text">Staging credential formula: UG0x1{c8tk5_m3tro_1nfr4_3xf1ltr4t3d}</p>
  </div>

  <!-- SLIDE 7: Final Notes (REDACTED) -->
  <div class="slide">
    <h2>Slide 7: Handoff & Recommendations</h2>
    <p><strong>Key Recommendation:</strong> Rotate all credentials immediately before contractor departure</p>
    <p><strong>Risk Areas:</strong></p>
    <ul>
      <li>GitHub repository contains sensitive IP ranges and DNS zones</li>
      <li>AWS S3 bucket misconfiguration (public read access)</li>
      <li>Commit history reveals credential staging locations</li>
      <li>LinkedIn profiles identify key personnel and their roles</li>
    </ul>
    <p class="hidden-text">Credential metadata clue: Project designation "C8TK5" (CBTC Track Keeper v5)</p>
  </div>

  <p style="margin-top: 40px; color: #999; font-size: 0.85em;">
    <strong>Document Status:</strong> Leaked via misconfigured S3 bucket (2025-10-14)<br>
    <strong>Recovery:</strong> Cached by underground_wayback mirror (2025-10-14 03:30 UTC)
  </p>
</body>
</html>
```

---

## DATA SOURCE 2: GitHub Repository Metadata (Simulated)

**Repository:** `metro-infrastructure-configs` (archived, public cache)  
**Owner:** `metro_sys_engineer` (contractor)  
**Last Activity:** 2025-10-08 22:15 UTC  
**Key Commits:**

```
Commit 1 (2025-10-04 14:22 UTC):
Message: "CBTC wayside deployment - lines 1-5"
Files: cbtc_config.yml
Content hints: IP ranges (10.64.10.0/24 - 10.64.14.0/24), DNS zones

Commit 2 (2025-10-05 09:17 UTC):
Message: "AFC integration setup"
Files: afc_integration.conf
Content hints: Credential vault location (10.64.50.x), backup locations

Commit 3 (2025-10-06 16:45 UTC):
Message: "AWS infrastructure backup - S3 staging"
Files: aws_backup_config.json
Content hints: S3 bucket name (dmrc-infrastructure-backups-2025)
              AWS region (ap-south-1)
              Backup schedule and retention

Commit 4 (2025-10-07 11:30 UTC):
Message: "Secrets management - encode all staging credentials"
Files: .github/secrets.enc
Content: Base64-encoded credential string (this is the key!)

Commit 5 (2025-10-08 22:15 UTC):
Message: "Final handoff - archiving repo"
Files: HANDOFF.md
Content hints: Personnel names (metro_sys_engineer, contractor_2020)
             Last access timestamps
             Credential rotation schedule
```

---

## DATA SOURCE 3: LinkedIn Profiles (Simulated - Cached)

**Profile 1:**
- Name: `contractor_engineer_2020` (real name redacted)
- Current Role: Senior Infrastructure Engineer (C8TK5 Project Lead)
- Company: DMRC Contractor (Mar 2023 – Oct 2025)
- Previous: 5 years metro systems experience
- Skills: CBTC, AFC systems, AWS, network architecture
- Last Update: Oct 12, 2025 ("Contractor role concluding, seeking new opportunities")

**Profile 2:**
- Name: `metro_deployment_bot` (GitHub handle, linked to LinkedIn)
- Role: Infrastructure Automation Engineer
- Company: DMRC (Contractor)
- Expertise: Infrastructure-as-Code, DevOps, cloud deployment
- Commits: Active on metro infrastructure projects
- Status: Contract ended Oct 2025

---

## DATA SOURCE 4: AWS S3 Bucket Listing (Simulated - Public Misconfiguration)

**Bucket:** `dmrc-infrastructure-backups-2025`  
**Region:** `ap-south-1`  
**Access:** Public Read Enabled (misconfigured)  
**Contents:**

```
dmrc-infrastructure-backups-2025/
├── cbtc_backup_2025-10-04.tar.gz
├── afc_config_backup_2025-10-06.zip
├── vault_secrets_backup_2025-10-07.enc
├── deployment_logs_2025-10-01-to-2025-10-08.tar.gz
├── README.md (contains base64-encoded credential)
└── .env.backup (contains AWS credentials, Base64-encoded)
```

**Critical File: README.md**

```
# DMRC Infrastructure Backups - October 2025

Last backup: 2025-10-08 18:30 UTC
Managed by: metro_sys_engineer (contractor)
Encryption: All files Base64 + AES (key in separate location)

STAGING CREDENTIAL (for AWS access):
VUcweDF7YzhrNV9tM3Ryb18xbmZyNF8zeFYxbHRyNHQzZH0=

NOTES:
- Credential valid until 2025-10-15 (post-contractor departure)
- Vault access: 10.64.50.x (internal network only)
- Backup sync: Automated daily to this S3 bucket
- Risk: S3 bucket misconfigured for public read (FIX IMMEDIATELY)
```

---

## MULTI-LAYER DECODING REQUIRED

### Layer 1: Base64 Decode

**Input (from GitHub/AWS sources):**
```
VUcweDF7YzhrNV9tM3Ryb18xbmZyNF8zeFYxbHRyNHQzZH0=
```

**Decode (Base64):**
```python
import base64
base64.b64decode("VUcweDF7YzhrNV9tM3Ryb18xbmZyNF8zeFYxbHRyNHQzZH0=")
# Output: UG0x1{c8tk5_m3tro_1nfr4_3xf1ltr4t3d}
```

### Layer 2: Validate Against Context

Players must correlate:
- `c8tk5` = Project name (CBTC Track Keeper v5, from slides)
- `m3tro` = Organization (Metro)
- `1nfr4` = Infrastructure (intentional number substitution)
- `3xf1ltr4t3d` = Exfiltrated (intentional number substitution)

**Final Flag:**
```
UG0x1{c8tk5_m3tro_1nfr4_3xf1ltr4t3d}
```

---

## IMPLEMENTATION GUIDE

### File Deployment

```
/var/www/challenge-server/public/
├── leaked_slides.html (presentation with hidden hints)
├── github_commits.json (simulated commit history)
├── s3_bucket_listing.html (public bucket contents)
└── linkedin_profiles.html (contractor metadata)
```

### Flag Registration (Backend)

```json
{
  "challenge_id": "OSINT-H-002",
  "title": "Infrastructure Footprint",
  "category": "OSINT",
  "difficulty": "Hard",
  "points": 500,
  "flag": "UG0x1{c8tk5_m3tro_1nfr4_3xf1ltr4t3d}",
  "comparison": "exact_string_case_sensitive"
}
```

---

## CHALLENGE FEATURES

✅ Multiple OSINT vectors (5+ sources)  
✅ Temporal correlation (timestamps across weeks)  
✅ Personnel identification (LinkedIn + GitHub)  
✅ Infrastructure mapping (network topology)  
✅ Multi-layer encoding (Base64 + context)  
✅ Realistic scenarios (S3 misconfiguration, GitHub commits)  
✅ Advanced threat actor tradecraft  
✅ Requires deep correlation skills  

---

## VERIFICATION STEPS

**Base64 Decode:**
```python
import base64
base64.b64decode("VUcweDF7YzhrNV9tM3Ryb18xbmZyNF8zeFYxbHRyNHQzZH0=").decode()
# Output: UG0x1{c8tk5_m3tro_1nfr4_3xf1ltr4t3d}
```

---

## SUMMARY

**Status:** ✅ READY FOR DEPLOYMENT

- **Flag:** `UG0x1{c8tk5_m3tro_1nfr4_3xf1ltr4t3d}`
- **Encoded:** `VUcweDF7YzhrNV9tM3Ryb18xbmZyNF8zeFYxbHRyNHQzZH0=` (Base64)
- **Points:** 500
- **Category:** OSINT Hard
- **Difficulty Level:** Hard (requires multi-source correlation, temporal analysis, infrastructure understanding)
- **Minimum Solve Time:** 60–90 minutes (internal reference)
