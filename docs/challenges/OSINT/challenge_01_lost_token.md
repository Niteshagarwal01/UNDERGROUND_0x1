# OSINT Challenge 1: Lost Token (Elite Redesign)
## Complete Challenge Specification

---

## Overview

| Field | Value |
|-------|-------|
| **Title** | Lost Token |
| **Category** | OSINT |
| **Difficulty** | MEDIUM (Elite Design) |
| **Points** | 300 |
| **Flag** | `UG0x1{m3tr0_gh0st_7734_rjch}` |
| **Estimated Solve Time** | 30-60 minutes |

---

## Storyline

A Delhi Metro AFC (Automatic Fare Collection) contractor disappeared after a security incident. A metro token found near Rajiv Chowk station contains unusual metadata. Intelligence suggests the contractor was running a side operation called **"Ghost Protocol"** and left digital breadcrumbs before going dark. Your mission: follow the trail and recover the exfiltrated credential.

---

## Solve Path (4 Stages)

### Stage 1: Token Image Analysis
**File:** `recovered_token.jpg` (Google Drive)

**EXIF Data to embed:**
```
GPS Latitude: 28.6328 N
GPS Longitude: 77.2197 E
Camera Model: DMRC-AFC-UNIT-M7
UserComment: PROTOCOL-7734 | DEV:avinash.mehta | STATUS:OFFLINE
```

**What player learns:**
- GPS = Rajiv Chowk station (28.6328°N, 77.2197°E)
- Employee protocol/ID: `7734`
- Developer name: `avinash.mehta`
- Status indicates something is off ("OFFLINE")

**Player's next step:** Search for "avinash mehta" or "avinash.mehta developer"

---

### Stage 2: Developer Portfolio Discovery
**File:** `avinash_portfolio.html` (Linktree or /archives/)

A fake developer portfolio page showing:
- Name: Avinash Mehta
- Title: "Systems Developer | Transit Systems Specialist"
- About: "Previously worked on AFC systems for major transit operators"
- Projects: Lists "Delhi Transit Token Validator" work
- Blog: Shows "1 Archived Post" → links to Stage 3

**Hidden detail:** The page footer contains `<!-- emp:7734 | ghost-protocol -->` in HTML comments

**Player's next step:** Click on the archived blog post link

---

### Stage 3: The Archived Blog Post
**File:** `blog_archive_2024.html` (styled like Wayback Machine)

Title: **"The Ghost Protocol: A Token Story"**
Date: October 12, 2024 (archived)

The post contains:
- Story about leaving a company after discovering security flaws
- Mentions "final backup secured using standard metro encoding"
- Contains a "debug log" code block:

```
[GHOST_PROTOCOL_v7734]
INIT: M3TR0
ROUTE: RJCH
CHECKSUM: gh0st
VERIFY: /archives/ghost_verify.txt
```

**What player learns:**
- The protocol version matches the employee ID (7734)
- There's a verification file to find
- Key terms: M3TR0, RJCH, gh0st

**Player's next step:** Navigate to `/archives/ghost_verify.txt`

---

### Stage 4: Flag Assembly
**File:** `ghost_verify.txt`

```
═══════════════════════════════════════════
     GHOST PROTOCOL VERIFICATION v7734
═══════════════════════════════════════════

Protocol Status: BURNED
Archive Status: PARTIAL CORRUPTION DETECTED

VERIFICATION CHAIN:
-------------------
Part1: VUcweDE=
Part2: e20zdHIwXw==
Part3: Z2gwc3Rf
Part4: [CORRUPTED - Use Protocol ID]
Part5: [CORRUPTED - Use Station Code]

ASSEMBLY: Part1 + { + decode(Part2) + decode(Part3) + Part4 + _ + lowercase(Part5) + }

Timestamp: 2024-10-12 09:47:23 UTC
This file will be purged automatically.

═══════════════════════════════════════════
```

