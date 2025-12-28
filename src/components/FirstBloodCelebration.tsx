"use client";

import { useEffect, useState } from "react";
import { Skull, Droplets, Sparkles, Zap, Crown, Trophy } from "lucide-react";

interface Particle {
    id: number;
    x: number;
    y: number;
    color: string;
    delay: number;
    duration: number;
    size: number;
    type: "confetti" | "drop" | "spark" | "glow";
    rotation: number;
}

interface FirstBloodCelebrationProps {
    show: boolean;
    onComplete?: () => void;
    teamName?: string;
    challengeTitle?: string;
}

export default function FirstBloodCelebration({
    show,
    onComplete,
    teamName,
    challengeTitle,
}: FirstBloodCelebrationProps) {
    const [particles, setParticles] = useState<Particle[]>([]);
    const [visible, setVisible] = useState(false);
    const [glitchPhase, setGlitchPhase] = useState(0);
    const [showRings, setShowRings] = useState(false);

    useEffect(() => {
        if (show) {
            setVisible(true);
            setShowRings(true);

            // Premium gold color palette
            const goldColors = ["#facc15", "#fbbf24", "#f59e0b", "#eab308", "#d97706"];
            const accentColors = ["#ffffff", "#fef3c7", "#fde68a"];
            const generatedParticles: Particle[] = [];

            // Gold drops from top
            for (let i = 0; i < 25; i++) {
                generatedParticles.push({
                    id: i,
                    x: Math.random() * 100,
                    y: -10,
                    color: goldColors[Math.floor(Math.random() * goldColors.length)],
                    delay: Math.random() * 0.8,
                    duration: 1.5 + Math.random() * 1.5,
                    size: 8 + Math.random() * 10,
                    type: "drop",
                    rotation: 0,
                });
            }

            // Sparks from center explosion
            for (let i = 25; i < 55; i++) {
                const angle = (i - 25) * (360 / 30);
                generatedParticles.push({
                    id: i,
                    x: 50,
                    y: 50,
                    color: [...goldColors, ...accentColors][Math.floor(Math.random() * (goldColors.length + accentColors.length))],
                    delay: 0.2 + Math.random() * 0.2,
                    duration: 0.6 + Math.random() * 0.4,
                    size: 3 + Math.random() * 4,
                    type: "spark",
                    rotation: angle,
                });
            }

            // Glowing orbs
            for (let i = 55; i < 70; i++) {
                generatedParticles.push({
                    id: i,
                    x: 30 + Math.random() * 40,
                    y: 30 + Math.random() * 40,
                    color: goldColors[Math.floor(Math.random() * goldColors.length)],
                    delay: 0.5 + Math.random() * 0.3,
                    duration: 1.5 + Math.random() * 1,
                    size: 10 + Math.random() * 15,
                    type: "glow",
                    rotation: 0,
                });
            }

            // Confetti pieces
            for (let i = 70; i < 110; i++) {
                generatedParticles.push({
                    id: i,
                    x: Math.random() * 100,
                    y: -5,
                    color: [...goldColors, "#000000", "#1a1a1a"][Math.floor(Math.random() * (goldColors.length + 2))],
                    delay: Math.random() * 1.2,
                    duration: 2.5 + Math.random() * 2,
                    size: 5 + Math.random() * 8,
                    type: "confetti",
                    rotation: Math.random() * 360,
                });
            }

            setParticles(generatedParticles);

            // Glitch effect cycling
            const glitchInterval = setInterval(() => {
                setGlitchPhase(p => (p + 1) % 4);
            }, 80);

            // Stop glitch after initial burst
            setTimeout(() => {
                clearInterval(glitchInterval);
                setGlitchPhase(0);
            }, 1200);

            // Hide rings after explosion
            setTimeout(() => setShowRings(false), 1000);

            // Hide after animation
            const timeout = setTimeout(() => {
                setVisible(false);
                onComplete?.();
            }, 5000);

            return () => {
                clearTimeout(timeout);
                clearInterval(glitchInterval);
            };
        }
    }, [show, onComplete]);

    if (!visible) return null;

    const glitchOffset = glitchPhase > 0 ? {
        transform: `translate(${(glitchPhase % 2 === 0 ? -1 : 1) * (glitchPhase * 2)}px, ${(glitchPhase % 2 === 1 ? -1 : 1) * glitchPhase}px)`,
    } : {};

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 10000,
                pointerEvents: "none",
                overflow: "hidden",
                animation: "firstblood-shake 0.25s ease-out",
            }}
        >
            {/* Premium dark overlay with gold gradient */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: "radial-gradient(circle at center, rgba(250, 204, 21, 0.08) 0%, rgba(0, 0, 0, 0.85) 70%)",
                    animation: "firstblood-flash 0.4s ease-out",
                }}
            />

            {/* Gold expanding rings from center */}
            {showRings && (
                <>
                    {[1, 2, 3, 4].map((ring) => (
                        <div
                            key={ring}
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                width: "20px",
                                height: "20px",
                                borderRadius: "50%",
                                border: `${ring === 1 ? 3 : 2}px solid rgba(250, 204, 21, ${1 - ring * 0.2})`,
                                transform: "translate(-50%, -50%)",
                                animation: `firstblood-ring 0.8s ease-out ${ring * 0.1}s forwards`,
                                boxShadow: "0 0 30px rgba(250, 204, 21, 0.4)",
                            }}
                        />
                    ))}
                </>
            )}

            {/* Particles */}
            {particles.map((p) => (
                <div
                    key={p.id}
                    style={{
                        position: "absolute",
                        left: `${p.x}%`,
                        top: p.type === "spark" || p.type === "glow" ? `${p.y}%` : "-20px",
                        width: `${p.size}px`,
                        height: p.type === "drop" ? `${p.size * 1.4}px` : `${p.size}px`,
                        backgroundColor: p.color,
                        borderRadius: p.type === "drop"
                            ? "50% 50% 50% 50% / 60% 60% 40% 40%"
                            : p.type === "spark" || p.type === "glow"
                                ? "50%"
                                : "2px",
                        animation: p.type === "drop"
                            ? `firstblood-drip ${p.duration}s ease-in ${p.delay}s forwards`
                            : p.type === "spark"
                                ? `firstblood-spark ${p.duration}s ease-out ${p.delay}s forwards`
                                : p.type === "glow"
                                    ? `firstblood-glow-particle ${p.duration}s ease-in-out ${p.delay}s forwards`
                                    : `firstblood-fall ${p.duration}s linear ${p.delay}s forwards`,
                        boxShadow: p.type === "drop"
                            ? `0 0 ${p.size}px ${p.color}`
                            : p.type === "spark"
                                ? `0 0 8px ${p.color}`
                                : p.type === "glow"
                                    ? `0 0 ${p.size * 2}px ${p.color}, 0 0 ${p.size * 3}px ${p.color}`
                                    : "none",
                        transform: p.type === "spark"
                            ? `translate(-50%, -50%) rotate(${p.rotation}deg)`
                            : `rotate(${p.rotation}deg)`,
                        opacity: p.type === "glow" ? 0.6 : 1,
                    }}
                />
            ))}

            {/* First Blood Banner */}
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    textAlign: "center",
                    animation: "firstblood-pulse 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    ...glitchOffset,
                }}
            >
                {/* Premium icon container */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "16px",
                        marginBottom: "16px",
                    }}
                >
                    <Droplets
                        size={32}
                        style={{
                            color: "var(--yellow)",
                            filter: "drop-shadow(0 0 15px rgba(250, 204, 21, 0.8))",
                            animation: "firstblood-icon-float 2s ease-in-out infinite alternate",
                        }}
                    />
                    <div
                        style={{
                            width: "80px",
                            height: "80px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #facc15 0%, #f59e0b 50%, #d97706 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 0 40px rgba(250, 204, 21, 0.6), 0 0 80px rgba(250, 204, 21, 0.3), inset 0 2px 4px rgba(255,255,255,0.3)",
                            animation: "firstblood-icon-pulse 1s ease-in-out infinite alternate",
                        }}
                    >
                        <Skull size={44} style={{ color: "#000000" }} />
                    </div>
                    <Droplets
                        size={32}
                        style={{
                            color: "var(--yellow)",
                            filter: "drop-shadow(0 0 15px rgba(250, 204, 21, 0.8))",
                            animation: "firstblood-icon-float 2s ease-in-out infinite alternate-reverse",
                        }}
                    />
                </div>

                {/* Main text with glitch layers */}
                <div style={{ position: "relative", display: "inline-block" }}>
                    {/* Glitch layers */}
                    {glitchPhase > 0 && (
                        <>
                            <h1
                                style={{
                                    position: "absolute",
                                    fontFamily: "var(--font-heading)",
                                    fontSize: "clamp(2.5rem, 8vw, 5rem)",
                                    fontWeight: 900,
                                    color: "#ffffff",
                                    textShadow: "none",
                                    margin: 0,
                                    left: "-2px",
                                    top: "1px",
                                    clipPath: "polygon(0 0, 100% 0, 100% 45%, 0 45%)",
                                    opacity: 0.5,
                                }}
                            >
                                FIRST BLOOD
                            </h1>
                            <h1
                                style={{
                                    position: "absolute",
                                    fontFamily: "var(--font-heading)",
                                    fontSize: "clamp(2.5rem, 8vw, 5rem)",
                                    fontWeight: 900,
                                    color: "#d97706",
                                    textShadow: "none",
                                    margin: 0,
                                    left: "2px",
                                    top: "-1px",
                                    clipPath: "polygon(0 55%, 100% 55%, 100% 100%, 0 100%)",
                                    opacity: 0.6,
                                }}
                            >
                                FIRST BLOOD
                            </h1>
                        </>
                    )}

                    {/* Main text */}
                    <h1
                        style={{
                            fontFamily: "var(--font-heading)",
                            fontSize: "clamp(2.5rem, 8vw, 5rem)",
                            fontWeight: 900,
                            background: "linear-gradient(180deg, #fef3c7 0%, #facc15 30%, #f59e0b 70%, #d97706 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                            filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
                            marginBottom: "12px",
                            animation: "firstblood-text-glow 1.5s ease-in-out infinite alternate",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                        }}
                    >
                        First Blood
                    </h1>
                </div>

                {/* Decorative line */}
                <div
                    style={{
                        width: "200px",
                        height: "2px",
                        background: "linear-gradient(90deg, transparent 0%, var(--yellow) 50%, transparent 100%)",
                        margin: "0 auto 16px",
                        animation: "firstblood-line-expand 0.5s ease-out 0.3s both",
                    }}
                />

                {challengeTitle && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            marginBottom: "12px",
                            animation: "firstblood-fadeIn 0.5s ease-out 0.3s both",
                        }}
                    >
                        <Trophy size={18} style={{ color: "var(--yellow)" }} />
                        <p
                            style={{
                                fontSize: "1.3rem",
                                color: "var(--yellow)",
                                fontWeight: 600,
                                fontFamily: "var(--font-heading)",
                                margin: 0,
                            }}
                        >
                            {challengeTitle}
                        </p>
                    </div>
                )}
                {teamName && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            animation: "firstblood-fadeIn 0.5s ease-out 0.5s both",
                        }}
                    >
                        <Crown size={16} style={{ color: "rgba(250, 204, 21, 0.7)" }} />
                        <p
                            style={{
                                fontSize: "1rem",
                                color: "rgba(255, 255, 255, 0.7)",
                                fontWeight: 500,
                                margin: 0,
                            }}
                        >
                            Claimed by <span style={{ color: "var(--yellow)", fontWeight: 700 }}>{teamName}</span>
                        </p>
                    </div>
                )}
            </div>

            {/* Floating icons decoration */}
            <div style={{ position: "absolute", top: "15%", left: "10%", animation: "firstblood-float-icon 3s ease-in-out infinite" }}>
                <Sparkles size={24} style={{ color: "rgba(250, 204, 21, 0.4)" }} />
            </div>
            <div style={{ position: "absolute", top: "20%", right: "15%", animation: "firstblood-float-icon 3s ease-in-out infinite 0.5s" }}>
                <Zap size={28} style={{ color: "rgba(250, 204, 21, 0.3)" }} />
            </div>
            <div style={{ position: "absolute", bottom: "25%", left: "8%", animation: "firstblood-float-icon 3s ease-in-out infinite 1s" }}>
                <Zap size={20} style={{ color: "rgba(250, 204, 21, 0.35)" }} />
            </div>
            <div style={{ position: "absolute", bottom: "20%", right: "12%", animation: "firstblood-float-icon 3s ease-in-out infinite 1.5s" }}>
                <Sparkles size={22} style={{ color: "rgba(250, 204, 21, 0.4)" }} />
            </div>

            {/* CSS Animation Styles */}
            <style jsx>{`
                @keyframes firstblood-shake {
                    0%, 100% { transform: translate(0, 0); }
                    10% { transform: translate(-4px, -2px); }
                    20% { transform: translate(4px, 2px); }
                    30% { transform: translate(-2px, 1px); }
                    40% { transform: translate(2px, -1px); }
                    50% { transform: translate(-1px, 1px); }
                }

                @keyframes firstblood-flash {
                    0% { opacity: 0; background: rgba(250, 204, 21, 0.25); }
                    15% { opacity: 1; background: rgba(250, 204, 21, 0.15); }
                    100% { opacity: 1; }
                }

                @keyframes firstblood-ring {
                    0% {
                        width: 20px;
                        height: 20px;
                        opacity: 1;
                    }
                    100% {
                        width: 120vw;
                        height: 120vw;
                        opacity: 0;
                    }
                }

                @keyframes firstblood-drip {
                    0% {
                        transform: translateY(0) scale(1);
                        opacity: 1;
                    }
                    80% { opacity: 0.8; }
                    100% {
                        transform: translateY(110vh) scale(0.7);
                        opacity: 0;
                    }
                }

                @keyframes firstblood-spark {
                    0% {
                        transform: translate(-50%, -50%) translateX(0);
                        opacity: 1;
                        scale: 1;
                    }
                    100% {
                        transform: translate(-50%, -50%) translateX(35vw);
                        opacity: 0;
                        scale: 0.3;
                    }
                }

                @keyframes firstblood-glow-particle {
                    0% {
                        transform: scale(0);
                        opacity: 0;
                    }
                    30% {
                        transform: scale(1.2);
                        opacity: 0.8;
                    }
                    100% {
                        transform: scale(0.5);
                        opacity: 0;
                    }
                }

                @keyframes firstblood-fall {
                    0% {
                        transform: translateY(-20px) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(110vh) rotate(720deg);
                        opacity: 0;
                    }
                }

                @keyframes firstblood-pulse {
                    0% {
                        transform: translate(-50%, -50%) scale(0);
                        opacity: 0;
                    }
                    60% {
                        transform: translate(-50%, -50%) scale(1.08);
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 1;
                    }
                }

                @keyframes firstblood-text-glow {
                    0% {
                        filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5)) drop-shadow(0 0 20px rgba(250, 204, 21, 0.3));
                    }
                    100% {
                        filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5)) drop-shadow(0 0 40px rgba(250, 204, 21, 0.6));
                    }
                }

                @keyframes firstblood-icon-pulse {
                    0% {
                        transform: scale(1);
                        box-shadow: 0 0 40px rgba(250, 204, 21, 0.6), 0 0 80px rgba(250, 204, 21, 0.3), inset 0 2px 4px rgba(255,255,255,0.3);
                    }
                    100% {
                        transform: scale(1.05);
                        box-shadow: 0 0 60px rgba(250, 204, 21, 0.8), 0 0 100px rgba(250, 204, 21, 0.4), inset 0 2px 4px rgba(255,255,255,0.3);
                    }
                }

                @keyframes firstblood-icon-float {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(-8px); }
                }

                @keyframes firstblood-fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes firstblood-line-expand {
                    from {
                        width: 0;
                        opacity: 0;
                    }
                    to {
                        width: 200px;
                        opacity: 1;
                    }
                }

                @keyframes firstblood-float-icon {
                    0%, 100% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 0.3;
                    }
                    50% {
                        transform: translateY(-15px) rotate(10deg);
                        opacity: 0.5;
                    }
                }
            `}</style>
        </div>
    );
}
