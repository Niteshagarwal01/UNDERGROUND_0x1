import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Check if user is admin
async function checkAdmin() {
    const { userId } = await auth();
    if (!userId) {
        return { isAdmin: false, error: "Unauthorized", user: null };
    }

    const user = await prisma.user.findUnique({
        where: { clerkId: userId },
    });

    if (!user) {
        return { isAdmin: false, error: "Forbidden", user: null };
    }

    const isDirectAdmin = user.role === "ADMIN";
    const isModerator = user.role === "MODERATOR";

    if (!isDirectAdmin && !isModerator) {
        return { isAdmin: false, error: "Forbidden", user: null };
    }

    return { isAdmin: true, user };
}

// Log admin actions
async function logAction(adminId: string, adminEmail: string, action: string, entityType: string, entityId?: string, details?: string) {
    try {
        await prisma.auditLog.create({
            data: {
                adminId,
                adminEmail,
                action,
                entityType,
                entityId,
                details,
            }
        });
    } catch (error) {
        console.error("Failed to log action:", error);
    }
}

function escapeCSV(value: unknown): string {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes("\"") || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function formatDate(date: Date | null): string {
    if (!date) return "";
    return date.toISOString();
}

// GET - Export data as CSV
export async function GET(request: NextRequest) {
    try {
        const adminCheck = await checkAdmin();
        if (!adminCheck.isAdmin || !adminCheck.user) {
            return NextResponse.json(
                { success: false, message: adminCheck.error },
                { status: adminCheck.error === "Unauthorized" ? 401 : 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type");

        if (!type || !["users", "teams", "challenges", "submissions", "solves"].includes(type)) {
            return NextResponse.json(
                { success: false, message: "Invalid export type. Use: users, teams, challenges, submissions, or solves" },
                { status: 400 }
            );
        }

        let csv = "";
        let filename = "";

        switch (type) {
            case "users": {
                const users = await prisma.user.findMany({
                    include: { team: { select: { name: true } } },
                    orderBy: { createdAt: "desc" }
                });
                const headers = ["ID", "Username", "Email", "Role", "Team", "Total Points", "Solved Count", "Created At"];
                csv = headers.join(",") + "\n";
                csv += users.map(u => [
                    escapeCSV(u.id),
                    escapeCSV(u.username),
                    escapeCSV(u.email),
                    escapeCSV(u.role),
                    escapeCSV(u.team?.name || ""),
                    escapeCSV(u.totalPoints),
                    escapeCSV(u.solvedCount),
                    escapeCSV(formatDate(u.createdAt))
                ].join(",")).join("\n");
                filename = "users_export.csv";
                break;
            }

            case "teams": {
                const teams = await prisma.team.findMany({
                    include: { members: { select: { username: true } } },
                    orderBy: { totalPoints: "desc" }
                });
                const headers = ["ID", "Name", "Total Points", "Solved Count", "Rank", "Member Count", "Members", "Created At"];
                csv = headers.join(",") + "\n";
                csv += teams.map(t => [
                    escapeCSV(t.id),
                    escapeCSV(t.name),
                    escapeCSV(t.totalPoints),
                    escapeCSV(t.solvedCount),
                    escapeCSV(t.rank || ""),
                    escapeCSV(t.members.length),
                    escapeCSV(t.members.map(m => m.username).join("; ")),
                    escapeCSV(formatDate(t.createdAt))
                ].join(",")).join("\n");
                filename = "teams_export.csv";
                break;
            }

            case "challenges": {
                const challenges = await prisma.challenge.findMany({
                    include: { category: { select: { name: true } } },
                    orderBy: [{ category: { order: "asc" } }, { points: "asc" }]
                });
                const headers = ["ID", "Title", "Slug", "Category", "Difficulty", "Points", "Solve Count", "Attempt Count", "Is Active", "Created At"];
                csv = headers.join(",") + "\n";
                csv += challenges.map(c => [
                    escapeCSV(c.id),
                    escapeCSV(c.title),
                    escapeCSV(c.slug),
                    escapeCSV(c.category.name),
                    escapeCSV(c.difficulty),
                    escapeCSV(c.points),
                    escapeCSV(c.solveCount),
                    escapeCSV(c.attemptCount),
                    escapeCSV(c.isActive),
                    escapeCSV(formatDate(c.createdAt))
                ].join(",")).join("\n");
                filename = "challenges_export.csv";
                break;
            }

            case "submissions": {
                const submissions = await prisma.submission.findMany({
                    include: {
                        user: { select: { username: true } },
                        team: { select: { name: true } },
                        challenge: { select: { title: true } }
                    },
                    orderBy: { createdAt: "desc" },
                    take: 10000 // Limit to prevent memory issues
                });
                const headers = ["ID", "Username", "Team", "Challenge", "Is Correct", "Submitted At"];
                csv = headers.join(",") + "\n";
                csv += submissions.map(s => [
                    escapeCSV(s.id),
                    escapeCSV(s.user.username),
                    escapeCSV(s.team?.name || ""),
                    escapeCSV(s.challenge.title),
                    escapeCSV(s.isCorrect),
                    escapeCSV(formatDate(s.createdAt))
                ].join(",")).join("\n");
                filename = "submissions_export.csv";
                break;
            }

            case "solves": {
                const solves = await prisma.solve.findMany({
                    include: {
                        team: { select: { name: true } },
                        challenge: {
                            select: {
                                title: true,
                                category: { select: { name: true } }
                            }
                        }
                    },
                    orderBy: { solvedAt: "desc" }
                });
                const headers = ["ID", "Team", "Challenge", "Category", "Points", "Is First Blood", "Solved At"];
                csv = headers.join(",") + "\n";
                csv += solves.map(s => [
                    escapeCSV(s.id),
                    escapeCSV(s.team.name),
                    escapeCSV(s.challenge.title),
                    escapeCSV(s.challenge.category.name),
                    escapeCSV(s.points),
                    escapeCSV(s.isFirstBlood),
                    escapeCSV(formatDate(s.solvedAt))
                ].join(",")).join("\n");
                filename = "solves_export.csv";
                break;
            }
        }

        // Log the action
        await logAction(
            adminCheck.user.id,
            adminCheck.user.email,
            "EXPORT_DATA",
            type.charAt(0).toUpperCase() + type.slice(1),
            undefined,
            JSON.stringify({ type, timestamp: new Date().toISOString() })
        );

        return new NextResponse(csv, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="${filename}"`
            }
        });
    } catch (error) {
        console.error("Error exporting data:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
