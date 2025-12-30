"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
    Search,
    FileSearch,
    Lock,
    Cpu,
    Globe,
    ChevronDown,
    ChevronRight,
    X,
    CheckCircle,
    AlertTriangle,
    Loader2,
    Target,
    Clock,
    Zap, // Added Zap
    Share2,
    BookOpen,
    ExternalLink,
    FolderOpen,
    Link as LinkIcon,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FirstBloodCelebration from "@/components/FirstBloodCelebration";
import WriteupModal from "@/components/WriteupModal";
import TerminalFlagSubmit from "@/components/TerminalFlagSubmit";
import SolveRateIndicator from "@/components/SolveRateIndicator";
import { getLineColor } from "@/lib/constants";

// Category configuration - consistent yellow theme
const categoryConfig: Record<string, {
    icon: typeof Search;
    subtitle: string;
    description: string;
}> = {
    osint: {
        icon: Search,
        subtitle: "Ghost Corridors",
        description: "Open source intelligence gathering. Track digital footprints and uncover hidden data."
    },
    forensics: {
        icon: FileSearch,
        subtitle: "Signal Black",
        description: "Analyze memory dumps, disk images, and network captures to solve mysteries."
    },
    crypto: {
        icon: Lock,
        subtitle: "Fare Matrix",
        description: "Break ciphers, RSA, AES, and custom encryption schemes."
    },
    reversing: {
        icon: Cpu,
        subtitle: "Token Forge",
        description: "Disassemble binaries, analyze malware, and crack executables."
    },
    web: {
        icon: Globe,
        subtitle: "OCC Portal",
        description: "Exploit web vulnerabilities, XSS, SQLi, and authentication flaws."
    },
    stego: {
        icon: Target,
        subtitle: "Hidden Layers",
        description: "Uncover secrets concealed within images, audio, video, and text files."
    },
};

type Challenge = {
    id: string;
    title: string;
    difficulty: string;
    points: number;
    solves: number;
    description: string;
    slug: string;
    driveUrl?: string;
    linktreeUrl?: string;
    // Challenge unlocking system
    prerequisiteId?: string | null;
    prerequisite?: {
        id: string;
        title: string;
    } | null;
};

type Category = {
    id: string;
    name: string;
    subtitle: string;
    icon: typeof Search;
    description: string;
    points: number;
    challenges: Challenge[];
};

function DifficultyBadge({ difficulty }: { difficulty: string }) {
    const config: Record<string, { label: string; bg: string; border: string }> = {
        MEDIUM: { label: "Medium", bg: "rgba(250, 204, 21, 0.1)", border: "rgba(250, 204, 21, 0.3)" },
        HARD: { label: "Hard", bg: "rgba(250, 204, 21, 0.15)", border: "rgba(250, 204, 21, 0.4)" },
        GOD_LEVEL: { label: "God-Level", bg: "rgba(250, 204, 21, 0.2)", border: "rgba(250, 204, 21, 0.5)" },
    };
    const c = config[difficulty] || config.MEDIUM;
    return (
        <span style={{
            padding: '4px 10px',
            fontSize: '11px',
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--yellow)',
            background: c.bg,
            border: `1px solid ${c.border}`,
            borderRadius: '4px',
        }}>
            {c.label}
        </span>
    );
}

