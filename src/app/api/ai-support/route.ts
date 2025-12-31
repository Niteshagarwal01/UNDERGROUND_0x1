/**
 * AI Support API Route
 * POST: Send message to AI and get response
 */

import { NextRequest, NextResponse } from "next/server";
import { generateAIResponse, Message } from "@/lib/ai-provider";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, history } = body as {
            message: string;
            history?: Message[]
        };

        if (!message || typeof message !== "string") {
            return NextResponse.json(
                { success: false, message: "Message is required" },
                { status: 400 }
            );
        }

        if (message.length > 1000) {
            return NextResponse.json(
                { success: false, message: "Message too long (max 1000 characters)" },
                { status: 400 }
            );
        }

        // Build messages array with history
        const messages: Message[] = [
            ...(history || []),
            { role: "user", content: message }
        ];

        // Get AI response with fallback
        const { response, provider } = await generateAIResponse(messages);

        return NextResponse.json({
            success: true,
            response,
            provider, // For debugging - can remove in production
        });

    } catch (error) {
        console.error("AI Support error:", error);

        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        // Check for API key issues
        if (errorMessage.includes("API_KEY") || errorMessage.includes("configured")) {
            return NextResponse.json(
                {
                    success: false,
                    message: "AI service is temporarily unavailable. Please try again later or use the Feedback form.",
                    isConfigError: true
                },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { success: false, message: "Failed to get AI response. Please try again." },
            { status: 500 }
        );
    }
}
