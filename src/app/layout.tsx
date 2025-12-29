import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import MobileNavbar from "@/components/MobileNavbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "UNDERGROUND_0x1 | Elite CTF Platform",
  description: "A high-fidelity Delhi Metro operational compromise simulation. Elite-level Capture The Flag competition.",
  keywords: ["CTF", "Capture The Flag", "Cybersecurity", "Delhi Metro", "DMRC", "Hacking", "Security Competition"],
  authors: [{ name: "UNDERGROUND_0x1" }],
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.svg",
  },
  openGraph: {
    title: "UNDERGROUND_0x1 | Elite CTF Platform",
    description: "Elite-level Capture The Flag competition. 15 challenges across OSINT, Forensics, Cryptography, Reverse Engineering, and Web Security.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#facc15",
          colorBackground: "#0a0a0a",
          colorInputBackground: "#111111",
          colorInputText: "#ffffff",
          borderRadius: "8px",
        },
        elements: {
          formButtonPrimary: "bg-[#facc15] text-black hover:bg-[#eab308] font-semibold",
          card: "bg-[#0d0d0d] border border-[#1a1a1a]",
          headerTitle: "text-[#facc15] font-bold",
          headerSubtitle: "text-[#a3a3a3]",
          socialButtonsBlockButton: "border-[#1a1a1a] hover:border-[#facc15] text-white",
          formFieldInput: "bg-[#111111] border-[#1a1a1a] focus:border-[#facc15] text-white",
          footerActionLink: "text-[#facc15] hover:text-[#eab308]",
          identityPreviewText: "text-white",
          identityPreviewEditButton: "text-[#facc15]",
        },
      }}
    >
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        </head>
        <body className="antialiased">
          <MobileNavbar />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}