function ChallengeModal({
    challenge,
    category,
    onClose,
    isAuthenticated,
    hasTeam,
    isSolved,
    totalTeams,
}: {
    challenge: Challenge;
    category: Category;
    onClose: () => void;
    isAuthenticated: boolean;
    hasTeam: boolean;
    isSolved: boolean;
    totalTeams: number;
}) {
    const router = useRouter();
    const [showFirstBlood, setShowFirstBlood] = useState(false);
    const [showWriteup, setShowWriteup] = useState(false);
    const [hasSolved, setHasSolved] = useState(isSolved); // Initialize from prop

    // Update local state if prop changes (e.g. after refresh)
    useEffect(() => {
        setHasSolved(isSolved);
    }, [isSolved]);

    const lineColor = getLineColor(category.id);

    return (
        <>
            <FirstBloodCelebration
                show={showFirstBlood}
                onComplete={() => setShowFirstBlood(false)}
                teamName=""
                challengeTitle={challenge.title}
            />

            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.9)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px',
                }}
                onClick={onClose}
            >
                <div
                    style={{
                        background: '#0a0a0a',
                        border: `1px solid ${lineColor.primary}`,
                        borderRadius: '12px',
                        maxWidth: '600px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        position: 'relative',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '8px',
                            transition: 'all 0.2s',
                        }}
                    >
                        <X size={20} />
                    </button>

                    {/* Header */}
                    <div style={{ padding: '32px 32px 24px', borderBottom: '1px solid #1a1a1a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '10px',
                                background: lineColor.secondary,
                                border: `1px solid ${lineColor.primary}40`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: lineColor.primary,
                            }}>
                                <category.icon size={22} />
                            </div>
                            <div>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', fontFamily: 'var(--font-heading)' }}>
                                    {category.name}
                                </p>
                                <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'white' }}>
                                    {challenge.title}
                                </h2>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                            <DifficultyBadge difficulty={challenge.difficulty} />
                            <span style={{ color: lineColor.primary, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                                {challenge.points} pts
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                                {challenge.solves} solves
                            </span>
                            {totalTeams > 0 && (
                                <SolveRateIndicator
                                    solves={challenge.solves}
                                    totalTeams={totalTeams}
                                />
                            )}
                        </div>

                        {/* Bonus Points Info */}
                        {/* Bonus Points Calculation */}
                        {(() => {
                            const baseBonus = challenge.points >= 800 ? 200 : challenge.points >= 500 ? 100 : 50;
                            const b1 = baseBonus;
                            const b2 = Math.floor(baseBonus * 0.6);
                            const b3 = Math.floor(baseBonus * 0.3);

                            return (
                                <div style={{ marginTop: '16px', padding: '10px', background: 'rgba(250, 204, 21, 0.05)', borderRadius: '8px', fontSize: '12px', color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(250, 204, 21, 0.1)' }}>
                                    <Zap size={14} fill="currentColor" fillOpacity={0.2} />
                                    <span>
                                        <strong>Early Solve Bonus:</strong> 1st (+{b1}), 2nd (+{b2}), 3rd (+{b3}) pts!
                                    </span>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Body */}
                    <div style={{ padding: '24px 32px 32px' }}>
                        <div style={{ marginBottom: '28px' }}>
                            <h4 style={{
                                fontSize: '11px',
                                color: lineColor.primary,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                marginBottom: '12px',
                                fontFamily: 'var(--font-heading)',
                            }}>
                                Briefing
                            </h4>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '14px' }}>
                                {challenge.description}
                            </p>
                        </div>

                        {/* Resource Links */}
                        {(challenge.driveUrl || challenge.linktreeUrl) && (
                            <div style={{ marginBottom: '28px' }}>
                                <h4 style={{
                                    fontSize: '11px',
                                    color: lineColor.primary,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                    marginBottom: '12px',
                                    fontFamily: 'var(--font-heading)',
                                }}>
                                    Resources
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {challenge.driveUrl && (
                                        <a
                                            href={challenge.driveUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '12px 16px',
                                                background: `${lineColor.primary}0D`, // 0.05 opacity
                                                border: `1px solid ${lineColor.primary}33`, // 0.2 opacity
                                                borderRadius: '8px',
                                                color: lineColor.primary,
                                                textDecoration: 'none',
                                                fontSize: '14px',
                                                transition: 'all 0.2s',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = `${lineColor.primary}1A`; // 0.1 opacity
                                                e.currentTarget.style.borderColor = `${lineColor.primary}66`; // 0.4 opacity
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = `${lineColor.primary}0D`;
                                                e.currentTarget.style.borderColor = `${lineColor.primary}33`;
                                            }}
                                        >
                                            <FolderOpen size={18} />
                                            <span style={{ flex: 1 }}>Download Files</span>
                                            <ExternalLink size={14} style={{ opacity: 0.6 }} />
                                        </a>
                                    )}
                                    {challenge.linktreeUrl && (
                                        <a
                                            href={challenge.linktreeUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '12px 16px',
                                                background: `${lineColor.primary}0D`,
                                                border: `1px solid ${lineColor.primary}33`,
                                                borderRadius: '8px',
                                                color: lineColor.primary,
                                                textDecoration: 'none',
                                                fontSize: '14px',
                                                transition: 'all 0.2s',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = `${lineColor.primary}1A`;
                                                e.currentTarget.style.borderColor = `${lineColor.primary}66`;
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = `${lineColor.primary}0D`;
                                                e.currentTarget.style.borderColor = `${lineColor.primary}33`;
                                            }}
                                        >
                                            <LinkIcon size={18} />
                                            <span style={{ flex: 1 }}>Challenge Resources</span>
                                            <ExternalLink size={14} style={{ opacity: 0.6 }} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Flag Submission */}
                        {!isAuthenticated ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '32px',
                                background: '#0d0d0d',
                                border: '1px solid #1a1a1a',
                                borderRadius: '8px',
                            }}>
                                <AlertTriangle size={36} style={{ color: 'var(--yellow)', marginBottom: '12px' }} />
                                <h4 style={{ marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>Authentication Required</h4>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>
                                    Sign in to submit flags
                                </p>
                                <Link href="/enter" className="btn btn-primary">Sign In</Link>
                            </div>
                        ) : !hasTeam ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '32px',
                                background: '#0d0d0d',
                                border: '1px solid #1a1a1a',
                                borderRadius: '8px',
                            }}>
                                <AlertTriangle size={36} style={{ color: 'var(--yellow)', marginBottom: '12px' }} />
                                <h4 style={{ marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>Team Required</h4>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>
                                    Join or create a team to submit flags
                                </p>
                                <Link href="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
                            </div>
                        ) : hasSolved ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '32px',
                                background: 'rgba(250, 204, 21, 0.05)',
                                border: '1px solid rgba(250, 204, 21, 0.2)',
                                borderRadius: '8px',
                                marginTop: '24px'
                            }}>
                                <CheckCircle size={48} style={{ color: 'var(--yellow)', margin: '0 auto 16px' }} />
                                <h4 style={{
                                    fontFamily: 'var(--font-heading)',
                                    color: 'white',
                                    fontSize: '18px',
                                    marginBottom: '8px'
                                }}>
                                    Challenge Solved!
                                </h4>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                                    You have successfully completed this challenge.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setShowWriteup(true)}
                                    className="btn btn-secondary"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <BookOpen size={16} />
                                    View Write-up
                                </button>
                            </div>
                        ) : (
                            <TerminalFlagSubmit
                                challengeId={challenge.slug}
                                onSuccess={(isFirstBlood) => {
                                    setHasSolved(true);
                                    router.refresh();
                                    if (isFirstBlood) {
                                        setShowFirstBlood(true);
                                    }
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Writeup Modal */}
            <WriteupModal
                challengeId={challenge.id}
                challengeTitle={challenge.title}
                challengeSlug={challenge.slug}
                categoryName={category.name}
                difficulty={challenge.difficulty}
                isSolved={hasSolved}
                isOpen={showWriteup}
                onClose={() => setShowWriteup(false)}
            />
        </>
    );
}

export default function ChallengesPage() {
    const { user, isLoaded } = useUser();
    const [categoriesData, setCategoriesData] = useState<Category[]>([]);
    const [totalChallenges, setTotalChallenges] = useState(0);
    const [totalPoints, setTotalPoints] = useState(0);
    const [loading, setLoading] = useState(true);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [selectedChallenge, setSelectedChallenge] = useState<{ challenge: Challenge; category: Category } | null>(null);
    const [hasTeam, setHasTeam] = useState(false);
    const [solvedChallengeIds, setSolvedChallengeIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [difficultyFilter, setDifficultyFilter] = useState<string>("ALL");
    const [totalTeams, setTotalTeams] = useState(0);

    // Fetch challenges from API
    useEffect(() => {
        // ... (existing fetch logic remains same)
        fetch("/api/challenges")
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.categories) {
                    const transformed = data.categories.map((cat: any) => {
                        const slug = cat.slug.toLowerCase();
                        const config = categoryConfig[slug] || { icon: Search, subtitle: "", description: "" };
                        return {
                            id: slug,
                            name: cat.name,
                            subtitle: config.subtitle,
                            icon: config.icon,
                            description: config.description,
                            points: cat.challenges.reduce((sum: number, c: any) => sum + c.points, 0),
                            challenges: cat.challenges.map((c: any) => ({
                                id: c.id,
                                title: c.title,
                                difficulty: c.difficulty,
                                points: c.points,
                                solves: c.solveCount || 0,
                                description: c.description,
                                slug: c.slug,
                                driveUrl: c.driveUrl,
                                linktreeUrl: c.linktreeUrl,
                                // Challenge unlocking
                                prerequisiteId: c.prerequisiteId,
                                prerequisite: c.prerequisite,
                            })),
                        };
                    });
                    setCategoriesData(transformed);
                    setTotalChallenges(data.totalChallenges || 0);
                    setTotalPoints(data.totalPoints || 0);
                    setTotalTeams(data.totalTeams || 0);
                    if (transformed.length > 0) {
                        setExpandedCategory(transformed[0].id);
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
                    setHasTeam(!!data.user?.team);
                    if (data.user?.solvedChallengeIds) {
                        setSolvedChallengeIds(data.user.solvedChallengeIds);
                    }
                })
                .catch(() => setHasTeam(false));
        }
    }, [user]);

    // Filter categories by search and difficulty
    const filteredCategories = categoriesData.map(cat => ({
        ...cat,
        challenges: cat.challenges.filter(ch => {
            const matchesSearch = ch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ch.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesDifficulty = difficultyFilter === "ALL" || ch.difficulty === difficultyFilter;
            return matchesSearch && matchesDifficulty;
        })
    })).filter(cat => cat.challenges.length > 0 || searchQuery === "");

    const toggleCategory = (categoryId: string) => {
        setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
    };

    return (
        <div className="min-h-screen bg-black">
            <Navbar />

            {/* Header */}
            <section style={{ paddingTop: 'calc(var(--nav-height) + 32px)', paddingBottom: '24px' }}>
                <div className="container" style={{ maxWidth: '1200px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <h1 style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: '2.5rem',
                            fontWeight: 700,
                            marginBottom: '12px',
                        }}>
                            <span style={{ color: 'var(--yellow)' }}>[</span>
                            Challenges
                            <span style={{ color: 'var(--yellow)' }}>]</span>
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
                            {totalChallenges > 0
                                ? `${totalChallenges} challenges • ${totalPoints} total points`
                                : "Elite challenges coming soon"}
                        </p>
                    </div>

                    {/* Search & Filter */}
                    {
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            maxWidth: '600px',
                            margin: '0 auto 24px',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                        }}>
                            <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
                                <Search
                                    size={18}
                                    style={{
                                        position: 'absolute',
                                        left: '14px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: 'var(--text-muted)'
                                    }}
                                />
                                <input
                                    type="text"
                                    placeholder="Search challenges..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px 12px 44px',
                                        background: '#0a0a0a',
                                        border: '1px solid #1a1a1a',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '14px',
                                        fontFamily: 'var(--font-body)',
                                    }}
                                />
                            </div>
                            <select
                                value={difficultyFilter}
                                onChange={(e) => setDifficultyFilter(e.target.value)}
                                style={{
                                    padding: '12px 16px',
                                    background: '#0a0a0a',
                                    border: '1px solid #1a1a1a',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontFamily: 'var(--font-body)',
                                    cursor: 'pointer',
                                    minWidth: '140px',
                                }}
                            >
                                <option value="ALL">All Levels</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HARD">Hard</option>
                                <option value="GOD_LEVEL">God-Level</option>
                            </select>
                        </div>
                    }
                </div>
            </section>

            {/* Categories */}
            <section style={{ paddingBottom: '60px' }}>
                <div className="container" style={{ maxWidth: '1200px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                            <Loader2 size={40} className="spinner" style={{ color: 'var(--yellow)' }} />
                        </div>
                    ) : totalChallenges === 0 ? (
                        /* Coming Soon View */
                        <div>
                            {/* Coming Soon Banner */}
                            <div style={{
                                textAlign: 'center',
                                padding: '48px 24px',
                                marginBottom: '40px',
                                background: '#0a0a0a',
                                border: '1px solid rgba(250, 204, 21, 0.2)',
                                borderRadius: '12px',
                            }}>
                                <Clock size={48} style={{ color: 'var(--yellow)', marginBottom: '20px' }} />
                                <h2 style={{
                                    fontFamily: 'var(--font-heading)',
                                    fontSize: '1.75rem',
                                    fontWeight: 700,
                                    marginBottom: '12px',
                                    color: 'var(--yellow)',
                                }}>
                                    Elite Challenges Coming Soon
                                </h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: '15px', maxWidth: '450px', margin: '0 auto' }}>
                                    Our team is crafting challenges across all categories.<br />
                                    No hints. No shortcuts. Only skill.
                                </p>
                            </div>

                            {/* Category Preview */}
                            <h3 style={{
                                fontFamily: 'var(--font-heading)',
                                fontSize: '1rem',
                                marginBottom: '20px',
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                            }}>
                                Upcoming Categories
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {categoriesData.map((category) => {
                                    const CategoryIcon = category.icon;
                                    const lineColor = getLineColor(category.id);
                                    return (
                                        <div
                                            key={category.id}
                                            className="card"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '16px',
                                                padding: '20px 24px',
                                                cursor: 'default',
                                                // borderRight: `2px solid ${lineColor.primary}`, // Removed as per request
                                            }}
                                        >
                                            <div style={{
                                                width: '44px',
                                                height: '44px',
                                                borderRadius: '10px',
                                                background: lineColor.secondary, // Dynamic bg
                                                border: `1px solid ${lineColor.primary}40`, // Dyamic border
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: lineColor.primary, // Dynamic icon color
                                                flexShrink: 0,
                                            }}>
                                                <CategoryIcon size={20} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{
                                                    fontFamily: 'var(--font-heading)',
                                                    fontWeight: 600,
                                                    marginBottom: '4px',
                                                    color: 'white',
                                                    fontSize: '15px',
                                                }}>
                                                    {category.name}
                                                    <span style={{
                                                        color: 'var(--text-muted)',
                                                        fontWeight: 400,
                                                        marginLeft: '8px',
                                                        fontSize: '13px',
                                                    }}>
                                                        — {category.subtitle}
                                                    </span>
                                                </h4>
                                                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                                    {category.description}
                                                </p>
                                            </div>
                                            <span style={{
                                                fontSize: "13px",
                                                fontFamily: "var(--font-heading)",
                                                fontWeight: 600,
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em",
                                                color: lineColor.primary,
                                                whiteSpace: "nowrap",
                                            }}>
                                                Upcoming
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : filteredCategories.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                            <Search size={48} style={{ color: 'var(--yellow)', marginBottom: '16px', opacity: 0.6 }} />
                            <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: '12px' }}>No Challenges Found</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
                                No challenges match your current filters.
                            </p>
                            <button
                                onClick={() => { setSearchQuery(""); setDifficultyFilter("ALL"); }}
                                className="btn btn-secondary"
                            >
                                Clear Filters
                            </button>
                        </div>
                    ) : (
                        /* Category Dropdowns */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {filteredCategories.map((category) => {
                                const isExpanded = expandedCategory === category.id;
                                const CategoryIcon = category.icon;
                                const lineColor = getLineColor(category.id);

                                return (
                                    <div
                                        key={category.id}
                                        style={{
                                            background: '#0a0a0a',
                                            border: isExpanded ? `1px solid ${lineColor.primary}` : '1px solid #1a1a1a',
                                            borderRadius: '10px',
                                            overflow: 'hidden',
                                            transition: 'border-color 0.2s',
                                        }}
                                    >
                                        {/* Category Header */}
                                        <button
                                            onClick={() => toggleCategory(category.id)}
                                            style={{
                                                width: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '16px',
                                                padding: '20px 24px',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                            }}
                                        >
                                            <div style={{
                                                width: '44px',
                                                height: '44px',
                                                borderRadius: '10px',
                                                background: lineColor.secondary,
                                                border: `1px solid ${lineColor.primary}40`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: lineColor.primary,
                                                flexShrink: 0,
                                            }}>
                                                <CategoryIcon size={20} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h3 style={{
                                                    fontFamily: 'var(--font-heading)',
                                                    fontWeight: 600,
                                                    marginBottom: '4px',
                                                    color: 'white',
                                                    fontSize: '15px',
                                                }}>
                                                    {category.name}
                                                    <span style={{
                                                        color: 'var(--text-muted)',
                                                        fontWeight: 400,
                                                        marginLeft: '8px',
                                                        fontSize: '13px',
                                                    }}>
                                                        — {category.subtitle}
                                                    </span>
                                                </h3>
                                                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                                    {category.challenges.length > 0
                                                        ? `${category.challenges.length} challenges • ${category.points} pts`
                                                        : <span style={{
                                                            color: 'var(--yellow)',
                                                            fontFamily: 'var(--font-heading)',
                                                            fontWeight: 600,
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.05em',
                                                            fontSize: '11px',
                                                        }}>Upcoming</span>
                                                    }
                                                </p>
                                            </div>
                                            <ChevronDown
                                                size={20}
                                                style={{
                                                    color: 'var(--yellow)',
                                                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                    transition: 'transform 0.2s',
                                                }}
                                            />
                                        </button>

                                        {/* Challenges List */}
                                        {isExpanded && (
                                            <div style={{
                                                padding: '0 24px 20px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '8px',
                                            }}>
                                                {category.challenges.map((challenge) => {
                                                    // Check if challenge is locked (has prerequisite that isn't solved)
                                                    const isLocked = challenge.prerequisiteId &&
                                                        !solvedChallengeIds.includes(challenge.prerequisiteId);

                                                    return (
                                                        <button
                                                            key={challenge.id}
                                                            onClick={() => !isLocked && setSelectedChallenge({ challenge, category })}
                                                            disabled={!!isLocked}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '16px',
                                                                padding: '16px 20px',
                                                                background: isLocked ? '#080808' : '#0d0d0d',
                                                                border: isLocked ? '1px solid #141414' : '1px solid #1a1a1a',
                                                                borderRadius: '8px',
                                                                cursor: isLocked ? 'not-allowed' : 'pointer',
                                                                textAlign: 'left',
                                                                width: '100%',
                                                                transition: 'border-color 0.2s',
                                                                opacity: isLocked ? 0.6 : 1,
                                                            }}
                                                            onMouseEnter={(e) => !isLocked && (e.currentTarget.style.borderColor = `${lineColor.primary}4D`)} // 0.3 opacity
                                                            onMouseLeave={(e) => e.currentTarget.style.borderColor = isLocked ? '#141414' : '#1a1a1a'}
                                                        >
                                                            {isLocked ? (
                                                                <Lock size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                                            ) : (
                                                                <Target size={18} style={{ color: lineColor.primary, flexShrink: 0 }} />
                                                            )}
                                                            <div style={{ flex: 1 }}>
                                                                <h4 style={{
                                                                    fontFamily: 'var(--font-heading)',
                                                                    fontWeight: 600,
                                                                    color: isLocked ? 'var(--text-muted)' : 'white',
                                                                    fontSize: '14px',
                                                                    marginBottom: '2px',
                                                                }}>
                                                                    {challenge.title}
                                                                </h4>
                                                                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                                    {isLocked ? (
                                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                            <Lock size={10} />
                                                                            Solve &quot;{challenge.prerequisite?.title}&quot; first
                                                                        </span>
                                                                    ) : (
                                                                        `${challenge.solves} solves`
                                                                    )}
                                                                </p>
                                                            </div>
                                                            <DifficultyBadge difficulty={challenge.difficulty} />
                                                            <span style={{
                                                                color: isLocked ? 'var(--text-muted)' : lineColor.primary,
                                                                fontWeight: 700,
                                                                fontSize: '14px',
                                                                fontFamily: 'var(--font-heading)',
                                                            }}>
                                                                {challenge.points} pts
                                                            </span>
                                                            {!isLocked && totalTeams > 0 && (
                                                                <SolveRateIndicator
                                                                    solves={challenge.solves}
                                                                    totalTeams={totalTeams}
                                                                    compact
                                                                />
                                                            )}
                                                            <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* Challenge Modal */}
            {selectedChallenge && (
                <ChallengeModal
                    challenge={selectedChallenge.challenge}
                    category={selectedChallenge.category}
                    onClose={() => setSelectedChallenge(null)}
                    isAuthenticated={isLoaded && !!user}
                    hasTeam={hasTeam}
                    isSolved={solvedChallengeIds.includes(selectedChallenge.challenge.id)}
                    totalTeams={totalTeams}
                />
            )}

            <Footer />
        </div>
    );
}
