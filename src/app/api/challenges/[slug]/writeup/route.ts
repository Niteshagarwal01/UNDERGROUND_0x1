import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        if (!slug) {
            return NextResponse.json(
                { success: false, message: "Challenge slug is required" },
                { status: 400 }
            );
        }

        // Get authenticated user
        const { userId: clerkId } = await auth();

        if (!clerkId) {
            return NextResponse.json(
                { success: false, message: "Authentication required" },
                { status: 401 }
            );
        }

        // Get user and their team
        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: {
                id: true,
                teamId: true
            }
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        // Get the challenge
        const challenge = await prisma.challenge.findUnique({
            where: { slug },
            select: {
                id: true,
                writeup: true,
                writeupUrl: true
            }
        });

        if (!challenge) {
            return NextResponse.json(
                { success: false, message: "Challenge not found" },
                { status: 404 }
            );
        }

        // Check if user's team has solved this challenge
        if (!user.teamId) {
            return NextResponse.json(
                { success: false, message: "You must be in a team to view write-ups" },
                { status: 403 }
            );
        }

        const solve = await prisma.solve.findUnique({
            where: {
                teamId_challengeId: {
                    teamId: user.teamId,
                    challengeId: challenge.id
                }
            }
        });

        if (!solve) {
            return NextResponse.json(
                { success: false, message: "Solve this challenge first to unlock the write-up" },
                { status: 403 }
            );
        }

        // User has solved - return the writeup
        const hasWriteup = !!(challenge.writeup || challenge.writeupUrl);

        return NextResponse.json({
            success: true,
            hasWriteup,
            writeup: challenge.writeup,
            writeupUrl: challenge.writeupUrl
        });

    } catch (error) {
        console.error("Error fetching writeup:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch writeup" },
            { status: 500 }
        );
    }
}
