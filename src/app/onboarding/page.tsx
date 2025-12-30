"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Train, Users, Target, Shield, ChevronRight, Check, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";

const steps = [
    {
        id: 1,
        title: "Welcome, Operative",
        description: "You've been selected to join UNDERGROUND_0x1, an elite cybersecurity operation simulating a Delhi Metro systems compromise.",
        icon: Train,
    },
    {
        id: 2,
        title: "Form Your Cell",
        description: "Create or join a team of up to 4 operatives. Teams compete together, and points are shared. Choose your allies wisely.",
        icon: Users,
    },
    {
        id: 3,
        title: "Engage Targets",
        description: "Solve challenges across 5 categories: OSINT, Forensics, Cryptography, Reverse Engineering, and Web Security. No hints provided.",
        icon: Target,
    },
    {
        id: 4,
        title: "Capture Flags",
        description: "Submit flags in the format UG0x1{...} to earn points. First blood bonuses are awarded to the first teams to solve each challenge.",
        icon: Shield,
    },
];

export default function OnboardingPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [completing, setCompleting] = useState(false);

    useEffect(() => {
        if (isLoaded && !user) {
            router.push("/enter");
        }
    }, [isLoaded, user, router]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = async () => {
        setCompleting(true);
        // Small delay for visual feedback
        await new Promise(resolve => setTimeout(resolve, 500));
        router.push("/dashboard");
        router.refresh(); // Refresh to sync auth state across UI
    };

    if (!isLoaded || !user) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 size={32} className="spinner text-yellow" />
            </div>
        );
    }

    const CurrentIcon = steps[currentStep].icon;

    return (
        <div className="min-h-screen bg-black grid-pattern">
            <Navbar />

            <div style={{
                minHeight: 'calc(100vh - var(--nav-height))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 24px'
            }}>
                <div style={{ maxWidth: '600px', width: '100%' }}>
                    {/* Progress Dots */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '12px',
                        marginBottom: '48px'
                    }}>
                        {steps.map((step, i) => (
                            <div
                                key={step.id}
                                style={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    background: i === currentStep
                                        ? 'var(--yellow)'
                                        : i < currentStep
                                            ? 'rgba(250, 204, 21, 0.5)'
                                            : 'var(--black-border)',
                                    transition: 'all 0.3s ease',
                                }}
                            />
                        ))}
                    </div>

                    {/* Card */}
                    <div className="card card-elevated" style={{
                        textAlign: 'center',
                        padding: '60px 48px',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Glow effect */}
                        <div style={{
                            position: 'absolute',
                            top: '-50%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '400px',
                            height: '400px',
                            background: 'radial-gradient(circle, rgba(250, 204, 21, 0.08) 0%, transparent 70%)',
                            pointerEvents: 'none',
                        }} />

                        {/* Icon */}
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '16px',
                            background: 'rgba(250, 204, 21, 0.1)',
                            border: '1px solid rgba(250, 204, 21, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 32px',
                        }}>
                            <CurrentIcon size={36} style={{ color: 'var(--yellow)' }} />
                        </div>

                        {/* Step Counter */}
                        <div style={{
                            fontSize: '12px',
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.2em',
                            marginBottom: '16px'
                        }}>
                            Step {currentStep + 1} of {steps.length}
                        </div>

                        {/* Title */}
                        <h1 style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: '2rem',
                            fontWeight: 700,
                            marginBottom: '16px',
                            color: 'var(--text-primary)'
                        }}>
                            {steps[currentStep].title}
                        </h1>

                        {/* Description */}
                        <p style={{
                            color: 'var(--text-secondary)',
                            fontSize: '16px',
                            lineHeight: '1.8',
                            marginBottom: '48px',
                            maxWidth: '450px',
                            margin: '0 auto 48px'
                        }}>
                            {steps[currentStep].description}
                        </p>

                        {/* Button */}
                        <button
                            onClick={handleNext}
                            disabled={completing}
                            className="btn btn-primary btn-lg"
                            style={{ minWidth: '200px' }}
                        >
                            {completing ? (
                                <>
                                    <Loader2 size={18} className="spinner" />
                                    Entering...
                                </>
                            ) : currentStep === steps.length - 1 ? (
                                <>
                                    <Check size={18} />
                                    Enter Dashboard
                                </>
                            ) : (
                                <>
                                    Continue
                                    <ChevronRight size={18} />
                                </>
                            )}
                        </button>

                        {/* Skip Link */}
                        {currentStep < steps.length - 1 && (
                            <button
                                onClick={handleComplete}
                                style={{
                                    display: 'block',
                                    margin: '24px auto 0',
                                    color: 'var(--text-muted)',
                                    fontSize: '13px',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                Skip intro →
                            </button>
                        )}
                    </div>

                    {/* Welcome message */}
                    <p style={{
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        fontSize: '13px',
                        marginTop: '32px'
                    }}>
                        Welcome, {user.firstName || user.username || "Operative"}. Your mission awaits.
                    </p>
                </div>
            </div>
        </div>
    );
}
