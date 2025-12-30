"use client";

import { useState, useEffect } from "react";
import { Volume2, VolumeX, Volume1 } from "lucide-react";
import { useSound } from "@/lib/sounds";

export default function SoundSettings() {
    const { isEnabled, setEnabled, getVolume, setVolume, playClick } = useSound();
    const [enabled, setEnabledState] = useState(true);
    const [volume, setVolumeState] = useState(0.5);

    // Sync with sound manager on mount
    useEffect(() => {
        setEnabledState(isEnabled());
        setVolumeState(getVolume());
    }, []);

    const toggleSound = () => {
        const newEnabled = !enabled;
        setEnabledState(newEnabled);
        setEnabled(newEnabled);
        if (newEnabled) {
            playClick();
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolumeState(newVolume);
        setVolume(newVolume);
        playClick();
    };

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                background: "#0d0d0d",
                border: "1px solid #1a1a1a",
                borderRadius: "8px",
            }}
        >
            <button
                onClick={toggleSound}
                style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
                title={enabled ? "Mute sounds" : "Enable sounds"}
            >
                {enabled ? (
                    volume > 0.5 ? (
                        <Volume2 size={20} style={{ color: "#facc15" }} />
                    ) : (
                        <Volume1 size={20} style={{ color: "#facc15" }} />
                    )
                ) : (
                    <VolumeX size={20} style={{ color: "#71717a" }} />
                )}
            </button>

            {enabled && (
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    style={{
                        width: "80px",
                        height: "4px",
                        appearance: "none",
                        background: `linear-gradient(to right, #facc15 0%, #facc15 ${volume * 100}%, #1a1a1a ${volume * 100}%, #1a1a1a 100%)`,
                        borderRadius: "2px",
                        cursor: "pointer",
                    }}
                />
            )}

            <span style={{
                fontSize: "11px",
                color: "#71717a",
                minWidth: "40px",
            }}>
                {enabled ? `${Math.round(volume * 100)}%` : "Muted"}
            </span>
        </div>
    );
}

// Compact version for navbar
export function SoundToggle() {
    const { isEnabled, setEnabled, playClick } = useSound();
    const [enabled, setEnabledState] = useState(true);

    useEffect(() => {
        setEnabledState(isEnabled());
    }, []);

    const toggleSound = () => {
        const newEnabled = !enabled;
        setEnabledState(newEnabled);
        setEnabled(newEnabled);
        if (newEnabled) {
            playClick();
        }
    };

    return (
        <button
            onClick={toggleSound}
            style={{
                background: "transparent",
                border: "1px solid #1a1a1a",
                borderRadius: "8px",
                padding: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
            }}
            title={enabled ? "Mute sounds" : "Enable sounds"}
        >
            {enabled ? (
                <Volume2 size={18} style={{ color: "#facc15" }} />
            ) : (
                <VolumeX size={18} style={{ color: "#71717a" }} />
            )}
        </button>
    );
}
