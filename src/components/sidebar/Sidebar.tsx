"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquarePlus,
  MessagesSquare,
  Brain,
  FolderOpen,
  CheckSquare,
  Settings,
  LogOut,
  MoreHorizontal,
  Trash2,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string | null;
  updated_at: string;
}

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId?: string;
}

export function Sidebar({ conversations, activeConversationId }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/memory", icon: Brain, label: "Memory" },
    { href: "/files", icon: FolderOpen, label: "Files" },
    { href: "/tasks", icon: CheckSquare, label: "Tasks" },
  ];

  return (
    <aside className="w-[260px] h-screen flex flex-col bg-vault-sidebar border-r border-vault-border-subtle">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-vault-border-subtle">
        <div className="w-6 h-6 rounded-md bg-vault-accent flex items-center justify-center">
          <span className="text-xs font-bold text-black">V</span>
        </div>
        <span className="text-sm font-medium text-vault-text tracking-tight">
          Vault
        </span>
      </div>

      {/* New Chat */}
      <div className="p-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-vault-text-secondary hover:text-vault-text hover:bg-vault-surface-hover transition-colors duration-150"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>New conversation</span>
        </Link>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-3">
        <div className="space-y-0.5">
          {conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={activeConversationId === conv.id}
            />
          ))}
        </div>

        {conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessagesSquare className="w-8 h-8 text-vault-text-ghost mb-3" />
            <p className="text-xs text-vault-text-ghost">No conversations yet</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="border-t border-vault-border-subtle p-3 space-y-0.5">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-150",
              pathname === item.href
                ? "bg-vault-surface-hover text-vault-text"
                : "text-vault-text-tertiary hover:text-vault-text-secondary hover:bg-vault-surface-hover"
            )}
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Settings */}
      <div className="border-t border-vault-border-subtle p-3">
        <Link
          href="/settings"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-vault-text-tertiary hover:text-vault-text-secondary hover:bg-vault-surface-hover transition-colors duration-150"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}

function ConversationItem({
  conversation,
  isActive,
}: {
  conversation: Conversation;
  isActive: boolean;
}) {
  return (
    <Link
      href={`/chat/${conversation.id}`}
      className={cn(
        "group flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors duration-150",
        isActive
          ? "bg-vault-surface-hover text-vault-text"
          : "text-vault-text-secondary hover:text-vault-text hover:bg-vault-surface-hover"
      )}
    >
      <MessagesSquare className="w-3.5 h-3.5 flex-shrink-0 text-vault-text-ghost" />
      <span className="flex-1 truncate">
        {conversation.title || "New conversation"}
      </span>
      <span className="text-2xs text-vault-text-ghost opacity-0 group-hover:opacity-100 transition-opacity">
        {formatRelativeTime(conversation.updated_at)}
      </span>
    </Link>
  );
}
