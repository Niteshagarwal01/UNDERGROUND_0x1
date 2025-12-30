"use client";

import { useState, useCallback } from "react";

interface Particle {
    id: number;
    x: number;
    y: number;
    color: string;
    rotation: number;
    scale: number;
    velocityX: number;
    velocityY: number;
}

const COLORS = ["#facc15", "#f97316", "#ef4444", "#22c55e", "#3b82f6", "#a855f7"];

export function useConfetti() {
    const [particles, setParticles] = useState<Particle[]>([]);
    const [isActive, setIsActive] = useState(false);

    const trigger = useCallback((x?: number, y?: number) => {
        const centerX = x ?? window.innerWidth / 2;
        const centerY = y ?? window.innerHeight / 3;

        const newParticles: Particle[] = [];
        for (let i = 0; i < 50; i++) {
            newParticles.push({
                id: Date.now() + i,
                x: centerX,
                y: centerY,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                rotation: Math.random() * 360,
                scale: 0.5 + Math.random() * 0.5,
                velocityX: (Math.random() - 0.5) * 20,
                velocityY: Math.random() * -15 - 5,
            });
        }

        setParticles(newParticles);
        setIsActive(true);

        // Clean up after animation
        setTimeout(() => {
            setIsActive(false);
            setParticles([]);
        }, 3000);
    }, []);

    return { particles, isActive, trigger };
}

interface ConfettiProps {
    particles: Particle[];
    isActive: boolean;
}

export function ConfettiCanvas({ particles, isActive }: ConfettiProps) {
    if (!isActive) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                pointerEvents: "none",
                zIndex: 9999,
                overflow: "hidden",
            }}
        >
            {particles.map((particle) => (
                <div
                    key={particle.id}
                    style={{
                        position: "absolute",
                        left: particle.x,
                        top: particle.y,
                        width: "10px",
                        height: "10px",
                        background: particle.color,
                        transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
                        animation: `confetti-fall 2.5s ease-out forwards`,
                        animationDelay: `${Math.random() * 0.2}s`,
                        borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                        // Add velocity as custom properties for the animation
                        ["--vx" as string]: `${particle.velocityX * 10}px`,
                        ["--vy" as string]: `${particle.velocityY * -20}px`,
                    }}
                />
            ))}

            <style jsx>{`
                @keyframes confetti-fall {
                    0% {
                        opacity: 1;
                        transform: translate(0, 0) rotate(0deg);
                    }
                    100% {
                        opacity: 0;
                        transform: translate(var(--vx), calc(100vh - var(--vy))) rotate(720deg);
                    }
                }
            `}</style>
        </div>
    );
}

// Success flash effect for flag submission
export function SuccessFlash({ show }: { show: boolean }) {
    if (!show) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                background: "radial-gradient(circle at center, rgba(34, 197, 94, 0.3) 0%, transparent 70%)",
                pointerEvents: "none",
                zIndex: 9998,
                animation: "flash-fade 0.5s ease-out forwards",
            }}
        >
            <style jsx>{`
                @keyframes flash-fade {
                    0% {
                        opacity: 1;
                    }
                    100% {
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
}

// Hover card animation styles
export const cardHoverStyles = {
    transition: "all 0.2s ease-out",
    cursor: "pointer",
};

export const cardHoverActive = {
    transform: "translateY(-2px)",
    boxShadow: "0 8px 30px rgba(250, 204, 21, 0.15)",
    borderColor: "rgba(250, 204, 21, 0.5)",
};

// Pulse animation for notifications
export function PulseRing({ color = "#facc15" }: { color?: string }) {
    return (
        <>
            <span
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    border: `2px solid ${color}`,
                    animation: "pulse-ring 1.5s ease-out infinite",
                }}
            />
            <style jsx>{`
                @keyframes pulse-ring {
                    0% {
                        transform: scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(1.5);
                        opacity: 0;
                    }
                }
            `}</style>
        </>
    );
}

// Typing cursor animation
export function TypingCursor() {
    return (
        <span
            style={{
                display: "inline-block",
                width: "2px",
                height: "1em",
                background: "#facc15",
                marginLeft: "2px",
                animation: "blink-cursor 0.8s infinite",
            }}
        >
            <style jsx>{`
                @keyframes blink-cursor {
                    0%, 50% {
                        opacity: 1;
                    }
                    51%, 100% {
                        opacity: 0;
                    }
                }
            `}</style>
        </span>
    );
}
