// Discord Webhook Integration for CTF Platform
// Sends notifications for first bloods, solves, and other events

export interface DiscordEmbed {
    title?: string;
    description?: string;
    color?: number;
    fields?: { name: string; value: string; inline?: boolean }[];
    footer?: { text: string; icon_url?: string };
    timestamp?: string;
    thumbnail?: { url: string };
}

export interface DiscordWebhookPayload {
    content?: string;
    username?: string;
    avatar_url?: string;
    embeds?: DiscordEmbed[];
}

// Discord webhook URL - should be set in environment variables
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "";

// Colors for Discord embeds
const COLORS = {
    FIRST_BLOOD: 0xff0000,    // Red for first blood
    SOLVE: 0xfacc15,          // Yellow/gold for regular solves
    TEAM_CREATED: 0x22c55e,   // Green for new team
    ANNOUNCEMENT: 0x3b82f6,   // Blue for announcements
    ERROR: 0xef4444,          // Red for errors
};

/**
 * Send a message to Discord webhook
 */
export async function sendDiscordWebhook(payload: DiscordWebhookPayload): Promise<boolean> {
    if (!DISCORD_WEBHOOK_URL) {
        console.log("[Discord] Webhook URL not configured, skipping notification");
        return false;
    }

    try {
        const response = await fetch(DISCORD_WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: "UNDERGROUND_0x1 Bot",
                avatar_url: "https://raw.githubusercontent.com/Niteshagarwal01/UNDERGROUND_0x1/master/public/logo.png",
                ...payload,
            }),
        });

        if (!response.ok) {
            console.error("[Discord] Webhook failed:", response.status, await response.text());
            return false;
        }

        return true;
    } catch (error) {
        console.error("[Discord] Webhook error:", error);
        return false;
    }
}

/**
 * Announce a first blood (first solve of a challenge)
 */
export async function announceFirstBlood(
    teamName: string,
    challengeTitle: string,
    category: string,
    points: number
): Promise<boolean> {
    return sendDiscordWebhook({
        embeds: [{
            title: "🩸 FIRST BLOOD!",
            description: `**${teamName}** drew first blood on **${challengeTitle}**!`,
            color: COLORS.FIRST_BLOOD,
            fields: [
                { name: "Challenge", value: challengeTitle, inline: true },
                { name: "Category", value: category, inline: true },
                { name: "Points", value: `+${points}`, inline: true },
            ],
            footer: { text: "UNDERGROUND_0x1 CTF" },
            timestamp: new Date().toISOString(),
        }],
    });
}

/**
 * Announce a solve (non-first blood)
 */
export async function announceSolve(
    teamName: string,
    challengeTitle: string,
    category: string,
    points: number,
    solveNumber: number
): Promise<boolean> {
    // Only announce milestone solves (1st, 5th, 10th, etc.) to avoid spam
    if (solveNumber !== 1 && solveNumber !== 5 && solveNumber % 10 !== 0) {
        return true; // Skip non-milestone solves
    }

    return sendDiscordWebhook({
        embeds: [{
            title: "🎯 Challenge Solved!",
            description: `**${teamName}** solved **${challengeTitle}**!`,
            color: COLORS.SOLVE,
            fields: [
                { name: "Challenge", value: challengeTitle, inline: true },
                { name: "Points", value: `+${points}`, inline: true },
                { name: "Solve #", value: `${solveNumber}`, inline: true },
            ],
            footer: { text: "UNDERGROUND_0x1 CTF" },
            timestamp: new Date().toISOString(),
        }],
    });
}

/**
 * Announce new team creation
 */
export async function announceNewTeam(teamName: string): Promise<boolean> {
    return sendDiscordWebhook({
        embeds: [{
            title: "👥 New Team Joined!",
            description: `Welcome **${teamName}** to the competition!`,
            color: COLORS.TEAM_CREATED,
            footer: { text: "UNDERGROUND_0x1 CTF" },
            timestamp: new Date().toISOString(),
        }],
    });
}

/**
 * Send a custom announcement
 */
export async function sendAnnouncement(
    title: string,
    message: string
): Promise<boolean> {
    return sendDiscordWebhook({
        content: "@everyone",
        embeds: [{
            title: `📢 ${title}`,
            description: message,
            color: COLORS.ANNOUNCEMENT,
            footer: { text: "UNDERGROUND_0x1 CTF" },
            timestamp: new Date().toISOString(),
        }],
    });
}
