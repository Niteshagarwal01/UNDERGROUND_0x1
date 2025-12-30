"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface TerminalFlagSubmitProps {
    challengeId: string;
    onSuccess: (isFirstBlood: boolean) => void;
    disabled?: boolean;
}

export default function TerminalFlagSubmit({
    challengeId,
    onSuccess,
    disabled = false,
}: TerminalFlagSubmitProps) {
    const [flag, setFlag] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<{
        success: boolean;
        message: string;
        isFirstBlood?: boolean;
    } | null>(null);
    const [terminalLines, setTerminalLines] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const terminalRef = useRef<HTMLDivElement>(null);

    // Auto-scroll terminal to bottom when new lines are added
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [terminalLines]);

    // Focus input on mount
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const addLineInstant = (text: string) => {
        setTerminalLines(prev => [...prev, text]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting || !flag.trim() || disabled) return;

        setSubmitting(true);
        setResult(null);
        setProgress(0);
        setTerminalLines([]);

        // Terminal animation sequence
        addLineInstant("root@occ:~$ submit_flag");
        await new Promise(r => setTimeout(r, 100));
        addLineInstant(`> Flag: ${flag}`);
        await new Promise(r => setTimeout(r, 150));
        addLineInstant("> Connecting to validation server...");
        await new Promise(r => setTimeout(r, 100));

        // Start progress bar animation
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 85) {
                    clearInterval(progressInterval);
                    return 85;
                }
                return prev + Math.random() * 15;
            });
        }, 100);

        addLineInstant("> Validating cryptographic signature...");

        try {
            const res = await fetch("/api/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ challengeId, flag }),
            });
            const data = await res.json();

            clearInterval(progressInterval);
            setProgress(100);

            await new Promise(r => setTimeout(r, 200));

            if (data.success) {
                addLineInstant(">");
                addLineInstant("> ████████████████████████████ 100%");
                await new Promise(r => setTimeout(r, 150));
                addLineInstant(">");
                addLineInstant("┌──────────────────────────────────────┐");
                addLineInstant("│  ✓ FLAG ACCEPTED                     │");
                if (data.isFirstBlood) {
                    addLineInstant("│  🩸 FIRST BLOOD BONUS!               │");
                }
                addLineInstant(`│  + ${data.points || 0} pts${data.bonusPoints ? ` (+${data.bonusPoints} bonus)` : ""}`.padEnd(40) + "│");
                addLineInstant("└──────────────────────────────────────┘");

                setResult(data);
                setFlag("");

                // Trigger success callback after animation
                setTimeout(() => {
                    onSuccess(data.isFirstBlood || false);
                }, 1000);
            } else {
                addLineInstant(">");
                addLineInstant("> ██████████░░░░░░░░░░░░░░░░░░ ERROR");
                await new Promise(r => setTimeout(r, 150));
                addLineInstant(">");
                addLineInstant("┌──────────────────────────────────────┐");
                addLineInstant("│  ✗ FLAG REJECTED                     │");
                addLineInstant(`│  ${(data.message || "Invalid flag").substring(0, 36)}`.padEnd(40) + "│");
                addLineInstant("└──────────────────────────────────────┘");
                setResult(data);
            }
        } catch (error) {
            clearInterval(progressInterval);
            addLineInstant("> Connection failed");
            addLineInstant("┌──────────────────────────────────────┐");
            addLineInstant("│  ✗ NETWORK ERROR                     │");
            addLineInstant("│  Please try again                    │");
            addLineInstant("└──────────────────────────────────────┘");
            setResult({ success: false, message: "Network error. Please try again." });
        } finally {
            setSubmitting(false);
            setProgress(0);
        }
    };

    return (
        <div
            style={{
                background: "#0a0a0a",
                border: "1px solid rgba(250, 204, 21, 0.3)",
                borderRadius: "8px",
                fontFamily: "'Courier New', Consolas, monospace",
                overflow: "hidden",
            }}
        >
            {/* Terminal Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 12px",
                    background: "rgba(250, 204, 21, 0.1)",
                    borderBottom: "1px solid rgba(250, 204, 21, 0.2)",
                }}
            >
                <div style={{ display: "flex", gap: "6px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444" }} />
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#facc15" }} />
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#22c55e" }} />
                </div>
                <span style={{ color: "#facc15", fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>
                    UNDERGROUND_0x1 — FLAG SUBMISSION
                </span>
            </div>

            {/* Terminal Body */}
            <div style={{ padding: "16px" }}>
                {/* Previous output */}
                {terminalLines.length > 0 && (
                    <div
                        ref={terminalRef}
                        style={{
                            marginBottom: "12px",
                            maxHeight: "200px",
                            overflowY: "auto",
                            fontSize: "13px",
                            lineHeight: "1.6",
                        }}
                    >
                        {terminalLines.map((line, i) => (
                            <div
                                key={i}
                                style={{
                                    color: line.includes("✓") || line.includes("ACCEPTED")
                                        ? "#22c55e"
                                        : line.includes("✗") || line.includes("REJECTED") || line.includes("ERROR")
                                            ? "#ef4444"
                                            : line.includes("FIRST BLOOD")
                                                ? "#facc15"
                                                : "#a1a1aa",
                                    whiteSpace: "pre",
                                    fontFamily: "'Courier New', Consolas, monospace",
                                }}
                            >
                                {line}
                            </div>
                        ))}
                    </div>
                )}

                {/* Progress bar during submission */}
                {submitting && progress > 0 && (
                    <div style={{ marginBottom: "12px" }}>
                        <div
                            style={{
                                height: "4px",
                                background: "#1a1a1a",
                                borderRadius: "2px",
                                overflow: "hidden",
                            }}
                        >
                            <div
                                style={{
                                    height: "100%",
                                    width: `${progress}%`,
                                    background: "#facc15",
                                    transition: "width 0.1s ease-out",
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Input area */}
                <form onSubmit={handleSubmit} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "#22c55e", fontSize: "13px", fontFamily: "'Courier New', Consolas, monospace" }}>
                        root@occ:~$
                    </span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={flag}
                        onChange={(e) => setFlag(e.target.value)}
                        placeholder="UG0x1{enter_flag_here}"
                        disabled={submitting || disabled}
                        style={{
                            flex: 1,
                            background: "transparent",
                            border: "none",
                            outline: "none",
                            color: "#ffffff",
                            fontSize: "13px",
                            fontFamily: "'Courier New', Consolas, monospace",
                            padding: "4px 0",
                            minWidth: 0,
                        }}
                        autoComplete="off"
                        spellCheck={false}
                        autoFocus
                    />
                    {submitting ? (
                        <Loader2 size={16} className="spinner" style={{ color: "#facc15", animation: "spin 1s linear infinite" }} />
                    ) : result ? (
                        result.success ? (
                            <CheckCircle size={16} style={{ color: "#22c55e" }} />
                        ) : (
                            <XCircle size={16} style={{ color: "#ef4444" }} />
                        )
                    ) : (
                        <span
                            style={{
                                width: "8px",
                                height: "16px",
                                background: "#facc15",
                                display: "inline-block",
                            }}
                        />
                    )}
                </form>

                {/* Hint */}
                {!submitting && !result && (
                    <p style={{ fontSize: "11px", color: "#71717a", marginTop: "12px" }}>
                        Press Enter to submit • Format: UG0x1{"{flag}"}
                    </p>
                )}
            </div>
        </div>
    );
}
