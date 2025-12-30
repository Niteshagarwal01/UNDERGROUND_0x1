# UNDERGROUND_0x1 CTF Platform

<div align="center">

![UNDERGROUND_0x1](https://img.shields.io/badge/UNDERGROUND-0x1-facc15?style=for-the-badge&labelColor=000000)
![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?style=flat-square&logo=prisma)

**A high-fidelity Delhi Metro operational compromise simulation.**

*Elite-level Capture The Flag competition. No hints. No shortcuts. Only skill.*

</div>

---

## 🎯 The Scenario

> Intelligence fragments from DMRC operational systems have been detected across multiple adversarial infrastructure nodes. Pattern analysis indicates a sophisticated, multi-vector data exfiltration operation. Your mission: reconstruct the compromise chain and recover the intelligence.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Authentication** | Clerk |
| **Database** | Neon PostgreSQL |
| **ORM** | Prisma 6.x |
| **Styling** | Custom CSS + Tailwind |
| **Validation** | Zod |
| **Deployment** | Vercel |

---

## 📁 Project Structure

```
underground-0x1/
├── prisma/
│   ├── schema.prisma          # Database schema (Users, Teams, Challenges, etc.)
│   └── seed-achievements.ts   # Achievement definitions
│
├── src/
│   ├── app/
│   │   ├── (pages)
│   │   │   ├── page.tsx           # Landing page
│   │   │   ├── challenges/        # Challenge browser
│   │   │   ├── dashboard/         # User dashboard
│   │   │   ├── leaderboard/       # Team rankings
│   │   │   ├── hall-of-fame/      # First bloods & achievements
│   │   │   ├── certificates/      # User certificates
│   │   │   ├── feedback/          # User feedback system
│   │   │   ├── profile/[username] # Public profiles
│   │   │   ├── team/[id]          # Team pages
│   │   │   ├── verify/[id]        # Certificate verification
│   │   │   ├── enter/             # Sign in/up page
│   │   │   └── onboarding/        # New user onboarding
│   │   │
│   │   ├── admin/                 # Admin panel
│   │   │   ├── page.tsx           # Command center dashboard
│   │   │   ├── challenges/        # Challenge management (CRUD)
│   │   │   ├── users/             # User management
│   │   │   ├── submissions/       # Flag submission logs
│   │   │   ├── feedback/          # User feedback management
│   │   │   ├── announcements/     # Platform announcements
│   │   │   ├── certificates/      # Certificate management
│   │   │   ├── audit-log/         # Activity audit trail
│   │   │   ├── settings/          # Platform settings
│   │   │   ├── import/            # Bulk challenge import
│   │   │   └── export/            # Data export
│   │   │
│   │   └── api/                   # API Routes
│   │       ├── user/              # User data
│   │       ├── teams/             # Team operations (create, join, leave)
│   │       ├── challenges/        # Challenge listing & writeups
│   │       ├── submit/            # Flag submission
│   │       ├── leaderboard/       # Rankings
│   │       ├── achievements/      # User achievements
│   │       ├── notifications/     # User notifications
│   │       ├── certificates/      # Certificate generation
│   │       ├── feedback/          # Feedback submission
│   │       ├── hall-of-fame/      # First bloods data
│   │       └── admin/             # Admin-only endpoints
│   │
│   ├── components/
│   │   ├── Navbar.tsx             # Main navigation
│   │   ├── MobileNavbar.tsx       # Mobile navigation
│   │   ├── Footer.tsx             # Site footer
│   │   ├── NotificationBell.tsx   # Real-time notifications
│   │   ├── AnnouncementBanner.tsx # Platform announcements
│   │   ├── WriteupModal.tsx       # Challenge writeup editor
│   │   ├── ActivityFeed.tsx       # Live activity stream
│   │   ├── AchievementsDisplay.tsx # Achievement badges
│   │   ├── FirstBloodCelebration.tsx # First blood animation
│   │   ├── ShareStatsModal.tsx    # Stats sharing card
│   │   ├── Skeleton.tsx           # Loading states
│   │   └── admin/                 # Admin components
│   │
│   ├── lib/
│   │   ├── prisma.ts              # Prisma client singleton
│   │   └── utils.ts               # Utility functions
│   │
│   └── middleware.ts              # Auth & security middleware
│
├── public/
│   ├── metro-map.svg              # Delhi Metro map background
│   ├── archives/                  # Challenge static files
│   └── [other assets]
│
├── challenges/                    # Challenge source files
│   ├── osint/
│   ├── forensics/
│   ├── crypto/
│   └── ...
│
├── docs/                          # Documentation
└── scripts/                       # Utility scripts
```

---

## 🏆 Features

### For Players
- **Team System** - Create or join teams of 1-4 members
- **6 Challenge Categories** - OSINT, Forensics, Crypto, Reversing, Web, Steganography
- **First Blood Bonuses** - Extra points for first solves
- **Achievement System** - Unlock badges for milestones
- **Writeups** - Post-solve writeup submissions
- **Certificates** - Downloadable participation & achievement certificates
- **Public Profiles** - Showcase your stats
- **Real-time Notifications** - Instant updates on solves and achievements

### For Admins
- **Challenge Management** - Full CRUD with difficulty levels
- **User Management** - Role assignment (Admin/Moderator/User)
- **Submission Monitoring** - Live flag submission logs
- **Analytics Dashboard** - Platform statistics
- **Announcement System** - Platform-wide notifications
- **Audit Logging** - Track all admin actions
- **Bulk Import/Export** - JSON challenge import/export

---

## 🎮 Challenge Categories

| Category | Codename | Description |
|----------|----------|-------------|
| **OSINT** | Ghost Corridors | Open source intelligence gathering |
| **Forensics** | Signal Black | Memory dumps, disk images, network captures |
| **Cryptography** | Fare Matrix | Ciphers, RSA, AES, custom encryption |
| **Reverse Engineering** | Token Forge | Binary analysis, malware, executables |
| **Web Security** | OCC Portal | XSS, SQLi, authentication flaws |
| **Steganography** | Hidden Layers | Secrets in images, audio, video |

---

## 🛠️ Setup

### Prerequisites
- Node.js 18+
- PostgreSQL (or Neon account)
- Clerk account

### 1. Clone & Install

```bash
git clone https://github.com/your-repo/underground-0x1.git
cd underground-0x1
npm install
```

### 2. Environment Variables

Copy `env.template` to `.env`:

```bash
cp env.template .env
```

Required variables:
```env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Seed achievements
npx tsx prisma/seed-achievements.ts

# (Optional) Open Prisma Studio
npx prisma studio
```

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 🔐 Security Features

- **Authentication** - Clerk with secure session handling
- **Role-based Access** - Admin, Moderator, User roles
- **Rate Limiting** - Middleware-based request throttling
- **Input Validation** - Zod schemas on all inputs
- **Security Headers** - CSP, HSTS, X-Frame-Options, etc.
- **Flag Hashing** - bcrypt for secure flag storage
- **SQL Injection Prevention** - Prisma ORM
- **Blocked Patterns** - Automatic blocking of known attack tools

---

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

The `build` command automatically runs `prisma generate` before building.

---

## 📜 Flag Format

All flags follow the format:
```
UG0x1{...}
```

---

## ⚠️ Disclaimer

> This is an **independent cybersecurity education competition**. It is NOT affiliated with Delhi Metro Rail Corporation (DMRC). All scenarios are purely fictional and designed for educational purposes only.

---

## 📝 License

MIT License - For educational purposes only.

---

<div align="center">

**Built with ⚡ by the UNDERGROUND_0x1 Team**

</div>
