"use client";

import { useEffect, useState } from "react";

interface Particle {
    id: number;
    x: number;
    y: number;
    color: string;
    delay: number;
    duration: number;
    size: number;
    type: "confetti" | "blood" | "spark";
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

            // Generate particles - mix of blood drops, confetti, and sparks
            const bloodColors = ["#ef4444", "#dc2626", "#b91c1c", "#991b1b", "#7f1d1d"];
            const sparkColors = ["#facc15", "#fbbf24", "#f59e0b", "#ffffff"];
            const generatedParticles: Particle[] = [];

            // Blood drops from top
            for (let i = 0; i < 30; i++) {
                generatedParticles.push({
                    id: i,
                    x: Math.random() * 100,
                    y: -10,
                    color: bloodColors[Math.floor(Math.random() * bloodColors.length)],
                    delay: Math.random() * 0.8,
                    duration: 1.5 + Math.random() * 1.5,
                    size: 8 + Math.random() * 12,
                    type: "blood",
                    rotation: 0,
                });
            }

            // Sparks from center explosion
            for (let i = 30; i < 60; i++) {
                const angle = (i - 30) * (360 / 30);
                generatedParticles.push({
                    id: i,
                    x: 50,
                    y: 50,
                    color: sparkColors[Math.floor(Math.random() * sparkColors.length)],
                    delay: 0.3 + Math.random() * 0.2,
                    duration: 0.8 + Math.random() * 0.5,
                    size: 4 + Math.random() * 4,
                    type: "spark",
                    rotation: angle,
                });
            }

            // Confetti pieces
            for (let i = 60; i < 100; i++) {
                generatedParticles.push({
                    id: i,
                    x: Math.random() * 100,
                    y: -5,
                    color: [...bloodColors, ...sparkColors][Math.floor(Math.random() * (bloodColors.length + sparkColors.length))],
                    delay: Math.random() * 1,
                    duration: 2.5 + Math.random() * 2,
                    size: 6 + Math.random() * 8,
                    type: "confetti",
                    rotation: Math.random() * 360,
                });
            }

            setParticles(generatedParticles);

            // Glitch effect cycling
            const glitchInterval = setInterval(() => {
                setGlitchPhase(p => (p + 1) % 4);
            }, 100);

            // Stop glitch after initial burst
            setTimeout(() => {
                clearInterval(glitchInterval);
                setGlitchPhase(0);
            }, 1500);

