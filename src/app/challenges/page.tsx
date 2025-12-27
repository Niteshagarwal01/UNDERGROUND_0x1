"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
    Search,
    FileSearch,
    Lock,
    Cpu,
    Globe,
    ChevronDown,
    X,
    Send,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Loader2,
    Construction,
    Filter,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FirstBloodCelebration from "@/components/FirstBloodCelebration";

// Category icon mapping
const categoryIcons: Record<string, typeof Search> = {
    osint: Search,
    forensics: FileSearch,
    crypto: Lock,
    reversing: Cpu,
    web: Globe,
};

// Category subtitle mapping
const categorySubtitles: Record<string, string> = {
    osint: "Ghost Corridors",
    forensics: "Signal Black",
    crypto: "Fare Matrix",
    reversing: "Token Forge",
    web: "OCC Portal",
};

type Challenge = {
    id: string;
    title: string;
    difficulty: string;
    points: number;
    solves: number;
    description: string;
    slug: string;
};

type Category = {
    id: string;
    name: string;
    subtitle: string;
    icon: typeof Search;
    points: number;
    challenges: Challenge[];
};

function DifficultyBadge({ difficulty }: { difficulty: string }) {
    const styles: Record<string, string> = {
        MEDIUM: "badge badge-medium",
        HARD: "badge badge-hard",
        GOD_LEVEL: "badge badge-god",
    };
    const labels: Record<string, string> = {
        MEDIUM: "Medium",
        HARD: "Hard",
        GOD_LEVEL: "God-Level",
    };
    return <span className={styles[difficulty]}>{labels[difficulty]}</span>;
}

