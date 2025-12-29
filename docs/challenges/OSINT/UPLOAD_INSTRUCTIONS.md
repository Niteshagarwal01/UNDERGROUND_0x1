# OSINT Challenge 1: Lost Token - FINAL SETUP
## Domain: https://underground-0x1.vercel.app/

---

## 🔗 YOUR CHALLENGE URLS

| File | Live URL |
|------|----------|
| Token Image | `https://underground-0x1.vercel.app/archives/recovered_token.png` |
| Portfolio | `https://underground-0x1.vercel.app/archives/avinash_portfolio.html` |
| Blog Archive | `https://underground-0x1.vercel.app/archives/blog_archive_2024.html` |
| Verify File | `https://underground-0x1.vercel.app/archives/ghost_verify.txt` |

---

## ⚡ STEP 1: Add EXIF Metadata to Image

Run this command on your local machine (install exiftool first if needed):

### Windows (PowerShell):
```powershell
cd "c:\Users\offic\Downloads\DMRC\UNDERGROUND_0x1_Platform\underground-0x1\public\archives"

exiftool -overwrite_original `
  -GPSLatitude="28.6328" `
  -GPSLatitudeRef="N" `
  -GPSLongitude="77.2197" `
  -GPSLongitudeRef="E" `
  -Model="DMRC-AFC-UNIT-M7" `
  -UserComment="PROTOCOL-7734 | DEV:avinash.mehta | REF:https://underground-0x1.vercel.app/archives/avinash_portfolio.html | STATUS:OFFLINE" `
  recovered_token.png
```

### Or Single Line (easier to copy):
```
exiftool -overwrite_original -GPSLatitude="28.6328" -GPSLatitudeRef="N" -GPSLongitude="77.2197" -GPSLongitudeRef="E" -Model="DMRC-AFC-UNIT-M7" -UserComment="PROTOCOL-7734 | DEV:avinash.mehta | REF:https://underground-0x1.vercel.app/archives/avinash_portfolio.html | STATUS:OFFLINE" recovered_token.png
```

### Install ExifTool (if not installed):
- **Windows**: Download from https://exiftool.org/ → rename `exiftool(-k).exe` to `exiftool.exe`
- **Mac**: `brew install exiftool`
- **Linux**: `sudo apt install libimage-exiftool-perl`

---

## ⚡ STEP 2: Verify EXIF Was Added

```bash
exiftool recovered_token.png
```

You should see:
- GPS Latitude: 28.6328 N
- GPS Longitude: 77.2197 E
- Camera Model: DMRC-AFC-UNIT-M7
- User Comment: PROTOCOL-7734 | DEV:avinash.mehta | REF:https://underground-0x1.vercel.app/archives/avinash_portfolio.html | STATUS:OFFLINE

---

## ⚡ STEP 3: Redeploy to Vercel

After adding EXIF, push to Git and Vercel will auto-deploy:
```bash
git add public/archives/recovered_token.png
git commit -m "Add EXIF metadata to challenge token"
git push
```

---

## ⚡ STEP 4: Add Challenge in Admin Panel

Go to: https://underground-0x1.vercel.app/admin/challenges

| Field | Value |
|-------|-------|
| **Title** | Lost Token |
| **Slug** | lost-token |
| **Category** | OSINT |
| **Difficulty** | MEDIUM |
| **Points** | 300 |
| **Flag** | `UG0x1{m3tr0_gh0st_7734_rjch}` |
| **Google Drive Link** | `https://underground-0x1.vercel.app/archives/recovered_token.png` |
| **Linktree Link** | *Leave empty* |

### Description:
```
A Delhi Metro token was recovered near Rajiv Chowk interchange. Preliminary forensic analysis of the token's RFID chip revealed unusual metadata - this wasn't a standard passenger token.

Intelligence suggests it belonged to an AFC contractor who went dark after a security incident. Sources indicate he was running something called "Ghost Protocol" and left digital breadcrumbs before disappearing.

Your mission: Follow the trail. Find the ghost. Recover the credential.

Target: Unknown Contractor
Last Known Location: Rajiv Chowk Station
Protocol Status: OFFLINE
```

---

## 🎯 SOLVE PATH SUMMARY

1. **Player downloads**: `https://underground-0x1.vercel.app/archives/recovered_token.png`
2. **Runs exiftool** → Finds portfolio URL in UserComment
3. **Visits portfolio** → Clicks "View Archive" for blog
4. **Reads blog** → Finds `/archives/ghost_verify.txt`
5. **Decodes parts** → Assembles flag

**Flag:** `UG0x1{m3tr0_gh0st_7734_rjch}`

---

## ✅ CHECKLIST

- [ ] Install exiftool on your machine
- [ ] Run the EXIF command above
- [ ] Verify EXIF with `exiftool recovered_token.png`
- [ ] Git commit and push
- [ ] Wait for Vercel to deploy
- [ ] Add challenge in admin panel
- [ ] Test the solve path yourself!
