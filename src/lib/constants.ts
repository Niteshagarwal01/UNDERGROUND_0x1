// Helper to create uniform yellow theme
const YELLOW_THEME = {
    primary: "#FACC15",
    secondary: "rgba(250, 204, 21, 0.1)", // Very low opacity yellow for backgrounds
    color: "#FACC15"
};

export const METRO_LINES = {
    OSINT: {
        id: "osint",
        name: "Sector 1", // OSINT
        ...YELLOW_THEME,
        description: "Ghost Corridors",
        aliases: ["osint"]
    },
    FORENSICS: {
        id: "forensics",
        name: "Sector 2", // Forensics
        ...YELLOW_THEME,
        description: "Signal Black",
        aliases: ["forensics"]
    },
    CRYPTO: {
        id: "crypto",
        name: "Sector 3", // Crypto
        ...YELLOW_THEME,
        description: "Fare Matrix",
        aliases: ["cryptography", "encryption", "crypto"]
    },
    STEGANOGRAPHY: {
        id: "steganography",
        name: "Sector 4", // Stego
        ...YELLOW_THEME,
        description: "Hidden Tracks",
        aliases: ["stego", "stega", "steganography"]
    },
    REVERSING: {
        id: "reverse-engineering",
        name: "Sector 5", // Reversing
        ...YELLOW_THEME,
        description: "Token Forge",
        aliases: ["reverse", "re", "reverse-engineering"]
    },
    WEB: {
        id: "web",
        name: "Sector 6", // Web
        ...YELLOW_THEME,
        description: "Control Room",
        aliases: ["web-exploitation", "websec", "web"]
    },
    PWN: {
        id: "pwn",
        name: "Sector 7", // Pwn
        ...YELLOW_THEME,
        description: "Override",
        aliases: ["binary-exploitation", "bin-exp", "pwn"]
    },
    MISC: {
        id: "misc",
        name: "Sector 8", // Misc
        ...YELLOW_THEME,
        description: "Lost & Found",
        aliases: ["miscellaneous", "misc"]
    },
    NETWORKING: {
        id: "networking",
        name: "Sector 9", // Networking
        ...YELLOW_THEME,
        description: "Wire Tap",
        aliases: ["network", "networking", "pcap"]
    }
} as const;

export const getLineColor = (slug: string) => {
    const s = slug.toLowerCase();

    // Check direct ID matches
    for (const line of Object.values(METRO_LINES)) {
        if (line.id === s) return line;
    }

    // Check aliases
    for (const line of Object.values(METRO_LINES)) {
        if ((line as any).aliases?.includes(s)) return line;
    }

    // Fallback for variations
    if (s.includes("crypto")) return METRO_LINES.CRYPTO;
    if (s.includes("stego") || s.includes("stega")) return METRO_LINES.STEGANOGRAPHY;
    if (s.includes("reverse")) return METRO_LINES.REVERSING;
    if (s.includes("web")) return METRO_LINES.WEB;

    // Default
    return METRO_LINES.PWN;
};
