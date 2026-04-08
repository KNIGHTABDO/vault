"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { VaultLogo } from "@/components/VaultLogo";
import { UserMenu } from "./UserMenu";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [email, setEmail] = useState("");

  const activeId = pathname.startsWith("/chat/") ? pathname.split("/chat/")[1] : null;

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchConversations();
    // Poll for updates
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  useEffect(() => {
    async function getUser() {
      try {
        const supabase = (await import("@/lib/supabase/client")).createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) setEmail(user.email);
      } catch {}
    }
    getUser();
  }, []);

  async function handleNewChat() {
    router.push("/chat");
  }

  async function handleDelete(id: string) {
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeId === id) router.push("/chat");
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  const grouped: Record<string, Conversation[]> = {};
  conversations.forEach((c) => {
    const key = formatDate(c.updated_at);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(c);
  });

  const navItems = [
    { href: "/chat", label: "Chat", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
    { href: "/memory", label: "Memory", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
    { href: "/files", label: "Files", icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" },
    { href: "/tasks", label: "Tasks", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
    { href: "/settings", label: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
  ];

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ width: 260 }}
        animate={{ width: collapsed ? 56 : 260 }}
        transition={{ duration: 0.2 }}
        className="h-screen bg-vault-950 border-r border-vault-800/60 flex flex-col overflow-hidden relative z-20"
      >
        {/* Header */}
        <div className="p-3 flex items-center justify-between border-b border-vault-800/40">
          <button onClick={() => router.push("/chat")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <VaultLogo size="sm" animate={false} />
            {!collapsed && <span className="font-display text-sm text-vault-300">vault</span>}
          </button>
          <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg hover:bg-vault-800/50 text-vault-500 hover:text-vault-300 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d={collapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
            </svg>
          </button>
        </div>

        {/* New Chat */}
        <div className="p-2">
          <button onClick={handleNewChat}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium
              bg-vault-500/15 border border-vault-500/20 text-vault-300 hover:bg-vault-500/25 transition-all
              ${collapsed ? "justify-center" : ""}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M12 4v16m8-8H4" />
            </svg>
            {!collapsed && "New Chat"}
          </button>
        </div>

        {/* Nav */}
        <nav className="px-2 space-y-0.5">
          {navItems.map(item => (
            <button key={item.href} onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all
                ${pathname.startsWith(item.href) ? "bg-vault-500/15 text-vault-200" : "text-vault-400 hover:bg-vault-800/50 hover:text-vault-300"}
                ${collapsed ? "justify-center" : ""}`}>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {!collapsed && item.label}
            </button>
          ))}
        </nav>

        {/* Conversations */}
        {!collapsed && (
          <div className="flex-1 overflow-y-auto px-2 mt-3 space-y-3 scrollbar-thin">
            {Object.entries(grouped).map(([label, convs]) => (
              <div key={label}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-vault-600 px-2 mb-1">{label}</p>
                <div className="space-y-0.5">
                  {convs.map(conv => (
                    <div key={conv.id} className="group relative">
                      <button onClick={() => router.push(`/chat/${conv.id}`)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all truncate
                          ${activeId === conv.id ? "bg-vault-500/15 text-vault-200 border border-vault-500/20" : "text-vault-400 hover:bg-vault-800/50 hover:text-vault-300 border border-transparent"}`}>
                        {conv.title || "New Chat"}
                      </button>
                      <button onClick={() => handleDelete(conv.id)}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded text-vault-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* User Menu */}
        <div className="p-2 border-t border-vault-800/40">
          <UserMenu email={email} />
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
