"use client";

import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#09090b] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-2xl bg-[#0f0f12] border border-[#27272a] flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-6 h-6 text-[#ef4444]" />
          </div>

          <h1
            className="text-4xl tracking-tight mb-2"
            style={{ fontFamily: "Georgia, serif", color: "#fafafa" }}
          >
            500
          </h1>
          <p className="text-sm mb-8 leading-relaxed" style={{ color: "#52525b" }}>
            Something went wrong on our end.
            <br />
            We&apos;re looking into it.
          </p>

          <div className="flex items-center gap-3 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm transition-all duration-150"
              style={{
                background: "#0f0f12",
                borderColor: "#27272a",
                color: "#a1a1aa",
              }}
            >
              Try again
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm transition-all duration-150"
              style={{
                background: "#0f0f12",
                borderColor: "#27272a",
                color: "#a1a1aa",
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              Go home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
