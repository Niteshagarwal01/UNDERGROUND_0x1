import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const joinTeamSchema = z.object({
    inviteCode: z.string().min(1, "Invite code is required"),
});

// This route now redirects to the request system
// Direct joining is no longer supported - join requests must be approved
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validation = joinTeamSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, message: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        // Redirect to the request endpoint
        // For backward compatibility, this mimics the request flow
        const requestResponse = await fetch(new URL("/api/teams/request", request.url), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                cookie: request.headers.get("cookie") || "",
            },
            body: JSON.stringify(body),
        });

        const result = await requestResponse.json();
        return NextResponse.json(result, { status: requestResponse.status });

    } catch (error) {
        console.error("Error in join team:", error);
        return NextResponse.json(
            { success: false, message: "Failed to process join request" },
            { status: 500 }
        );
    }
}
