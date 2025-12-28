import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import {
  Shield,
  Search,
  FileSearch,
  Lock,
  Cpu,
  Globe,
  Trophy,
  Target,
  Clock,
  ChevronRight,
  Train,
  Zap,
  Users
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import { prisma } from "@/lib/prisma";

// Category icon and subtitle mapping
const categoryConfig: Record<string, { icon: any; subtitle: string }> = {
  osint: { icon: Search, subtitle: "Ghost Corridors" },
  forensics: { icon: FileSearch, subtitle: "Signal Black" },
  crypto: { icon: Lock, subtitle: "Fare Matrix" },
  reversing: { icon: Cpu, subtitle: "Token Forge" },
  web: { icon: Globe, subtitle: "OCC Portal" },
};

async function getHomeStats() {
  try {
    // Get all categories with their challenges
    const categories = await prisma.category.findMany({
      orderBy: { order: "asc" },
      include: {
        challenges: {
          where: { isActive: true, isHidden: false },
          select: { points: true }
        }
      }
    });

    const transformedCategories = categories.map((cat) => {
      const config = categoryConfig[cat.slug] || { icon: Target, subtitle: "" };
      const totalPoints = cat.challenges.reduce((sum, c) => sum + c.points, 0);
      return {
        id: cat.slug,
        name: cat.name,
        subtitle: config.subtitle,
        icon: config.icon,
        challenges: cat.challenges.length,
        points: totalPoints,
        description: cat.description || ""
      };
    });

    const totalChallenges = transformedCategories.reduce((sum, c) => sum + c.challenges, 0);
    const totalPoints = transformedCategories.reduce((sum, c) => sum + c.points, 0);
    const totalCategories = transformedCategories.length;

    return {
      categories: transformedCategories,
      stats: {
        challenges: totalChallenges,
        categories: totalCategories,
        points: totalPoints
      }
    };
  } catch (error) {
    console.error("Error fetching home stats:", error);
    return {
      categories: [],
      stats: { challenges: 0, categories: 0, points: 0 }
    };
  }
}

export default async function HomePage() {
  const { categories, stats } = await getHomeStats();

  const heroStats = [
    { label: "Challenges", value: stats.challenges.toString(), icon: Target },
    { label: "Categories", value: stats.categories.toString(), icon: Shield },
    { label: "Total Points", value: stats.points.toLocaleString(), icon: Trophy },
    { label: "Time Limit", value: "∞", icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <AnnouncementBanner />

      {/* ============ HERO SECTION WITH METRO MAP ============ */}
      <section className="hero">
        {/* Yellow glow orbs in background */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(250, 204, 21, 0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
            filter: 'blur(60px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '30%',
            right: '15%',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(250, 204, 21, 0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
            filter: 'blur(40px)',
          }}
        />

        {/* Metro Map Background - Decreased transparency (more subtle) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url(/metro-map.svg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.12,
            pointerEvents: 'none',
          }}
        />

        {/* Vignette overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0.9) 100%)',
            pointerEvents: 'none',
          }}
        />

        <div className="hero-content" style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-badge">
            <Train size={16} className="text-yellow" />
            <span className="hero-badge-text">Capture The Flag</span>
          </div>

          <h1 className="hero-title">
            <span className="text-gradient">UNDERGROUND</span>
            <span style={{ color: 'white' }}>_0x1</span>
          </h1>

          <p className="hero-description">
            A high-fidelity Delhi Metro operational compromise simulation.
            Elite-level challenges designed for national cybersecurity competition.
            No hints. No shortcuts. Only skill.
          </p>

          <div className="hero-buttons">
            <SignedOut>
              <Link href="/enter" className="btn btn-primary btn-lg">
                <Zap size={18} />
                Start Hacking
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/challenges" className="btn btn-primary btn-lg">
                <Target size={18} />
                View Challenges
              </Link>
            </SignedIn>
            <Link href="/leaderboard" className="btn btn-secondary btn-lg">
              <Trophy size={18} />
              Leaderboard
            </Link>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            {heroStats.map((stat) => (
              <div key={stat.label} className="stat-card">
                <stat.icon size={24} className="stat-icon" />
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ABOUT SECTION WITH GLOW ============ */}
      <section className="section section-glow" style={{ borderTop: '1px solid var(--black-border)' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              <span style={{ color: 'var(--text-muted)' }}>[</span>
              About The Operation
              <span style={{ color: 'var(--text-muted)' }}>]</span>
            </h2>
            <p className="section-subtitle">What is UNDERGROUND_0x1?</p>
          </div>

          <div style={{ display: 'grid', gap: '24px', maxWidth: '900px', margin: '0 auto' }}>
            <div className="card card-elevated card-glow">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                <div className="category-icon">
                  <Shield size={24} />
                </div>
                <div>
                  <h3 style={{ marginBottom: '12px', fontSize: '1.25rem' }}>The Scenario</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                    Intelligence fragments from DMRC operational systems have been detected
                    across multiple adversarial infrastructure nodes. Pattern analysis indicates
                    a sophisticated, multi-vector data exfiltration operation. Your mission:
                    reconstruct the compromise chain and recover the intelligence.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="card card-hover" style={{ textAlign: 'center', padding: '32px 24px' }}>
                <Target size={36} className="text-yellow" style={{ marginBottom: '16px' }} />
                <h4 style={{ marginBottom: '8px', fontSize: '1.1rem' }}>{stats.challenges} Challenges</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  Across {stats.categories} categories
                </p>
              </div>
              <div className="card card-hover" style={{ textAlign: 'center', padding: '32px 24px' }}>
                <Users size={36} className="text-yellow" style={{ marginBottom: '16px' }} />
                <h4 style={{ marginBottom: '8px', fontSize: '1.1rem' }}>Team Play</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  1-4 members per team
                </p>
              </div>
              <div className="card card-hover" style={{ textAlign: 'center', padding: '32px 24px' }}>
                <Clock size={36} className="text-yellow" style={{ marginBottom: '16px' }} />
                <h4 style={{ marginBottom: '8px', fontSize: '1.1rem' }}>No Time Limit</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  Open CTF format
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CATEGORIES SECTION ============ */}
      <section className="section section-glow-alt" style={{ borderTop: '1px solid var(--black-border)' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              <span style={{ color: 'var(--text-muted)' }}>[</span>
              Challenge Categories
              <span style={{ color: 'var(--text-muted)' }}>]</span>
            </h2>
            <p className="section-subtitle">
              {stats.categories > 0
                ? `${stats.categories} domains. ${stats.challenges} challenges. Zero hints.`
                : "Categories coming soon."}
            </p>
          </div>

          {categories.length > 0 ? (
            <div className="categories-grid">
              {categories.map((cat) => (
                <Link key={cat.id} href={`/challenges#${cat.id}`} className="category-card">
                  <div className="category-icon">
                    <cat.icon size={24} />
                  </div>
                  <h3 className="category-name">{cat.name}</h3>
                  <p className="category-subtitle">{cat.subtitle}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px', lineHeight: '1.6' }}>
                    {cat.description}
                  </p>
                  <div className="category-meta">
                    <span className="category-challenges">
                      {cat.challenges > 0 ? `${cat.challenges} challenges` : "Coming soon"}
                    </span>
                    {cat.points > 0 && <span className="category-points">{cat.points} pts</span>}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
              <Target size={48} className="text-yellow" style={{ marginBottom: '16px', opacity: 0.6 }} />
              <h3 style={{ marginBottom: '12px' }}>Categories Under Development</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                Check back soon for challenges.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ============ CTA SECTION ============ */}
      <section className="section section-glow" style={{ borderTop: '1px solid var(--black-border)' }}>
        <div className="container">
          <div className="card card-elevated" style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center', padding: '60px 40px', position: 'relative', overflow: 'hidden' }}>
            {/* Glow effect inside card */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '300px',
              height: '300px',
              background: 'radial-gradient(circle, rgba(250, 204, 21, 0.1) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <Train size={48} className="text-yellow" style={{ marginBottom: '24px' }} />
            <h2 className="section-title" style={{ marginBottom: '16px' }}>
              Ready to Enter the Underground?
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', fontSize: '16px', maxWidth: '500px', margin: '0 auto 40px' }}>
              Create your account, form a team, and start solving challenges.
              Compete against the best in the nation.
            </p>

            <SignedOut>
              <Link href="/enter" className="btn btn-primary btn-lg">
                Create Account
                <ChevronRight size={18} />
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/challenges" className="btn btn-primary btn-lg">
                View Challenges
                <ChevronRight size={18} />
              </Link>
            </SignedIn>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
