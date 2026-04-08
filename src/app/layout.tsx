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
              background: "rgba(20, 20, 23, 0.96)",
              border: "1px solid rgba(63, 63, 70, 0.65)",
              color: "#f4f4f5",
              fontSize: "0.8125rem",
              borderRadius: "12px",
              boxShadow: "0 12px 28px rgba(0, 0, 0, 0.35)",
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
