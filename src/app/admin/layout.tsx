import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminSidebar from "@/components/AdminSidebar";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { userId } = await auth();

    if (!userId) {
        redirect("/enter");
    }

    // Check database role and team admin status
    const dbUser = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: {
            team: {
                include: {
                    members: {
                        select: {
                            role: true,
                        },
                    },
                },
            },
        },
    });

    if (!dbUser) {
        redirect("/dashboard");
    }

    // Check if user is admin, moderator, OR if user is in a team with an admin
    // Team members get MODERATOR role when joining admin team, so they'll have access
    const isDirectAdmin = dbUser.role === "ADMIN";
    const isModerator = dbUser.role === "MODERATOR";

    if (!isDirectAdmin && !isModerator) {
        redirect("/dashboard");
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--black)', color: 'var(--text-primary)', display: 'flex' }}>
            <AdminSidebar />

            {/* Main Content */}
            <main style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                marginLeft: 0,
                minWidth: 0
            }}
                className="admin-main"
            >
                <header style={{
                    height: '72px',
                    borderBottom: '1px solid var(--black-border)',
                    background: 'var(--black-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 24px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 50
                }}>
                    <div style={{ flex: 1 }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ textAlign: 'right', fontSize: '14px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                                {dbUser.username}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--yellow)', fontFamily: 'var(--font-heading)' }}>
                                {dbUser.role === "ADMIN" ? "Administrator" : dbUser.role === "MODERATOR" ? "Moderator" : "Administrator"}
                            </div>
                        </div>
                    </div>
                </header>

                <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}
                    className="admin-content"
                >
                    {children}
                </div>
            </main>
        </div>
    );
}
