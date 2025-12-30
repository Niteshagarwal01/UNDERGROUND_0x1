"use client";

interface SolveRateProps {
    solves: number;
    totalTeams: number;
    compact?: boolean;
}

// Calculate difficulty based on solve rate
function getDifficultyFromRate(rate: number): {
    label: string;
    color: string;
    bgColor: string;
} {
    if (rate >= 70) {
        return {
            label: "Easy",
            color: "#22c55e",
            bgColor: "rgba(34, 197, 94, 0.15)",
        };
    } else if (rate >= 40) {
        return {
            label: "Medium",
            color: "#facc15",
            bgColor: "rgba(250, 204, 21, 0.15)",
        };
    } else if (rate >= 15) {
        return {
            label: "Hard",
            color: "#f97316",
            bgColor: "rgba(249, 115, 22, 0.15)",
        };
    } else {
        return {
            label: "Elite",
            color: "#ef4444",
            bgColor: "rgba(239, 68, 68, 0.15)",
        };
    }
}

export default function SolveRateIndicator({ solves, totalTeams, compact = false }: SolveRateProps) {
    // Avoid division by zero
    const rate = totalTeams > 0 ? Math.round((solves / totalTeams) * 100) : 0;
    const difficulty = getDifficultyFromRate(rate);

    if (compact) {
        return (
            <span
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "11px",
                    color: difficulty.color,
                    fontWeight: 600,
                }}
                title={`${rate}% solve rate (${solves}/${totalTeams} teams)`}
            >
                <span
                    style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: difficulty.color,
                    }}
                />
                {rate}%
            </span>
        );
    }

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
            }}
            title={`${rate}% of teams have solved this challenge`}
        >
            {/* Progress bar */}
            <div
                style={{
                    width: "60px",
                    height: "6px",
                    background: "#1a1a1a",
                    borderRadius: "3px",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        height: "100%",
                        width: `${Math.min(rate, 100)}%`,
                        background: difficulty.color,
                        borderRadius: "3px",
                        transition: "width 0.3s ease",
                    }}
                />
            </div>

            {/* Percentage */}
            <span
                style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: difficulty.color,
                    minWidth: "32px",
                }}
            >
                {rate}%
            </span>
        </div>
    );
}

// Badge version showing solve difficulty
export function SolveRateBadge({ solves, totalTeams }: SolveRateProps) {
    const rate = totalTeams > 0 ? Math.round((solves / totalTeams) * 100) : 0;
    const difficulty = getDifficultyFromRate(rate);

    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 10px",
                background: difficulty.bgColor,
                border: `1px solid ${difficulty.color}33`,
                borderRadius: "4px",
                fontSize: "10px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: difficulty.color,
            }}
            title={`${rate}% solve rate`}
        >
            <span
                style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: difficulty.color,
                }}
            />
            {rate}% solved
        </span>
    );
}
