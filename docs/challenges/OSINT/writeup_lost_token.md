# Lost Token - Official Writeup

**Category:** OSINT  
**Difficulty:** Medium  
**Points:** 300  
**Flag:** `UG0x1{m3tr0_gh0st_7734_rjch}`

---

## Overview

This challenge follows the trail of a former DMRC contractor who left behind digital breadcrumbs before disappearing. Players must use OSINT techniques to follow the investigation chain.

---

## Solution

### Step 1: Analyze the Token Image

Download the token image and extract its EXIF metadata:

```bash
exiftool recovered_token.png
```

**Key findings in metadata:**
- **GPS Coordinates:** 28.6328°N, 77.2197°E → Rajiv Chowk Station (RJCH)
- **Camera Model:** DMRC-AFC-UNIT-M7
- **User Comment:** `PROTOCOL-7734 | DEV:avinash.mehta | REF:https://underground-0x1.vercel.app/archives/avinash_portfolio.html | STATUS:OFFLINE`

This reveals:
- Protocol ID: **7734**
- Developer name: **avinash.mehta**
- Portfolio URL

---

### Step 2: Visit the Developer Portfolio

Navigate to the portfolio URL found in EXIF metadata.

On the portfolio page, find the **Blog** section with a link to an archived blog post titled "The Ghost Protocol: A Token Story".

---

### Step 3: Read the Archived Blog

The blog post contains a code block with the ghost protocol sync log:

```
[GHOST_PROTOCOL_v7734]
INIT: M3TR0
ROUTE: RJCH
CHECKSUM: gh0st
VERIFY: /archives/ghost_verify.txt
```

This points to the verification file.

**⚠️ Trap Alert:** The blog also has "Related Resources" with decoy links:
- Pastebin (expired - dead end)
- Backup verification (contains fake flag)
- Vikram Singh profile (wrong person)

**⚠️ HTML Comment Trap:** `<!-- TEST_FLAG: UG0x1{test_flag_do_not_submit} -->`

---

### Step 4: Decode the Verification Chain

Open `/archives/ghost_verify.txt`:

```
Part 1: VUcweDE=
Part 2: e20zdHIwXw==
Part 3: Z2gwc3Rf
Part 4: [CORRUPTED] - Use Employee Protocol ID
Part 5: [CORRUPTED] - Use Station Code (lowercase)
```

Decode the Base64 parts:

```bash
echo "VUcweDE=" | base64 -d      # UG0x1
echo "e20zdHIwXw==" | base64 -d  # m3tr0_  (note: the { is separate)
echo "Z2gwc3Rf" | base64 -d      # gh0st_
```

**Assemble the flag:**
- Part 1: `UG0x1`
- Opening brace: `{`
- Part 2: `m3tr0_`
- Part 3: `gh0st_`
- Protocol ID: `7734`
- Separator: `_`
- Station Code: `rjch`
- Closing brace: `}`

---

## Flag

```
UG0x1{m3tr0_gh0st_7734_rjch}
```

---

## Key Skills Tested

1. **EXIF Analysis** - Extracting hidden metadata from images
2. **GPS Coordinate Lookup** - Identifying real-world locations
3. **Web Investigation** - Following links and reading between the lines
4. **Base64 Decoding** - Standard encoding recognition
5. **Pattern Recognition** - Connecting clues across multiple sources
6. **Avoiding Red Herrings** - Recognizing and ignoring decoys

---

## Tools Used

- `exiftool` - EXIF metadata extraction
- Base64 decoder (online or `base64 -d`)
- Google Maps (for GPS coordinates)
- Web browser

---

*Challenge designed for UNDERGROUND 0x1 CTF*