            // Hide rings after explosion
            setTimeout(() => setShowRings(false), 1200);

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
                animation: "firstblood-shake 0.3s ease-out",
            }}
        >
            {/* Dark overlay with red tint */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: "radial-gradient(circle at center, rgba(239, 68, 68, 0.15) 0%, rgba(0, 0, 0, 0.5) 100%)",
                    animation: "firstblood-flash 0.5s ease-out",
                }}
            />

            {/* Expanding rings from center */}
            {showRings && (
                <>
                    {[1, 2, 3].map((ring) => (
                        <div
                            key={ring}
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                width: "20px",
                                height: "20px",
                                borderRadius: "50%",
                                border: "2px solid rgba(239, 68, 68, 0.8)",
                                transform: "translate(-50%, -50%)",
                                animation: `firstblood-ring 1s ease-out ${ring * 0.15}s forwards`,
                                boxShadow: "0 0 20px rgba(239, 68, 68, 0.5)",
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
                        top: p.type === "spark" ? `${p.y}%` : "-20px",
                        width: `${p.size}px`,
                        height: p.type === "blood" ? `${p.size * 1.5}px` : `${p.size}px`,
                        backgroundColor: p.color,
                        borderRadius: p.type === "blood" ? "50% 50% 50% 50% / 60% 60% 40% 40%" : p.type === "spark" ? "50%" : "2px",
                        animation: p.type === "blood"
                            ? `firstblood-drip ${p.duration}s ease-in ${p.delay}s forwards`
                            : p.type === "spark"
                                ? `firstblood-spark ${p.duration}s ease-out ${p.delay}s forwards`
                                : `firstblood-fall ${p.duration}s linear ${p.delay}s forwards`,
                        boxShadow: p.type === "blood"
                            ? `0 0 ${p.size / 2}px ${p.color}`
                            : p.type === "spark"
                                ? `0 0 10px ${p.color}`
                                : "none",
                        transform: p.type === "spark"
                            ? `translate(-50%, -50%) rotate(${p.rotation}deg)`
                            : `rotate(${p.rotation}deg)`,
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
                    animation: "firstblood-pulse 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    ...glitchOffset,
                }}
            >
                {/* Skull icon */}
                <div
                    style={{
                        fontSize: "4rem",
                        marginBottom: "12px",
                        filter: "drop-shadow(0 0 20px rgba(239, 68, 68, 0.8))",
                        animation: "firstblood-icon-pulse 1s ease-in-out infinite alternate",
                    }}
                >
                    💀
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
                                    color: "#22d3ee",
                                    textShadow: "none",
                                    margin: 0,
                                    left: "-3px",
                                    top: "1px",
                                    clipPath: "polygon(0 0, 100% 0, 100% 45%, 0 45%)",
                                    opacity: 0.7,
                                }}
                            >
                                FIRST BLOOD!
                            </h1>
                            <h1
                                style={{
                                    position: "absolute",
                                    fontFamily: "var(--font-heading)",
                                    fontSize: "clamp(2.5rem, 8vw, 5rem)",
                                    fontWeight: 900,
                                    color: "#facc15",
                                    textShadow: "none",
                                    margin: 0,
                                    left: "3px",
                                    top: "-1px",
                                    clipPath: "polygon(0 55%, 100% 55%, 100% 100%, 0 100%)",
                                    opacity: 0.7,
                                }}
                            >
                                FIRST BLOOD!
                            </h1>
                        </>
                    )}

                    {/* Main text */}
                    <h1
                        style={{
                            fontFamily: "var(--font-heading)",
                            fontSize: "clamp(2.5rem, 8vw, 5rem)",
                            fontWeight: 900,
                            color: "#ef4444",
                            textShadow: `
                                0 0 30px rgba(239, 68, 68, 0.8),
                                0 0 60px rgba(239, 68, 68, 0.5),
                                0 0 100px rgba(239, 68, 68, 0.3),
                                0 4px 0 #7f1d1d
                            `,
                            marginBottom: "16px",
                            animation: "firstblood-glow 1s ease-in-out infinite alternate",
                            letterSpacing: "0.05em",
                            WebkitTextStroke: "1px rgba(0,0,0,0.3)",
                        }}
                    >
                        FIRST BLOOD!
                    </h1>
                </div>

                {challengeTitle && (
                    <p
                        style={{
                            fontSize: "1.4rem",
                            color: "var(--yellow)",
                            marginBottom: "8px",
                            fontWeight: 600,
                            fontFamily: "var(--font-heading)",
                            textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                            animation: "firstblood-fadeIn 0.5s ease-out 0.3s both",
                        }}
                    >
                        {challengeTitle}
                    </p>
                )}
                {teamName && (
                    <p
                        style={{
                            fontSize: "1.1rem",
                            color: "rgba(255, 255, 255, 0.8)",
                            fontWeight: 500,
                            animation: "firstblood-fadeIn 0.5s ease-out 0.5s both",
                        }}
                    >
                        Claimed by <span style={{ color: "var(--yellow)", fontWeight: 700 }}>{teamName}</span>
                    </p>
                )}
            </div>

            {/* CSS Animation Styles */}
            <style jsx>{`
                @keyframes firstblood-shake {
                    0%, 100% { transform: translate(0, 0); }
                    10% { transform: translate(-5px, -3px); }
                    20% { transform: translate(5px, 3px); }
                    30% { transform: translate(-3px, 2px); }
                    40% { transform: translate(3px, -2px); }
                    50% { transform: translate(-2px, 1px); }
                    60% { transform: translate(2px, -1px); }
                    70% { transform: translate(-1px, 1px); }
                    80% { transform: translate(1px, 0); }
                }

                @keyframes firstblood-flash {
                    0% { opacity: 0; background: rgba(239, 68, 68, 0.4); }
                    20% { opacity: 1; background: rgba(239, 68, 68, 0.3); }
                    100% { opacity: 1; background: radial-gradient(circle at center, rgba(239, 68, 68, 0.15) 0%, rgba(0, 0, 0, 0.5) 100%); }
                }

                @keyframes firstblood-ring {
                    0% {
                        width: 20px;
                        height: 20px;
                        opacity: 1;
                        border-width: 3px;
                    }
                    100% {
                        width: 150vw;
                        height: 150vw;
                        opacity: 0;
                        border-width: 1px;
                    }
                }

                @keyframes firstblood-drip {
                    0% {
                        transform: translateY(0) scale(1);
                        opacity: 1;
                    }
                    70% {
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(120vh) scale(0.8);
                        opacity: 0;
                    }
                }

                @keyframes firstblood-spark {
                    0% {
                        transform: translate(-50%, -50%) rotate(var(--rotation, 0deg)) translateX(0);
                        opacity: 1;
                        scale: 1;
                    }
                    100% {
                        transform: translate(-50%, -50%) rotate(var(--rotation, 0deg)) translateX(40vw);
                        opacity: 0;
                        scale: 0.5;
                    }
                }

                @keyframes firstblood-fall {
                    0% {
                        transform: translateY(-20px) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(110vh) rotate(1080deg);
                        opacity: 0;
                    }
                }

                @keyframes firstblood-pulse {
                    0% {
                        transform: translate(-50%, -50%) scale(0);
                        opacity: 0;
                    }
                    50% {
                        transform: translate(-50%, -50%) scale(1.15);
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 1;
                    }
                }

                @keyframes firstblood-glow {
                    0% {
                        text-shadow: 
                            0 0 30px rgba(239, 68, 68, 0.8),
                            0 0 60px rgba(239, 68, 68, 0.5),
                            0 0 100px rgba(239, 68, 68, 0.3),
                            0 4px 0 #7f1d1d;
                    }
                    100% {
                        text-shadow: 
                            0 0 40px rgba(239, 68, 68, 1),
                            0 0 80px rgba(239, 68, 68, 0.7),
                            0 0 120px rgba(239, 68, 68, 0.5),
                            0 0 160px rgba(239, 68, 68, 0.3),
                            0 4px 0 #7f1d1d;
                    }
                }

                @keyframes firstblood-icon-pulse {
                    0% {
                        transform: scale(1);
                        filter: drop-shadow(0 0 20px rgba(239, 68, 68, 0.8));
                    }
                    100% {
                        transform: scale(1.1);
                        filter: drop-shadow(0 0 40px rgba(239, 68, 68, 1));
                    }
                }

                @keyframes firstblood-fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}

