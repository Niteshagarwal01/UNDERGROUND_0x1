"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    action: () => void;
    description: string;
}

export function useKeyboardShortcuts() {
    const router = useRouter();

    // Define shortcuts
    const shortcuts: KeyboardShortcut[] = [
        {
            key: "c",
            alt: true,
            action: () => router.push("/challenges"),
            description: "Go to Challenges",
        },
        {
            key: "l",
            alt: true,
            action: () => router.push("/leaderboard"),
            description: "Go to Leaderboard",
        },
        {
            key: "d",
            alt: true,
            action: () => router.push("/dashboard"),
            description: "Go to Dashboard",
        },
        {
            key: "h",
            alt: true,
            action: () => router.push("/hall-of-fame"),
            description: "Go to Hall of Fame",
        },
        {
            key: "/",
            ctrl: true,
            action: () => {
                // Focus search input if it exists
                const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
                if (searchInput) {
                    searchInput.focus();
                }
            },
            description: "Focus Search",
        },
        {
            key: "Escape",
            action: () => {
                // Close any open modal
                const closeButton = document.querySelector<HTMLButtonElement>('[data-modal-close]');
                if (closeButton) {
                    closeButton.click();
                }
            },
            description: "Close Modal",
        },
    ];

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        // Ignore if typing in an input
        if (
            event.target instanceof HTMLInputElement ||
            event.target instanceof HTMLTextAreaElement
        ) {
            // Only allow Escape in inputs
            if (event.key !== "Escape") return;
        }

        for (const shortcut of shortcuts) {
            const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
            const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
            const altMatch = shortcut.alt ? event.altKey : !event.altKey;
            const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;

            if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
                event.preventDefault();
                shortcut.action();
                return;
            }
        }
    }, [router]);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    return shortcuts;
}

// Component to display keyboard shortcuts help
export function KeyboardShortcutsHelp({ shortcuts }: { shortcuts: KeyboardShortcut[] }) {
    return (
        <div
            style={{
                background: "#0a0a0a",
                border: "1px solid #1a1a1a",
                borderRadius: "12px",
                padding: "20px",
            }}
        >
            <h4 style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#facc15",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "16px",
            }}>
                Keyboard Shortcuts
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {shortcuts.map((shortcut, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "#a1a1aa", fontSize: "13px" }}>{shortcut.description}</span>
                        <kbd style={{
                            background: "#1a1a1a",
                            border: "1px solid #2a2a2a",
                            borderRadius: "4px",
                            padding: "2px 8px",
                            fontSize: "11px",
                            fontFamily: "'Courier New', monospace",
                            color: "#facc15",
                        }}>
                            {shortcut.ctrl && "Ctrl + "}
                            {shortcut.alt && "Alt + "}
                            {shortcut.shift && "Shift + "}
                            {shortcut.key.toUpperCase()}
                        </kbd>
                    </div>
                ))}
            </div>
        </div>
    );
}
