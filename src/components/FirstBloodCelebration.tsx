"use client";

import { useEffect, useState } from "react";

interface ConfettiPiece {
    id: number;
    x: number;
    color: string;
    delay: number;
    duration: number;
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
    const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (show) {
            setVisible(true);

            // Generate confetti pieces
            const colors = ["#facc15", "#ef4444", "#22c55e", "#3b82f6", "#f97316", "#a855f7"];
            const pieces: ConfettiPiece[] = [];

            for (let i = 0; i < 50; i++) {
                pieces.push({
                    id: i,
                    x: Math.random() * 100,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    delay: Math.random() * 0.5,
                    duration: 2 + Math.random() * 2,
                });
            }
            setConfetti(pieces);

            // Hide after animation
            const timeout = setTimeout(() => {
                setVisible(false);
                onComplete?.();
            }, 5000);

            return () => clearTimeout(timeout);
        }
    }, [show, onComplete]);

    if (!visible) return null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 10000,
                pointerEvents: "none",
                overflow: "hidden",
            }}
        >
            {/* Confetti */}
            {confetti.map((piece) => (
                <div
                    key={piece.id}
                    style={{
                        position: "absolute",
                        top: "-20px",
                        left: `${piece.x}%`,
                        width: "10px",
                        height: "10px",
                        backgroundColor: piece.color,
                        borderRadius: piece.id % 2 === 0 ? "50%" : "2px",
                        animation: `confetti-fall ${piece.duration}s linear ${piece.delay}s forwards`,
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
                    animation: "firstblood-pulse 0.5s ease-out",
                }}
            >
                <div
                    style={{
                        fontSize: "4rem",
                        marginBottom: "16px",
                    }}
                >
                    🩸
                </div>
                <h1
                    style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "clamp(2rem, 6vw, 4rem)",
                        fontWeight: 900,
                        color: "#ef4444",
                        textShadow: "0 0 30px rgba(239, 68, 68, 0.5)",
                        marginBottom: "16px",
                        animation: "firstblood-glow 1s ease-in-out infinite alternate",
                    }}
                >
                    FIRST BLOOD!
                </h1>
                {challengeTitle && (
                    <p
                        style={{
                            fontSize: "1.25rem",
                            color: "var(--yellow)",
                            marginBottom: "8px",
                        }}
                    >
                        {challengeTitle}
                    </p>
                )}
                {teamName && (
                    <p
                        style={{
                            fontSize: "1rem",
                            color: "var(--text-secondary)",
                        }}
                    >
                        Claimed by {teamName}
                    </p>
                )}
            </div>

            {/* CSS Animation Styles */}
            <style jsx>{`
                @keyframes confetti-fall {
                    0% {
                        transform: translateY(-20px) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }

                @keyframes firstblood-pulse {
                    0% {
                        transform: translate(-50%, -50%) scale(0.5);
                        opacity: 0;
                    }
                    50% {
                        transform: translate(-50%, -50%) scale(1.1);
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 1;
                    }
                }

                @keyframes firstblood-glow {
                    0% {
                        text-shadow: 0 0 30px rgba(239, 68, 68, 0.5);
                    }
                    100% {
                        text-shadow: 0 0 60px rgba(239, 68, 68, 0.8),
                            0 0 90px rgba(239, 68, 68, 0.4);
                    }
                }
            `}</style>
        </div>
    );
}
