import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const feedbackSchema = z.object({
    subject: z.string().min(5, "Subject must be at least 5 characters").max(100),
    message: z.string().min(20, "Message must be at least 20 characters").max(2000),
    rating: z.number().min(1).max(5).optional().default(5),
    type: z.enum(["BUG", "FEATURE", "SUGGESTION", "GENERAL", "PRAISE"]).optional().default("GENERAL"),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional().default("MEDIUM"),
});

// POST - Submit feedback
export async function POST(request: NextRequest) {
    try {
        const { userId: clerkId } = await auth();

        // Parse and validate request
        const body = await request.json();
        const validation = feedbackSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, message: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { subject, message, rating, type, priority } = validation.data;

        // Get user if authenticated
        let userId: string | null = null;
        if (clerkId) {
            const user = await prisma.user.findUnique({
                where: { clerkId },
                select: { id: true }
            });
            userId = user?.id || null;
        }

        // Create feedback
        const feedback = await prisma.feedback.create({
            data: {
                userId,
                subject: subject.trim(),
                message: message.trim(),
                rating,
                type,
                priority,
            }
        });

        return NextResponse.json({
            success: true,
            message: "Thank you for your feedback! We appreciate your input.",
            feedbackId: feedback.id,
        });
    } catch (error) {
        console.error("Error submitting feedback:", error);
        return NextResponse.json(
            { success: false, message: "Failed to submit feedback. Please try again." },
            { status: 500 }
        );
    }
}

// GET - Get user's own feedback (if authenticated)
export async function GET() {
    try {
        const { userId: clerkId } = await auth();

        if (!clerkId) {
            return NextResponse.json(
                { success: false, message: "Authentication required to view your feedback" },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { id: true }
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        const feedback = await prisma.feedback.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                subject: true,
                message: true,
                rating: true,
                type: true,
                priority: true,
                status: true,
                adminResponse: true,
                respondedAt: true,
                createdAt: true,
            }
        });

        return NextResponse.json({
            success: true,
            feedback,
        });
    } catch (error) {
        console.error("Error fetching feedback:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch feedback" },
            { status: 500 }
        );
    }
}
