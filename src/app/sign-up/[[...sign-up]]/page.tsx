import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] grid-bg flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-[var(--color-yellow)] mb-2">
                        UNDERGROUND_0x1
                    </h1>
                    <p className="text-sm text-[var(--color-text-muted)]">
                        Create Your Account
                    </p>
                </div>

                {/* Clerk Sign Up */}
                <SignUp
                    appearance={{
                        elements: {
                            rootBox: "w-full",
                            card: "bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-xl",
                        }
                    }}
                />

                {/* Footer */}
                <div className="text-center mt-8 text-xs text-[var(--color-text-muted)]">
                    <p>Secure authentication powered by Clerk</p>
                </div>
            </div>
        </div>
    );
}
