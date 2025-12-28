import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: Fetch active announcements for users
export async function GET() {
    try {
        const announcements = await prisma.announcement.findMany({
            orderBy: [
                { isPinned: "desc" },
                { createdAt: "desc" }
            ],
            take: 10
        });

        return NextResponse.json({
            success: true,
            announcements
        });
    } catch (error) {
        console.error("Error fetching announcements:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch announcements" },
            { status: 500 }
        );
    }
}
