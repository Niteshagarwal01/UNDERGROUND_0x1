# UNDERGROUND_0x1 CTF Platform

A high-fidelity Delhi Metro operational compromise simulation. Elite-level Capture The Flag competition.

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Authentication**: Clerk
- **Database**: Neon PostgreSQL
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **Validation**: Zod

## 📁 Project Structure

```
underground-0x1/
├── prisma/
│   └── schema.prisma       # Database schema
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── challenges/ # Challenge list API
│   │   │   └── submit/     # Flag submission API
│   │   ├── challenges/     # Challenges page
│   │   ├── dashboard/      # User dashboard
│   │   ├── leaderboard/    # Leaderboard page
│   │   ├── sign-in/        # Clerk sign-in
│   │   ├── sign-up/        # Clerk sign-up
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Landing page
│   ├── components/         # Reusable components
│   ├── lib/
│   │   └── prisma.ts       # Prisma client
│   └── middleware.ts       # Auth middleware
├── env.template            # Environment template
├── next.config.ts          # Next.js config with security
└── package.json
```

## 🛠️ Setup

### 1. Environment Variables

Copy `env.template` to `.env` and fill in your values:

```bash
cp env.template .env
```

Required variables:
- `DATABASE_URL`: Your Neon PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: From Clerk dashboard
- `CLERK_SECRET_KEY`: From Clerk dashboard

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Open Prisma Studio
npx prisma studio
```

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🔐 Security Features

- **Authentication**: Clerk with secure session handling
- **Rate Limiting**: 5 flag submissions per minute per user
- **Input Validation**: Zod schemas on all inputs
- **CSRF Protection**: Next.js built-in
- **Security Headers**: HSTS, CSP, X-Frame-Options, etc.
- **Flag Hashing**: bcrypt for flag storage
- **SQL Injection Prevention**: Prisma ORM

## 📊 Adding Challenges

1. Add challenge to database via Prisma Studio or API
2. Generate flag hash:
   ```javascript
   const bcrypt = require('bcryptjs');
   const hash = bcrypt.hashSync('UG0x1{your_flag}', 12);
   console.log(hash);
   ```
3. Store hash in `flagHash` field
4. Upload challenge files to storage

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Other Platforms

Build command: `npm run build`
Start command: `npm start`

## 📝 License

MIT License - For educational purposes only.

## ⚠️ Disclaimer

This is an independent cybersecurity education competition. It is NOT affiliated with Delhi Metro Rail Corporation (DMRC). All scenarios are fictional.