function ChallengeModal({
    challenge,
    category,
    onClose,
    isAuthenticated,
    hasTeam,
}: {
    challenge: Challenge;
    category: Category;
    onClose: () => void;
    isAuthenticated: boolean;
    hasTeam: boolean;
}) {
    const [flag, setFlag] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string; isFirstBlood?: boolean } | null>(null);
    const [showFirstBlood, setShowFirstBlood] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setResult(null);

        try {
            const res = await fetch("/api/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ challengeId: challenge.slug, flag }),
            });
            const data = await res.json();
            setResult(data);
            if (data.success) {
                setFlag("");
                // Trigger first blood celebration if applicable
                if (data.isFirstBlood) {
                    setShowFirstBlood(true);
                }
            }
        } catch {
            setResult({ success: false, message: "Network error. Please try again." });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            {/* First Blood Celebration */}
            <FirstBloodCelebration
                show={showFirstBlood}
                onComplete={() => setShowFirstBlood(false)}
                teamName=""
                challengeTitle={challenge.title}
            />

            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
                    {/* Close Button */}
                    <button onClick={onClose} className="modal-close">
                        <X size={20} />
                    </button>

                    {/* Header */}
                    <div className="modal-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                            <div className="category-icon" style={{ width: '48px', height: '48px' }}>
                                <category.icon size={24} />
                            </div>
                            <div>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{category.name}</p>
                                <h2 style={{ fontSize: '1.5rem' }}>{challenge.title}</h2>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <DifficultyBadge difficulty={challenge.difficulty} />
                            <span className="text-yellow" style={{ fontWeight: 700 }}>{challenge.points} pts</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{challenge.solves} solves</span>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="modal-body">
                        <div style={{ marginBottom: '32px' }}>
                            <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                                Briefing
                            </h4>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                                {challenge.description}
                            </p>
                        </div>

                        {/* Flag Submission */}
                        {!isAuthenticated ? (
                            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                                <AlertTriangle size={40} className="text-yellow" style={{ marginBottom: '16px' }} />
                                <h4 style={{ marginBottom: '8px' }}>Authentication Required</h4>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                                    Sign in to submit flags
                                </p>
                                <Link href="/enter" className="btn btn-primary">
                                    Sign In
                                </Link>
                            </div>
                        ) : !hasTeam ? (
                            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                                <AlertTriangle size={40} className="text-yellow" style={{ marginBottom: '16px' }} />
                                <h4 style={{ marginBottom: '8px' }}>Team Required</h4>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                                    Create or join a team to submit flags
                                </p>
                                <Link href="/dashboard" className="btn btn-primary">
                                    Go to Dashboard
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div className="input-group">
                                    <label className="input-label">Submit Flag</label>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="UG0x1{...}"
                                            value={flag}
                                            onChange={(e) => setFlag(e.target.value)}
                                            disabled={submitting}
                                            style={{ flex: 1 }}
                                        />
                                        <button type="submit" className="btn btn-primary" disabled={submitting || !flag.trim()}>
                                            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {result && (
                                    <div className={`alert ${result.success ? 'alert-success' : 'alert-error'}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
                                        {result.success ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                        {result.message}
                                    </div>
                                )}
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default function ChallengesPage() {
    const { user, isLoaded } = useUser();
    const [openCategories, setOpenCategories] = useState<string[]>([]);
    const [selectedChallenge, setSelectedChallenge] = useState<{
        challenge: Challenge;
        category: Category;
    } | null>(null);
    const [hasTeam, setHasTeam] = useState(false);
    const [categoriesData, setCategoriesData] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalChallenges, setTotalChallenges] = useState(0);
    const [totalPoints, setTotalPoints] = useState(0);

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [difficultyFilter, setDifficultyFilter] = useState<string>("ALL");
    const [showFilters, setShowFilters] = useState(false);

    // Fetch challenges from API
    useEffect(() => {
        fetch("/api/challenges")
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.categories) {
                    // Transform API data to match component format
                    const transformed = data.categories.map((cat: any) => {
                        const slug = cat.slug.toLowerCase();
                        return {
                            id: slug,
                            name: cat.name,
                            subtitle: categorySubtitles[slug] || "",
                            icon: categoryIcons[slug] || Search,
                            points: cat.challenges.reduce((sum: number, c: any) => sum + c.points, 0),
                            challenges: cat.challenges.map((c: any) => ({
                                id: c.slug,
                                title: c.title,
                                difficulty: c.difficulty,
                                points: c.points,
                                solves: c.solveCount || 0,
                                description: c.description,
                                slug: c.slug,
                            })),
                        };
                    });
                    setCategoriesData(transformed);
                    setTotalChallenges(data.totalChallenges || 0);
                    setTotalPoints(data.totalPoints || 0);
                    // Open first category by default
                    if (transformed.length > 0) {
                        setOpenCategories([transformed[0].id]);
                    }
                }
            })
            .catch((error) => {
                console.error("Error fetching challenges:", error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (user) {
            fetch("/api/user")
                .then((res) => res.json())
                .then((data) => {
                    if (data.success && data.user?.team) {
                        setHasTeam(true);
                    }
                })
                .catch(() => { });
        }
    }, [user]);

    const toggleCategory = (id: string) => {
        setOpenCategories((prev) =>
            prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
        );
    };

    // Filter challenges
    const getFilteredCategories = () => {
        return categoriesData.map(category => ({
            ...category,
            challenges: category.challenges.filter(challenge => {
                // Search filter
                const matchesSearch = searchQuery === "" ||
                    challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    challenge.description.toLowerCase().includes(searchQuery.toLowerCase());

                // Difficulty filter
                const matchesDifficulty = difficultyFilter === "ALL" ||
                    challenge.difficulty === difficultyFilter;

                return matchesSearch && matchesDifficulty;
            })
        })).filter(category => category.challenges.length > 0);
    };

    const filteredCategories = getFilteredCategories();
    const filteredChallengeCount = filteredCategories.reduce((sum, cat) => sum + cat.challenges.length, 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-black grid-pattern">
                <Navbar />
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '60vh',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    <Loader2 size={40} className="spinner text-yellow" />
                    <p style={{ color: 'var(--text-secondary)' }}>Loading challenges...</p>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black grid-pattern">
            <Navbar />

            {/* Header */}
            <section className="section" style={{ paddingTop: 'calc(var(--nav-height) + 60px)', paddingBottom: '40px' }}>
                <div className="container">
                    <div className="section-header" style={{ marginBottom: '40px' }}>
                        <h1 className="section-title">
                            <span style={{ color: 'var(--text-muted)' }}>[</span>
                            Challenges
                            <span style={{ color: 'var(--text-muted)' }}>]</span>
                        </h1>
                        <p className="section-subtitle">
                            {totalChallenges} challenges • {totalPoints.toLocaleString()} total points
                        </p>
                    </div>

                    {/* Filter Bar */}
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '12px',
                        alignItems: 'center',
                        marginBottom: '32px'
                    }}>
                        {/* Search Input */}
                        <div style={{
                            flex: '1',
                            minWidth: '200px',
                            position: 'relative'
                        }}>
                            <Search size={18} style={{
                                position: 'absolute',
                                left: '14px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-muted)'
                            }} />
                            <input
                                type="text"
                                placeholder="Search challenges..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 14px 12px 44px',
                                    background: 'var(--black-card)',
                                    border: '1px solid var(--black-border)',
                                    borderRadius: '8px',
                                    color: 'var(--text-primary)',
                                    fontSize: '14px',
                                }}
                            />
                        </div>

                        {/* Difficulty Filter */}
                        <select
                            value={difficultyFilter}
                            onChange={(e) => setDifficultyFilter(e.target.value)}
                            style={{
                                padding: '12px 16px',
                                background: 'var(--black-card)',
                                border: '1px solid var(--black-border)',
                                borderRadius: '8px',
                                color: 'var(--text-primary)',
                                fontSize: '14px',
                                minWidth: '140px',
                                cursor: 'pointer',
                            }}
                        >
                            <option value="ALL">All Levels</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HARD">Hard</option>
                            <option value="GOD_LEVEL">God-Level</option>
                        </select>

                        {/* Filter indicator */}
                        {(searchQuery || difficultyFilter !== "ALL") && (
                            <button
                                onClick={() => { setSearchQuery(""); setDifficultyFilter("ALL"); }}
                                style={{
                                    padding: '12px 16px',
                                    background: 'rgba(250, 204, 21, 0.1)',
                                    border: '1px solid rgba(250, 204, 21, 0.3)',
                                    borderRadius: '8px',
                                    color: 'var(--yellow)',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                }}
                            >
                                <X size={14} />
                                Clear ({filteredChallengeCount} shown)
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {/* Challenges Accordion */}
            <section style={{ paddingBottom: '100px' }}>
                <div className="container">
                    {filteredCategories.length === 0 ? (
                        <>
                            {/* Show categories even when no challenges */}
                            {categoriesData.length === 0 ? (
                                <>
                                    {/* Hero Coming Soon Banner */}
                                    <div className="card" style={{
                                        textAlign: 'center',
                                        padding: '40px 24px',
                                        marginBottom: '32px',
                                        background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.05) 0%, rgba(0, 0, 0, 0.8) 100%)',
                                        border: '1px solid rgba(250, 204, 21, 0.2)',
                                    }}>
                                        <Construction size={56} className="text-yellow" style={{ margin: '0 auto 20px', opacity: 0.9 }} />
                                        <h2 style={{
                                            fontFamily: 'var(--font-heading)',
                                            fontSize: '1.75rem',
                                            marginBottom: '12px',
                                            background: 'linear-gradient(90deg, var(--yellow), #fff)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                        }}>
                                            Elite Challenges Coming Soon
                                        </h2>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '500px', margin: '0 auto', lineHeight: 1.7 }}>
                                            Our team of experts is crafting <strong style={{ color: 'var(--yellow)' }}>15+ challenges</strong> across all categories.
                                            <br />No hints. No shortcuts. Only skill.
                                        </p>
                                    </div>

                                    {/* Category Preview Grid */}
                                    <h3 style={{
                                        fontFamily: 'var(--font-heading)',
                                        fontSize: '1.25rem',
                                        marginBottom: '24px',
                                        color: 'var(--text-primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        <span style={{ color: 'var(--yellow)' }}>▶</span> Challenge Categories
                                    </h3>

                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                        gap: '20px'
                                    }}>
                                        {/* OSINT Category */}
                                        <div className="card" style={{
                                            padding: '24px',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            borderColor: 'rgba(59, 130, 246, 0.3)',
                                        }}>
                                            <div style={{
                                                position: 'absolute',
                                                top: '-20px',
                                                right: '-20px',
                                                width: '80px',
                                                height: '80px',
                                                background: 'rgba(59, 130, 246, 0.1)',
                                                borderRadius: '50%'
                                            }} />
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                                <div style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    borderRadius: '12px',
                                                    background: 'rgba(59, 130, 246, 0.15)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <Search size={24} style={{ color: '#3b82f6' }} />
                                                </div>
                                                <div>
                                                    <h4 style={{ fontFamily: 'var(--font-heading)', color: '#3b82f6', marginBottom: '4px' }}>OSINT</h4>
                                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Ghost Corridors</span>
                                                </div>
                                            </div>
                                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.6 }}>
                                                Open source intelligence gathering. Track digital footprints and uncover hidden data.
                                            </p>
                                            <span className="badge" style={{
                                                background: 'rgba(250, 204, 21, 0.15)',
                                                color: 'var(--yellow)',
                                                border: '1px solid rgba(250, 204, 21, 0.3)',
                                                fontSize: '11px'
                                            }}>
                                                Coming Soon
                                            </span>
                                        </div>

                                        {/* Forensics Category */}
                                        <div className="card" style={{
                                            padding: '24px',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            borderColor: 'rgba(34, 197, 94, 0.3)',
                                        }}>
                                            <div style={{
                                                position: 'absolute',
                                                top: '-20px',
                                                right: '-20px',
                                                width: '80px',
                                                height: '80px',
                                                background: 'rgba(34, 197, 94, 0.1)',
                                                borderRadius: '50%'
                                            }} />
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                                <div style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    borderRadius: '12px',
                                                    background: 'rgba(34, 197, 94, 0.15)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <FileSearch size={24} style={{ color: '#22c55e' }} />
                                                </div>
                                                <div>
                                                    <h4 style={{ fontFamily: 'var(--font-heading)', color: '#22c55e', marginBottom: '4px' }}>Forensics</h4>
                                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Signal Black</span>
                                                </div>
                                            </div>
                                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.6 }}>
                                                Analyze memory dumps, disk images, and network captures to solve mysteries.
                                            </p>
                                            <span className="badge" style={{
                                                background: 'rgba(250, 204, 21, 0.15)',
                                                color: 'var(--yellow)',
                                                border: '1px solid rgba(250, 204, 21, 0.3)',
                                                fontSize: '11px'
                                            }}>
                                                Coming Soon
                                            </span>
                                        </div>

                                        {/* Crypto Category */}
                                        <div className="card" style={{
                                            padding: '24px',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            borderColor: 'rgba(250, 204, 21, 0.3)',
                                        }}>
                                            <div style={{
                                                position: 'absolute',
                                                top: '-20px',
                                                right: '-20px',
                                                width: '80px',
                                                height: '80px',
                                                background: 'rgba(250, 204, 21, 0.1)',
                                                borderRadius: '50%'
                                            }} />
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                                <div style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    borderRadius: '12px',
                                                    background: 'rgba(250, 204, 21, 0.15)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <Lock size={24} style={{ color: 'var(--yellow)' }} />
                                                </div>
                                                <div>
                                                    <h4 style={{ fontFamily: 'var(--font-heading)', color: 'var(--yellow)', marginBottom: '4px' }}>Cryptography</h4>
                                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Fare Matrix</span>
                                                </div>
                                            </div>
                                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.6 }}>
                                                Break ciphers, RSA, AES, and custom encryption schemes.
                                            </p>
                                            <span className="badge" style={{
                                                background: 'rgba(250, 204, 21, 0.15)',
                                                color: 'var(--yellow)',
                                                border: '1px solid rgba(250, 204, 21, 0.3)',
                                                fontSize: '11px'
                                            }}>
                                                Coming Soon
                                            </span>
                                        </div>

                                        {/* Reversing Category */}
                                        <div className="card" style={{
                                            padding: '24px',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            borderColor: 'rgba(168, 85, 247, 0.3)',
                                        }}>
                                            <div style={{
                                                position: 'absolute',
                                                top: '-20px',
                                                right: '-20px',
                                                width: '80px',
                                                height: '80px',
                                                background: 'rgba(168, 85, 247, 0.1)',
                                                borderRadius: '50%'
                                            }} />
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                                <div style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    borderRadius: '12px',
                                                    background: 'rgba(168, 85, 247, 0.15)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <Cpu size={24} style={{ color: '#a855f7' }} />
                                                </div>
                                                <div>
                                                    <h4 style={{ fontFamily: 'var(--font-heading)', color: '#a855f7', marginBottom: '4px' }}>Reverse Engineering</h4>
                                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Token Forge</span>
                                                </div>
                                            </div>
                                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.6 }}>
                                                Disassemble binaries, analyze malware, and crack executables.
                                            </p>
                                            <span className="badge" style={{
                                                background: 'rgba(250, 204, 21, 0.15)',
                                                color: 'var(--yellow)',
                                                border: '1px solid rgba(250, 204, 21, 0.3)',
                                                fontSize: '11px'
                                            }}>
                                                Coming Soon
                                            </span>
                                        </div>

                                        {/* Web Category */}
                                        <div className="card" style={{
                                            padding: '24px',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            borderColor: 'rgba(239, 68, 68, 0.3)',
                                        }}>
                                            <div style={{
                                                position: 'absolute',
                                                top: '-20px',
                                                right: '-20px',
                                                width: '80px',
                                                height: '80px',
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                borderRadius: '50%'
                                            }} />
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                                <div style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    borderRadius: '12px',
                                                    background: 'rgba(239, 68, 68, 0.15)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <Globe size={24} style={{ color: '#ef4444' }} />
                                                </div>
                                                <div>
                                                    <h4 style={{ fontFamily: 'var(--font-heading)', color: '#ef4444', marginBottom: '4px' }}>Web Security</h4>
                                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>OCC Portal</span>
                                                </div>
                                            </div>
                                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.6 }}>
                                                Exploit web vulnerabilities, XSS, SQLi, and authentication flaws.
                                            </p>
                                            <span className="badge" style={{
                                                background: 'rgba(250, 204, 21, 0.15)',
                                                color: 'var(--yellow)',
                                                border: '1px solid rgba(250, 204, 21, 0.3)',
                                                fontSize: '11px'
                                            }}>
                                                Coming Soon
                                            </span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
                                    <Search size={48} className="text-yellow" style={{ margin: '0 auto 16px', opacity: 0.7 }} />
                                    <h3 style={{ marginBottom: '12px' }}>No Challenges Found</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
                                        No challenges match your filters. Try adjusting your search or difficulty filter.
                                    </p>
                                    <button
                                        onClick={() => { setSearchQuery(""); setDifficultyFilter("ALL"); }}
                                        className="btn btn-primary btn-sm"
                                        style={{ marginTop: '16px' }}
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        filteredCategories.map((category) => (
                            <div key={category.id} id={category.id} className="accordion">
                                {/* Accordion Header */}
                                <div
                                    className={`accordion-header ${openCategories.includes(category.id) ? 'active' : ''}`}
                                    onClick={() => toggleCategory(category.id)}
                                >
                                    <div className="accordion-icon">
                                        <category.icon size={24} />
                                    </div>
                                    <div className="accordion-info">
                                        <h3 className="accordion-title">{category.name}</h3>
                                        <p className="accordion-subtitle">{category.subtitle}</p>
                                    </div>
                                    <div className="accordion-meta hide-mobile">
                                        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                                            {category.challenges.length} challenges
                                        </span>
                                        <span className="accordion-points">{category.points} pts</span>
                                    </div>
                                    <ChevronDown
                                        size={24}
                                        className={`accordion-toggle ${openCategories.includes(category.id) ? 'open' : ''}`}
                                    />
                                </div>

                                {/* Accordion Content */}
                                {openCategories.includes(category.id) && (
                                    <div className="accordion-content">
                                        {category.challenges.length === 0 ? (
                                            <div style={{
                                                textAlign: 'center',
                                                padding: '48px 24px',
                                                background: 'var(--black-lighter)',
                                                borderRadius: '8px',
                                                border: '1px dashed var(--black-border)'
                                            }}>
                                                <Construction size={36} className="text-yellow" style={{ marginBottom: '12px', opacity: 0.6 }} />
                                                <h4 style={{ marginBottom: '8px', fontSize: '1rem' }}>Challenges Coming Soon</h4>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                                                    {category.name} challenges are under development.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="challenges-list">
                                                {category.challenges.map((challenge) => (
                                                    <div
                                                        key={challenge.id}
                                                        className="challenge-card"
                                                        onClick={() => setSelectedChallenge({ challenge, category })}
                                                    >
                                                        <div className="challenge-header">
                                                            <h4 className="challenge-title">{challenge.title}</h4>
                                                            <DifficultyBadge difficulty={challenge.difficulty} />
                                                        </div>
                                                        <p className="challenge-description">{challenge.description}</p>
                                                        <div className="challenge-footer">
                                                            <span className="challenge-points">{challenge.points} pts</span>
                                                            <span className="challenge-solves">{challenge.solves} solves</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Modal */}
            {selectedChallenge && (
                <ChallengeModal
                    challenge={selectedChallenge.challenge}
                    category={selectedChallenge.category}
                    onClose={() => setSelectedChallenge(null)}
                    isAuthenticated={isLoaded && !!user}
                    hasTeam={hasTeam}
                />
            )}

            <Footer />
        </div>
    );
}
