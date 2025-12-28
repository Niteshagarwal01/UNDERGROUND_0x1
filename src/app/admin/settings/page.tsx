"use client";

import { useState, useEffect } from "react";
import {
    Settings,
    Save,
    Loader2,
    Users,
    Flag,
    Clock,
    Shield,
    AlertTriangle,
    Check,
    Calendar
} from "lucide-react";

interface PlatformSettings {
    id: string;
    registrationOpen: boolean;
    submissionsEnabled: boolean;
    submissionRateLimit: number;
    maxTeamSize: number;
    competitionStart: string | null;
    competitionEnd: string | null;
    updatedAt: string;
}

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<PlatformSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        registrationOpen: true,
        submissionsEnabled: true,
        submissionRateLimit: 5,
        maxTeamSize: 4,
        competitionStart: "",
        competitionEnd: ""
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/admin/settings");
            const data = await res.json();
            if (data.success && data.settings) {
                setSettings(data.settings);
                setFormData({
                    registrationOpen: data.settings.registrationOpen,
                    submissionsEnabled: data.settings.submissionsEnabled,
                    submissionRateLimit: data.settings.submissionRateLimit,
                    maxTeamSize: data.settings.maxTeamSize,
                    competitionStart: data.settings.competitionStart
                        ? new Date(data.settings.competitionStart).toISOString().slice(0, 16)
                        : "",
                    competitionEnd: data.settings.competitionEnd
                        ? new Date(data.settings.competitionEnd).toISOString().slice(0, 16)
                        : ""
                });
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch("/api/admin/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    competitionStart: formData.competitionStart || null,
                    competitionEnd: formData.competitionEnd || null
                })
            });

            const data = await res.json();
            if (data.success) {
                setMessage({ type: "success", text: "Settings saved successfully!" });
                setSettings(data.settings);
            } else {
                setMessage({ type: "error", text: data.message || "Failed to save settings" });
            }
        } catch (error) {
            console.error("Error saving settings:", error);
            setMessage({ type: "error", text: "Failed to save settings" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
                <Loader2 size={32} className="spin" style={{ color: "var(--yellow)" }} />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            {/* Header */}
            <div style={{ marginBottom: "40px" }}>
                <h1 style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "2.5rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px"
                }}>
                    <Settings size={32} style={{ color: "var(--yellow)" }} />
                    Platform Settings
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "16px" }}>
                    Configure competition settings and platform behavior.
                </p>
            </div>

            {/* Message */}
            {message && (
                <div style={{
                    padding: "16px 20px",
                    borderRadius: "8px",
                    marginBottom: "24px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    background: message.type === "success" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                    border: `1px solid ${message.type === "success" ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                    color: message.type === "success" ? "#22c55e" : "#ef4444"
                }}>
                    {message.type === "success" ? <Check size={20} /> : <AlertTriangle size={20} />}
                    {message.text}
                </div>
            )}

            {/* Settings Sections */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Registration & Submissions */}
                <div className="card">
                    <h3 style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "1.2rem",
                        marginBottom: "24px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px"
                    }}>
                        <Shield size={20} style={{ color: "var(--yellow)" }} />
                        Access Control
                    </h3>

                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        {/* Registration Toggle */}
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "16px",
                            background: "var(--black-lighter)",
                            borderRadius: "8px"
                        }}>
                            <div>
                                <div style={{ fontWeight: 600, marginBottom: "4px" }}>User Registration</div>
                                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                                    Allow new users to sign up
                                </div>
                            </div>
                            <button
                                onClick={() => setFormData(f => ({ ...f, registrationOpen: !f.registrationOpen }))}
                                style={{
                                    width: "56px",
                                    height: "28px",
                                    borderRadius: "14px",
                                    border: "none",
                                    cursor: "pointer",
                                    background: formData.registrationOpen ? "#22c55e" : "var(--black-border)",
                                    position: "relative",
                                    transition: "background 0.2s"
                                }}
                            >
                                <div style={{
                                    width: "22px",
                                    height: "22px",
                                    borderRadius: "50%",
                                    background: "white",
                                    position: "absolute",
                                    top: "3px",
                                    left: formData.registrationOpen ? "31px" : "3px",
                                    transition: "left 0.2s"
                                }} />
                            </button>
                        </div>

                        {/* Submissions Toggle */}
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "16px",
                            background: "var(--black-lighter)",
                            borderRadius: "8px"
                        }}>
                            <div>
                                <div style={{ fontWeight: 600, marginBottom: "4px" }}>Flag Submissions</div>
                                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                                    Allow users to submit flags
                                </div>
                            </div>
                            <button
                                onClick={() => setFormData(f => ({ ...f, submissionsEnabled: !f.submissionsEnabled }))}
                                style={{
                                    width: "56px",
                                    height: "28px",
                                    borderRadius: "14px",
                                    border: "none",
                                    cursor: "pointer",
                                    background: formData.submissionsEnabled ? "#22c55e" : "var(--black-border)",
                                    position: "relative",
                                    transition: "background 0.2s"
                                }}
                            >
                                <div style={{
                                    width: "22px",
                                    height: "22px",
                                    borderRadius: "50%",
                                    background: "white",
                                    position: "absolute",
                                    top: "3px",
                                    left: formData.submissionsEnabled ? "31px" : "3px",
                                    transition: "left 0.2s"
                                }} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Rate Limiting & Team Size */}
                <div className="card">
                    <h3 style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "1.2rem",
                        marginBottom: "24px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px"
                    }}>
                        <Flag size={20} style={{ color: "var(--yellow)" }} />
                        Limits
                    </h3>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        {/* Rate Limit */}
                        <div>
                            <label style={{
                                display: "block",
                                marginBottom: "8px",
                                fontWeight: 500,
                                fontSize: "14px"
                            }}>
                                Submission Rate Limit
                            </label>
                            <div style={{ position: "relative" }}>
                                <input
                                    type="number"
                                    min={1}
                                    max={60}
                                    value={formData.submissionRateLimit}
                                    onChange={(e) => setFormData(f => ({ ...f, submissionRateLimit: parseInt(e.target.value) || 5 }))}
                                    style={{
                                        width: "100%",
                                        padding: "12px 16px",
                                        paddingRight: "100px",
                                        background: "var(--black-lighter)",
                                        border: "1px solid var(--black-border)",
                                        borderRadius: "8px",
                                        color: "var(--text-primary)",
                                        fontSize: "14px"
                                    }}
                                />
                                <span style={{
                                    position: "absolute",
                                    right: "16px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "var(--text-muted)",
                                    fontSize: "13px"
                                }}>
                                    per minute
                                </span>
                            </div>
                        </div>

                        {/* Team Size */}
                        <div>
                            <label style={{
                                display: "block",
                                marginBottom: "8px",
                                fontWeight: 500,
                                fontSize: "14px"
                            }}>
                                Max Team Size
                            </label>
                            <div style={{ position: "relative" }}>
                                <Users size={18} style={{
                                    position: "absolute",
                                    left: "12px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "var(--text-muted)"
                                }} />
                                <input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={formData.maxTeamSize}
                                    onChange={(e) => setFormData(f => ({ ...f, maxTeamSize: parseInt(e.target.value) || 4 }))}
                                    style={{
                                        width: "100%",
                                        padding: "12px 16px",
                                        paddingLeft: "40px",
                                        background: "var(--black-lighter)",
                                        border: "1px solid var(--black-border)",
                                        borderRadius: "8px",
                                        color: "var(--text-primary)",
                                        fontSize: "14px"
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Competition Timing */}
                <div className="card">
                    <h3 style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "1.2rem",
                        marginBottom: "24px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px"
                    }}>
                        <Calendar size={20} style={{ color: "var(--yellow)" }} />
                        Competition Schedule
                    </h3>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        {/* Start Time */}
                        <div>
                            <label style={{
                                display: "block",
                                marginBottom: "8px",
                                fontWeight: 500,
                                fontSize: "14px"
                            }}>
                                Competition Start
                            </label>
                            <div style={{ position: "relative" }}>
                                <Clock size={18} style={{
                                    position: "absolute",
                                    left: "12px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "var(--text-muted)"
                                }} />
                                <input
                                    type="datetime-local"
                                    value={formData.competitionStart}
                                    onChange={(e) => setFormData(f => ({ ...f, competitionStart: e.target.value }))}
                                    style={{
                                        width: "100%",
                                        padding: "12px 16px",
                                        paddingLeft: "40px",
                                        background: "var(--black-lighter)",
                                        border: "1px solid var(--black-border)",
                                        borderRadius: "8px",
                                        color: "var(--text-primary)",
                                        fontSize: "14px"
                                    }}
                                />
                            </div>
                        </div>

                        {/* End Time */}
                        <div>
                            <label style={{
                                display: "block",
                                marginBottom: "8px",
                                fontWeight: 500,
                                fontSize: "14px"
                            }}>
                                Competition End
                            </label>
                            <div style={{ position: "relative" }}>
                                <Clock size={18} style={{
                                    position: "absolute",
                                    left: "12px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "var(--text-muted)"
                                }} />
                                <input
                                    type="datetime-local"
                                    value={formData.competitionEnd}
                                    onChange={(e) => setFormData(f => ({ ...f, competitionEnd: e.target.value }))}
                                    style={{
                                        width: "100%",
                                        padding: "12px 16px",
                                        paddingLeft: "40px",
                                        background: "var(--black-lighter)",
                                        border: "1px solid var(--black-border)",
                                        borderRadius: "8px",
                                        color: "var(--text-primary)",
                                        fontSize: "14px"
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <p style={{
                        fontSize: "13px",
                        color: "var(--text-muted)",
                        marginTop: "16px",
                        fontStyle: "italic"
                    }}>
                        Leave empty for no time restrictions
                    </p>
                </div>

                {/* Last Updated */}
                {settings && (
                    <div style={{
                        fontSize: "13px",
                        color: "var(--text-muted)",
                        textAlign: "right"
                    }}>
                        Last updated: {new Date(settings.updatedAt).toLocaleString()}
                    </div>
                )}

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        padding: "16px 32px",
                        fontSize: "16px",
                        fontWeight: 600,
                        width: "100%",
                        maxWidth: "300px",
                        marginLeft: "auto"
                    }}
                >
                    {saving ? (
                        <>
                            <Loader2 size={20} className="spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save size={20} />
                            Save Settings
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
