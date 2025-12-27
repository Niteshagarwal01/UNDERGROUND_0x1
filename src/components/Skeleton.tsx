"use client";

// Skeleton loading component for various UI elements

interface SkeletonProps {
    width?: string;
    height?: string;
    borderRadius?: string;
    className?: string;
}

export function Skeleton({
    width = "100%",
    height = "16px",
    borderRadius = "4px",
    className = "",
}: SkeletonProps) {
    return (
        <div
            className={`skeleton ${className}`}
            style={{
                width,
                height,
                borderRadius,
                background: "linear-gradient(90deg, var(--black-lighter) 25%, var(--black-card) 50%, var(--black-lighter) 75%)",
                backgroundSize: "200% 100%",
                animation: "skeleton-shimmer 1.5s infinite",
            }}
        />
    );
}

export function SkeletonCard() {
    return (
        <div
            className="card"
            style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <Skeleton width="48px" height="48px" borderRadius="50%" />
                <div style={{ flex: 1 }}>
                    <Skeleton width="60%" height="20px" />
                    <div style={{ marginTop: "8px" }}>
                        <Skeleton width="40%" height="14px" />
                    </div>
                </div>
            </div>
            <Skeleton height="40px" />
            <div style={{ display: "flex", gap: "12px" }}>
                <Skeleton width="80px" height="32px" borderRadius="6px" />
                <Skeleton width="80px" height="32px" borderRadius="6px" />
            </div>
        </div>
    );
}

export function SkeletonChallenge() {
    return (
        <div
            className="card"
            style={{
                padding: "20px",
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "16px",
                alignItems: "center",
            }}
        >
            <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                    <Skeleton width="150px" height="20px" />
                    <Skeleton width="60px" height="24px" borderRadius="4px" />
                </div>
                <Skeleton width="80%" height="14px" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                <Skeleton width="60px" height="24px" />
                <Skeleton width="40px" height="14px" />
            </div>
        </div>
    );
}

export function SkeletonStats() {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "16px",
            }}
        >
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card" style={{ padding: "20px", textAlign: "center" }}>
                    <Skeleton width="60%" height="32px" className="mx-auto" />
                    <div style={{ marginTop: "8px" }}>
                        <Skeleton width="80%" height="14px" className="mx-auto" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
    return (
        <div className="card" style={{ padding: "0", overflow: "hidden" }}>
            {/* Header */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "60px 2fr 1fr 1fr 1fr",
                    gap: "16px",
                    padding: "16px",
                    borderBottom: "1px solid var(--black-border)",
                    background: "var(--black-lighter)",
                }}
            >
                <Skeleton height="14px" />
                <Skeleton height="14px" />
                <Skeleton height="14px" />
                <Skeleton height="14px" />
                <Skeleton height="14px" />
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    style={{
                        display: "grid",
                        gridTemplateColumns: "60px 2fr 1fr 1fr 1fr",
                        gap: "16px",
                        padding: "16px",
                        borderBottom: "1px solid var(--black-border)",
                    }}
                >
                    <Skeleton height="20px" />
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <Skeleton width="36px" height="36px" borderRadius="50%" />
                        <Skeleton width="60%" height="18px" />
                    </div>
                    <Skeleton height="18px" />
                    <Skeleton height="18px" />
                    <Skeleton height="18px" />
                </div>
            ))}
        </div>
    );
}
