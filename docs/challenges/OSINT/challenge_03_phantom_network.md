# OSINT Challenge 3: The Phantom Network
## Difficulty: GOD LEVEL (800 pts)

---

## Flag
`UG0x1{ph4nt0m_n3tw0rk_g0d_lvl}`

---

## Challenge Description

```
Phantom Network.

We found a photography account. Username: phantom_shooter.
Something is hidden. Find it.

No hints. Figure it out.
```

---

## TRUE GOD LEVEL DESIGN

**Images do NOT contain flag parts directly.**
**Images contain HINTS to find external websites.**
**Flag parts are scattered across 5 fake websites.**

---

## Solve Path (Nightmare Mode)

### Stage 1: Find the Gallery
Start at phantom-gallery.html (Flickr-style page)

### Stage 2: Download & Analyze Images
Players must realize to check EXIF metadata (NO HINTS given!)

| Image | EXIF Hint |
|-------|-----------|
| platform_vaishali.png | Artist: "ph4nt0m_sh00ter", Copyright: "@phantom_network on X" |
| nehru_enclave.jpg | UserComment: "check my gist: 7a3b9f2e" |
| interior_train.png | UserComment: "discord.gg/phantom2024" |
| tvm_machine.png | UserComment: "pastebin.com/ghost_key" |
| metro_pillars.png | UserComment: "final piece at /archives/terminus.html" |

### Stage 3: Follow the Trail

**Twitter (@phantom_network)** → phantom-twitter.html
- Has hex code: `706834` → "ph4"

**Gist (7a3b9f2e)** → gist-phantom.html  
- Has hex code: `6e74306d5f` → "nt0m_"

**Discord (#phantom-channel)** → discord-phantom.html
- Has hex code: `6e3374773072` → "n3tw0r"

**Pastebin (ghost_key)** → pastebin-ghost.html
- Has hex code: `6b5f673064` → "k_g0d"

**Terminus** → terminus.html
- Has hex code: `5f6c766c` → "_lvl"

### Stage 4: Decode & Assemble
```
Hex → ASCII:
706834 → ph4
6e74306d5f → nt0m_
6e3374773072 → n3tw0r
6b5f673064 → k_g0d
5f6c766c → _lvl

Combined: ph4nt0m_n3tw0rk_g0d_lvl
Flag: UG0x1{ph4nt0m_n3tw0rk_g0d_lvl}
```

---

## Files

| File | Type | Contains |
|------|------|----------|
| phantom-gallery.html | Flickr-style gallery | Starting point |
| phantom/platform_vaishali.png | Image | EXIF: Username hints |
| phantom/nehru_enclave.jpg | Image | EXIF: Gist reference |
| phantom/interior_train.png | Image | EXIF: Discord hint |
| phantom/tvm_machine.png | Image | EXIF: Pastebin hint |
| phantom/metro_pillars.png | Image | EXIF: Terminus path |
| phantom-twitter.html | Fake X/Twitter | Part 1: 706834 |
| gist-phantom.html | Fake GitHub Gist | Part 2: 6e74306d5f |
| discord-phantom.html | Fake Discord | Part 3: 6e3374773072 |
| pastebin-ghost.html | Fake Pastebin | Part 4: 6b5f673064 |
| terminus.html | Final page | Part 5: 5f6c766c |

---

## Why This is GOD LEVEL:

1. **No direct hints** - Gallery looks like normal photo site
2. **Must realize EXIF** - No one tells them to check metadata
3. **Trail across 5+ sites** - Twitter → Gist → Discord → Pastebin → Terminus
4. **Hex encoding** - Must recognize and decode
5. **Order matters** - Wrong order = wrong flag
6. **Multiple skill sets** - Image analysis, OSINT, encoding

---

## Admin Panel Data

| Field | Value |
|-------|-------|
| Title | The Phantom Network |
| Slug | phantom-network |
| Category | OSINT |
| Difficulty | GOD |
| Points | 800 |
| Flag | `UG0x1{ph4nt0m_n3tw0rk_g0d_lvl}` |
| Download Link | `https://underground-0x1.vercel.app/archives/phantom-gallery.html` |
