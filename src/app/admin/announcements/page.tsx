"use client";

import { useState, useEffect } from "react";
import {
    Megaphone,
    Plus,
    Pin,
    Trash2,
    Edit3,
    Loader2,
    X,
    Check,
    AlertTriangle
} from "lucide-react";

interface Announcement {
    id: string;
    title: string;
    content: string;
    isPinned: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function AdminAnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: "",
        content: "",
        isPinned: false,
        notifyUsers: false
    });

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const res = await fetch("/api/admin/announcements");
            const data = await res.json();
            if (data.success) {
                setAnnouncements(data.announcements);
            }
        } catch (error) {
            console.error("Error fetching announcements:", error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (announcement?: Announcement) => {
        if (announcement) {
            setEditingId(announcement.id);
            setFormData({
                title: announcement.title,
                content: announcement.content,
                isPinned: announcement.isPinned,
                notifyUsers: false
            });
        } else {
            setEditingId(null);
            setFormData({ title: "", content: "", isPinned: false, notifyUsers: false });
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.title.trim() || !formData.content.trim()) {
            setMessage({ type: "error", text: "Title and content are required" });
            return;
        }

        setSaving(true);
        setMessage(null);

        try {
            const url = editingId
                ? `/api/admin/announcements/${editingId}`
                : "/api/admin/announcements";
            const method = editingId ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (data.success) {
                setMessage({ type: "success", text: editingId ? "Announcement updated!" : "Announcement created!" });
                fetchAnnouncements();
                setShowModal(false);
            } else {
                setMessage({ type: "error", text: data.message || "Failed to save" });
            }
        } catch (error) {
            console.error("Error saving announcement:", error);
            setMessage({ type: "error", text: "Failed to save" });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this announcement?")) return;

        try {
            const res = await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                setAnnouncements(a => a.filter(ann => ann.id !== id));
                setMessage({ type: "success", text: "Announcement deleted" });
            }
        } catch (error) {
            console.error("Error deleting announcement:", error);
        }
    };

    const handleTogglePin = async (announcement: Announcement) => {
        try {
            const res = await fetch(`/api/admin/announcements/${announcement.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isPinned: !announcement.isPinned })
            });
            const data = await res.json();
            if (data.success) {
                fetchAnnouncements();
            }
        } catch (error) {
            console.error("Error toggling pin:", error);
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
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            {/* Header */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "40px"
            }}>
                <div>
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
                        <Megaphone size={32} style={{ color: "var(--yellow)" }} />
                        Announcements
                    </h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "16px" }}>
                        Manage platform announcements visible on the homepage.
                    </p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="btn-primary"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px 24px"
                    }}
                >
                    <Plus size={20} />
                    New Announcement
                </button>
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

            {/* Announcements List */}
            {announcements.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: "60px" }}>
                    <Megaphone size={48} style={{ color: "var(--text-muted)", margin: "0 auto 16px", opacity: 0.5 }} />
                    <p style={{ color: "var(--text-muted)" }}>No announcements yet</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {announcements.map((announcement) => (
                        <div
                            key={announcement.id}
                            className="card"
                            style={{
                                borderLeft: announcement.isPinned ? "3px solid var(--yellow)" : undefined
                            }}
                        >
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                marginBottom: "12px"
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                        marginBottom: "8px"
                                    }}>
                                        <h3 style={{
                                            fontFamily: "var(--font-heading)",
                                            fontSize: "1.1rem",
                                            fontWeight: 600
                                        }}>
                                            {announcement.title}
                                        </h3>
                                        {announcement.isPinned && (
                                            <span style={{
                                                background: "rgba(250, 204, 21, 0.1)",
                                                border: "1px solid rgba(250, 204, 21, 0.3)",
                                                color: "var(--yellow)",
                                                padding: "2px 8px",
                                                borderRadius: "4px",
                                                fontSize: "11px",
                                                fontWeight: 600,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "4px"
                                            }}>
                                                <Pin size={12} />
                                                Pinned
                                            </span>
                                        )}
                                    </div>
                                    <p style={{
                                        color: "var(--text-secondary)",
                                        fontSize: "14px",
                                        lineHeight: 1.6,
                                        whiteSpace: "pre-wrap"
                                    }}>
                                        {announcement.content}
                                    </p>
                                    <p style={{
                                        fontSize: "12px",
                                        color: "var(--text-muted)",
                                        marginTop: "12px"
                                    }}>
                                        Created: {new Date(announcement.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <button
                                        onClick={() => handleTogglePin(announcement)}
                                        title={announcement.isPinned ? "Unpin" : "Pin"}
                                        style={{
                                            padding: "8px",
                                            background: announcement.isPinned ? "rgba(250, 204, 21, 0.1)" : "var(--black-lighter)",
                                            border: "1px solid var(--black-border)",
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            color: announcement.isPinned ? "var(--yellow)" : "var(--text-muted)"
                                        }}
                                    >
                                        <Pin size={16} />
                                    </button>
                                    <button
                                        onClick={() => openModal(announcement)}
                                        title="Edit"
                                        style={{
                                            padding: "8px",
                                            background: "var(--black-lighter)",
                                            border: "1px solid var(--black-border)",
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            color: "var(--text-muted)"
                                        }}
                                    >
                                        <Edit3 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(announcement.id)}
                                        title="Delete"
                                        style={{
                                            padding: "8px",
                                            background: "rgba(239, 68, 68, 0.1)",
                                            border: "1px solid rgba(239, 68, 68, 0.2)",
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            color: "#ef4444"
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0, 0, 0, 0.8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000,
                    padding: "24px"
                }}>
                    <div className="card" style={{
                        width: "100%",
                        maxWidth: "600px",
                        maxHeight: "90vh",
                        overflow: "auto"
                    }}>
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "24px"
                        }}>
                            <h2 style={{
                                fontFamily: "var(--font-heading)",
                                fontSize: "1.5rem"
                            }}>
                                {editingId ? "Edit Announcement" : "New Announcement"}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "var(--text-muted)"
                                }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div>
                                <label style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontWeight: 500,
                                    fontSize: "14px"
                                }}>
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
                                    placeholder="Announcement title"
                                    style={{
                                        width: "100%",
                                        padding: "12px 16px",
                                        background: "var(--black-lighter)",
                                        border: "1px solid var(--black-border)",
                                        borderRadius: "8px",
                                        color: "var(--text-primary)",
                                        fontSize: "14px"
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontWeight: 500,
                                    fontSize: "14px"
                                }}>
                                    Content
                                </label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData(f => ({ ...f, content: e.target.value }))}
                                    placeholder="Announcement content..."
                                    rows={6}
                                    style={{
                                        width: "100%",
                                        padding: "12px 16px",
                                        background: "var(--black-lighter)",
                                        border: "1px solid var(--black-border)",
                                        borderRadius: "8px",
                                        color: "var(--text-primary)",
                                        fontSize: "14px",
                                        resize: "vertical"
                                    }}
                                />
                            </div>

                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px"
                            }}>
                                <button
                                    onClick={() => setFormData(f => ({ ...f, isPinned: !f.isPinned }))}
                                    style={{
                                        width: "48px",
                                        height: "24px",
                                        borderRadius: "12px",
                                        border: "none",
                                        cursor: "pointer",
                                        background: formData.isPinned ? "var(--yellow)" : "var(--black-border)",
                                        position: "relative"
                                    }}
                                >
                                    <div style={{
                                        width: "18px",
                                        height: "18px",
                                        borderRadius: "50%",
                                        background: "white",
                                        position: "absolute",
                                        top: "3px",
                                        left: formData.isPinned ? "27px" : "3px",
                                        transition: "left 0.2s"
                                    }} />
                                </button>
                                <span style={{ fontSize: "14px" }}>Pin to top</span>
                            </div>

                            {/* Notify Users Toggle - only for new announcements */}
                            {!editingId && (
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px"
                                }}>
                                    <button
                                        onClick={() => setFormData(f => ({ ...f, notifyUsers: !f.notifyUsers }))}
                                        style={{
                                            width: "48px",
                                            height: "24px",
                                            borderRadius: "12px",
                                            border: "none",
                                            cursor: "pointer",
                                            background: formData.notifyUsers ? "#22c55e" : "var(--black-border)",
                                            position: "relative"
                                        }}
                                    >
                                        <div style={{
                                            width: "18px",
                                            height: "18px",
                                            borderRadius: "50%",
                                            background: "white",
                                            position: "absolute",
                                            top: "3px",
                                            left: formData.notifyUsers ? "27px" : "3px",
                                            transition: "left 0.2s"
                                        }} />
                                    </button>
                                    <span style={{ fontSize: "14px" }}>Send notification to all users</span>
                                </div>
                            )}

                            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                                <button
                                    onClick={() => setShowModal(false)}
                                    style={{
                                        flex: 1,
                                        padding: "12px",
                                        background: "var(--black-lighter)",
                                        border: "1px solid var(--black-border)",
                                        borderRadius: "8px",
                                        color: "var(--text-secondary)",
                                        cursor: "pointer",
                                        fontWeight: 500
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="btn-primary"
                                    style={{
                                        flex: 1,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "8px"
                                    }}
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 size={18} className="spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={18} />
                                            {editingId ? "Update" : "Create"}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
