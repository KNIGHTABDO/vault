import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vault — Your AI, that actually knows you.",
  description:
    "Vault remembers everything you share — files, notes, voice, photos — and becomes the most personal AI you've ever used.",
  keywords: ["AI", "personal assistant", "memory", "multimodal"],
  openGraph: {
    title: "Vault",
    description: "Your AI, that actually knows you.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--vault-surface-elevated)",
              border: "1px solid var(--vault-border)",
              color: "var(--vault-text)",
              fontSize: "0.8125rem",
            },
          }}
          theme="dark"
          richColors={false}
          closeButton
        />
      </body>
    </html>
  );
}
