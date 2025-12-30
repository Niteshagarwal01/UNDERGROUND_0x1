"use client";

import { useState } from "react";
import { Edit, EyeOff, Plus, Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import EditChallengeModal from "@/components/EditChallengeModal";
import CreateChallengeModal from "@/components/CreateChallengeModal";
import { SolveRateBadge } from "@/components/SolveRateIndicator";
import { getLineColor as getMetroLineColor } from "@/lib/constants";

interface Challenge {
    id: string;
    title: string;
    slug: string;
    description: string;
    categoryId: string;
    difficulty: string;
    points: number;
    isActive: boolean;
    isHidden: boolean;
    solveCount: number;
    attemptCount: number;
    category?: {
        id: string;
        name: string;
    };
}

interface Category {
    id: string;
    name: string;
    slug: string;
    color?: string | null;
}

interface ChallengesListProps {
    challenges: Challenge[];
    categories: Category[];
    totalTeams?: number;
}

export default function ChallengesList({
    challenges,
    categories,
    totalTeams = 0,
}: ChallengesListProps) {
    const router = useRouter();
    const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [loadingChallenge, setLoadingChallenge] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);



    const handleEdit = async (challengeId: string) => {
        setLoadingChallenge(true);
        try {
            const response = await fetch(`/api/admin/challenges/${challengeId}`);
            const data = await response.json();
            if (data.success) {
                setSelectedChallenge(data.challenge);
            } else {
                alert("Failed to load challenge details");
            }
        } catch (error) {
            alert("Error loading challenge");
        } finally {
            setLoadingChallenge(false);
        }
    };

    const handleSuccess = () => {
        router.refresh();
    };

    const handleDelete = async (challengeId: string, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone and will remove all associated solves.`)) {
            return;
        }

        setDeletingId(challengeId);
        try {
            const response = await fetch(`/api/admin/challenges/${challengeId}`, {
                method: "DELETE",
            });
            const data = await response.json();
            if (data.success) {
                router.refresh();
            } else {
                alert(data.message || "Failed to delete challenge");
            }
        } catch (error) {
            alert("Error deleting challenge");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <>
            {/* Create Button */}
            <div style={{ marginBottom: "32px" }}>
                <button
                    className="btn btn-primary"
                    style={{ display: "flex", alignItems: "center", gap: "8px" }}
                    onClick={() => setShowCreateModal(true)}
                >
                    <Plus size={18} />
                    Create Challenge
                </button>
            </div>

            {/* No challenges message */}
            {challenges.length === 0 && (
                <div className="card" style={{ textAlign: "center", padding: "60px 24px" }}>
                    <p style={{ color: "var(--text-muted)", fontSize: "16px", marginBottom: "16px" }}>
                        No challenges yet. Create your first challenge to get started!
                    </p>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <Plus size={18} />
                        Create First Challenge
                    </button>
                </div>
            )}

            {/* Categories with challenges */}
            {categories.map((category) => {
                const categoryChallenges = challenges.filter((c) => c.categoryId === category.id);
                if (categoryChallenges.length === 0) return null;

                return (
                    <div key={category.id} style={{ marginBottom: "48px" }}>
                        <h2
                            style={{
                                fontFamily: "var(--font-heading)",
                                fontSize: "1.5rem",
                                fontWeight: 700,
                                color: "var(--text-primary)",
                                marginBottom: "24px",
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                            }}
                        >
                            <span style={{ color: getMetroLineColor(category.slug).primary }}>{category.name}</span>
                            <span style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 400 }}>
                                ({categoryChallenges.length} challenges)
                            </span>
                        </h2>

                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {categoryChallenges.map((challenge) => (
                                <div key={challenge.id} className="card">
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            justifyContent: "space-between",
                                            gap: "24px",
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "12px",
                                                    marginBottom: "12px",
                                                }}
                                            >
                                                <h3
                                                    style={{
                                                        fontFamily: "var(--font-heading)",
                                                        fontSize: "1.1rem",
                                                        fontWeight: 600,
                                                        color: "var(--text-primary)",
                                                    }}
                                                >
                                                    {challenge.title}
                                                </h3>
                                                <span
                                                    style={{
                                                        fontSize: "11px",
                                                        padding: "4px 10px",
                                                        borderRadius: "4px",
                                                        background: `rgba(250, 204, 21, ${challenge.difficulty === "MEDIUM"
                                                            ? 0.1
                                                            : challenge.difficulty === "HARD"
                                                                ? 0.15
                                                                : 0.2})`,
                                                        color: "var(--yellow)",
                                                        border: `1px solid rgba(250, 204, 21, ${challenge.difficulty === "MEDIUM"
                                                            ? 0.3
                                                            : challenge.difficulty === "HARD"
                                                                ? 0.4
                                                                : 0.5})`,
                                                        textTransform: "uppercase",
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {challenge.difficulty.replace("_", " ")}
                                                </span>
                                                {!challenge.isActive && (
                                                    <span
                                                        style={{
                                                            fontSize: "11px",
                                                            padding: "4px 10px",
                                                            borderRadius: "4px",
                                                            background: "rgba(239, 68, 68, 0.1)",
                                                            color: "#ef4444",
                                                            border: "1px solid rgba(239, 68, 68, 0.2)",
                                                            textTransform: "uppercase",
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        Inactive
                                                    </span>
                                                )}
                                                {challenge.isHidden && (
                                                    <EyeOff size={16} style={{ color: "var(--text-muted)" }} />
                                                )}
                                            </div>
                                            <p
                                                style={{
                                                    color: "var(--text-secondary)",
                                                    fontSize: "14px",
                                                    marginBottom: "12px",
                                                    lineHeight: 1.6,
                                                }}
                                            >
                                                {challenge.description}
                                            </p>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: "24px",
                                                    fontSize: "13px",
                                                    color: "var(--text-muted)",
                                                }}
                                            >
                                                <span>
                                                    Points: <strong style={{ color: "var(--yellow)" }}>{challenge.points}</strong>
                                                </span>
                                                <span>
                                                    Solves: <strong>{challenge.solveCount}</strong>
                                                </span>
                                                {totalTeams > 0 && (
                                                    <SolveRateBadge
                                                        solves={challenge.solveCount}
                                                        totalTeams={totalTeams}
                                                    />
                                                )}
                                                <span>
                                                    Attempts: <strong>{challenge.attemptCount}</strong>
                                                </span>
                                                <span>
                                                    Slug:{" "}
                                                    <code
                                                        style={{
                                                            color: "var(--yellow)",
                                                            fontFamily: "var(--font-body)",
                                                        }}
                                                    >
                                                        {challenge.slug}
                                                    </code>
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                style={{ display: "flex", alignItems: "center", gap: "6px" }}
                                                onClick={() => handleEdit(challenge.id)}
                                                disabled={loadingChallenge || deletingId === challenge.id}
                                            >
                                                <Edit size={14} />
                                                Edit
                                            </button>
                                            <button
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                    padding: "8px 12px",
                                                    borderRadius: "6px",
                                                    border: "1px solid rgba(239, 68, 68, 0.3)",
                                                    background: "rgba(239, 68, 68, 0.1)",
                                                    color: "#ef4444",
                                                    fontSize: "12px",
                                                    fontWeight: 500,
                                                    cursor: "pointer",
                                                }}
                                                onClick={() => handleDelete(challenge.id, challenge.title)}
                                                disabled={deletingId === challenge.id}
                                            >
                                                {deletingId === challenge.id ? (
                                                    <Loader2 size={14} className="spinner" />
                                                ) : (
                                                    <Trash2 size={14} />
                                                )}
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            {/* Edit Modal */}
            {selectedChallenge && (
                <EditChallengeModal
                    challenge={selectedChallenge}
                    categories={categories}
                    allChallenges={challenges}
                    onClose={() => setSelectedChallenge(null)}
                    onSuccess={handleSuccess}
                />
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <CreateChallengeModal
                    categories={categories}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={handleSuccess}
                />
            )}
        </>
    );
}