**What player must do:**
1. Decode Part1: `VUcweDE=` → `UG0x1`
2. Decode Part2: `e20zdHIwXw==` → `m3tr0_` (note: includes underscore)
3. Decode Part3: `Z2gwc3Rf` → `gh0st_`
4. Part4 = Protocol ID = `7734` (from EXIF)
5. Part5 = Station Code = `rjch` (lowercase of RJCH from GPS)

**Assembly:** `UG0x1` + `{` + `m3tr0_` + `gh0st_` + `7734` + `_` + `rjch` + `}`

**Flag:** `UG0x1{m3tr0_gh0st_7734_rjch}`

---

## Red Herrings (Decoys)

### Decoy 1: Wrong Developer
**File:** `decoys/vikram_singh_profile.html`

A fake Twitter/X profile for "Vikram Singh" (@vikram_s_92) who tweets about Delhi Metro. Has a warning message at the bottom: "This is NOT the contractor you're looking for."

**How players find it:** If they search for "DMRC developer" or follow the wrong lead from the maintenance doc.

### Decoy 2: Pastebin 404
**File:** `decoys/pastebin_404.html`

A fake 404 page showing an expired paste. Contains a fake timestamp and request ID that look interesting but lead nowhere.

### Decoy 3: Wrong Flag in Comments
In `blog_archive_2024.html`, add an HTML comment:
```html
<!-- TEST_FLAG: UG0x1{test_flag_do_not_submit} -->
```
Players who search for "UG0x1" in source will find this and waste a submission.

### Decoy 4: Fake Verification
**File:** `decoys/verify_backup.txt`

Contains a fake "backup" with wrong flag:
```
BACKUP VERIFICATION - TEST ENVIRONMENT
Flag: UG0x1{backup_test_12345}
DO NOT USE IN PRODUCTION
```

---

## File Structure

```
/archives/
├── avinash_portfolio.html     (Stage 2)
├── blog_archive_2024.html     (Stage 3)
├── ghost_verify.txt           (Stage 4)
├── dmrc_afc_maintenance_q4.html (old - can keep as extra trail)
├── github_gist_mirror.html    (old - can remove or repurpose)
└── decoys/
    ├── vikram_singh_profile.html
    ├── pastebin_404.html
    └── verify_backup.txt

Google Drive:
└── recovered_token.jpg        (Stage 1)
```

---

## Challenge Description (For Admin Panel)

```
A Delhi Metro token was recovered near Rajiv Chowk interchange. Preliminary forensic analysis of the token's RFID chip revealed unusual metadata - this wasn't a standard passenger token.

Intelligence suggests it belonged to an AFC contractor who went dark after a security incident. Sources indicate he was running something called "Ghost Protocol" and left digital breadcrumbs before disappearing.

Your mission: Follow the trail. Find the ghost. Recover the credential.

Target: Unknown Contractor
Last Known Location: Rajiv Chowk Station
Protocol Status: OFFLINE
```

---

## Verification Checklist

- [ ] Token image has correct EXIF (GPS, Model, UserComment)
- [ ] Portfolio page links to archived blog
- [ ] Blog post contains debug log with correct values
- [ ] ghost_verify.txt has correct Base64 encoded parts
- [ ] Base64 decodes correctly:
  - `VUcweDE=` → `UG0x1`
  - `e20zdHIwXw==` → `m3tr0_`
  - `Z2gwc3Rf` → `gh0st_`
- [ ] Final flag assembly works: `UG0x1{m3tr0_gh0st_7734_rjch}`
- [ ] Decoys are in place

---

## Why This Design is Elite

1. **Multiple OSINT techniques:** EXIF, people search, archive diving, encoding
2. **Realistic investigation:** Players must connect dots, not follow obvious links
3. **Flag requires assembly:** Can't just find it - must understand the protocol
4. **Meaningful decoys:** Waste time but don't feel unfair
5. **Cohesive narrative:** Ghost Protocol story ties everything together
6. **Delhi Metro integration:** Uses real station codes and GPS coordinates
