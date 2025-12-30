"use client";

// Sound Manager for CTF Platform
// Plays audio feedback for various user interactions

class SoundManager {
    private static instance: SoundManager;
    private enabled: boolean = true;
    private volume: number = 0.5;
    private audioContext: AudioContext | null = null;

    private constructor() {
        if (typeof window !== "undefined") {
            this.enabled = localStorage.getItem("sound_enabled") !== "false";
            const savedVolume = localStorage.getItem("sound_volume");
            if (savedVolume) {
                this.volume = parseFloat(savedVolume);
            }
        }
    }

    static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    private getAudioContext(): AudioContext {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return this.audioContext;
    }

    // Play a beep with specific frequency and duration
    private playTone(frequency: number, duration: number, type: OscillatorType = "sine") {
        if (!this.enabled || typeof window === "undefined") return;

        try {
            const ctx = this.getAudioContext();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = type;

            gainNode.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + duration);
        } catch (e) {
            console.warn("Sound playback failed:", e);
        }
    }

    // Success sound - ascending tones (flag correct)
    playSuccess() {
        if (!this.enabled) return;

        setTimeout(() => this.playTone(523.25, 0.1, "sine"), 0);      // C5
        setTimeout(() => this.playTone(659.25, 0.1, "sine"), 100);    // E5
        setTimeout(() => this.playTone(783.99, 0.15, "sine"), 200);   // G5
    }

    // First blood sound - triumphant fanfare
    playFirstBlood() {
        if (!this.enabled) return;

        setTimeout(() => this.playTone(523.25, 0.1, "square"), 0);    // C5
        setTimeout(() => this.playTone(659.25, 0.1, "square"), 80);   // E5
        setTimeout(() => this.playTone(783.99, 0.1, "square"), 160);  // G5
        setTimeout(() => this.playTone(1046.50, 0.3, "square"), 240); // C6
    }

    // Error sound - descending tone (flag wrong)
    playError() {
        if (!this.enabled) return;

        setTimeout(() => this.playTone(349.23, 0.15, "sawtooth"), 0);  // F4
        setTimeout(() => this.playTone(293.66, 0.2, "sawtooth"), 150); // D4
    }

    // Click sound - subtle feedback
    playClick() {
        if (!this.enabled) return;
        this.playTone(800, 0.05, "sine");
    }

    // Notification sound - gentle ping
    playNotification() {
        if (!this.enabled) return;

        this.playTone(880, 0.1, "sine");  // A5
        setTimeout(() => this.playTone(1108.73, 0.15, "sine"), 100); // C#6
    }

    // Achievement unlocked sound
    playAchievement() {
        if (!this.enabled) return;

        setTimeout(() => this.playTone(392.00, 0.1, "triangle"), 0);   // G4
        setTimeout(() => this.playTone(523.25, 0.1, "triangle"), 100); // C5
        setTimeout(() => this.playTone(659.25, 0.1, "triangle"), 200); // E5
        setTimeout(() => this.playTone(783.99, 0.2, "triangle"), 300); // G5
    }

    // Timer warning sound
    playWarning() {
        if (!this.enabled) return;

        this.playTone(440, 0.1, "square");
        setTimeout(() => this.playTone(440, 0.1, "square"), 200);
    }

    // Challenge unlocked sound
    playUnlock() {
        if (!this.enabled) return;

        setTimeout(() => this.playTone(261.63, 0.1, "sine"), 0);    // C4
        setTimeout(() => this.playTone(329.63, 0.1, "sine"), 100);  // E4
        setTimeout(() => this.playTone(392.00, 0.15, "sine"), 200); // G4
    }

    // Typing sound for terminal
    playTyping() {
        if (!this.enabled) return;
        this.playTone(200 + Math.random() * 100, 0.02, "square");
    }

    // Enable/disable sounds
    setEnabled(enabled: boolean) {
        this.enabled = enabled;
        if (typeof window !== "undefined") {
            localStorage.setItem("sound_enabled", enabled.toString());
        }
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    // Set volume (0-1)
    setVolume(volume: number) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (typeof window !== "undefined") {
            localStorage.setItem("sound_volume", this.volume.toString());
        }
    }

    getVolume(): number {
        return this.volume;
    }
}

// Export singleton instance
export const soundManager = typeof window !== "undefined"
    ? SoundManager.getInstance()
    : null;

// React hook for using sounds
export function useSound() {
    const playSuccess = () => soundManager?.playSuccess();
    const playError = () => soundManager?.playError();
    const playClick = () => soundManager?.playClick();
    const playNotification = () => soundManager?.playNotification();
    const playAchievement = () => soundManager?.playAchievement();
    const playFirstBlood = () => soundManager?.playFirstBlood();
    const playUnlock = () => soundManager?.playUnlock();
    const playWarning = () => soundManager?.playWarning();
    const playTyping = () => soundManager?.playTyping();

    const isEnabled = () => soundManager?.isEnabled() ?? false;
    const setEnabled = (enabled: boolean) => soundManager?.setEnabled(enabled);
    const getVolume = () => soundManager?.getVolume() ?? 0.5;
    const setVolume = (volume: number) => soundManager?.setVolume(volume);

    return {
        playSuccess,
        playError,
        playClick,
        playNotification,
        playAchievement,
        playFirstBlood,
        playUnlock,
        playWarning,
        playTyping,
        isEnabled,
        setEnabled,
        getVolume,
        setVolume,
    };
}
