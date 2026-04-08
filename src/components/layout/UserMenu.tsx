"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

export function UserMenu({
  email,
  compact = false,
}: {
  email: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    const signOutToastId = toast.loading("Signing out...");
    try {
      const response = await fetch("/api/auth/signout", { method: "POST" });
      if (!response.ok) {
        throw new Error("Unable to sign out.");
      }
      toast.success("Signed out.", { id: signOutToastId });
      window.location.href = "/login";
    } catch (error: any) {
      toast.error(error?.message || "Unable to sign out.", { id: signOutToastId });
    }
  }

  const initial = email?.charAt(0).toUpperCase() || "?";
  const menuPositionClasses = compact
    ? "absolute left-full ml-2 bottom-0 w-56"
    : "absolute bottom-full left-0 mb-2 w-56";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 rounded-lg hover:bg-vault-800/50 transition-colors ${
          compact ? "w-10 h-10 justify-center px-0 py-0" : "px-2 py-1.5"
        }`}
        aria-label="Open account menu"
      >
        <div className="w-7 h-7 rounded-full bg-vault-500/30 border border-vault-500/30 flex items-center justify-center text-vault-300 text-xs font-bold">
          {initial}
        </div>
        {!compact && (
          <>
            <span className="text-xs text-vault-400 max-w-30 truncate">{email}</span>
            <svg
              className={`w-3 h-3 text-vault-500 transition-transform ${open ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`${menuPositionClasses} rounded-xl bg-vault-900 border border-vault-700/50 shadow-2xl overflow-hidden z-50`}
          >
            <div className="p-3 border-b border-vault-800">
              <p className="text-xs text-vault-400 truncate">{email}</p>
            </div>
            <div className="p-1.5">
              <a
                href="/settings/profile"
                className="flex items-center gap-2 px-3 py-2 text-sm text-vault-300 rounded-lg hover:bg-vault-800/50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                </svg>
                Settings
              </a>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
