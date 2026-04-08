"use client";

import { useState } from "react";
import { FolderOpen, Upload, Search, Image, FileText, Music, Video, Code, File } from "lucide-react";
import { formatFileSize, formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface FileItem {
  id: string;
  name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

const MOCK_FILES: FileItem[] = [
  { id: "1", name: "anatomy-notes.pdf", mime_type: "application/pdf", size_bytes: 2400000, created_at: new Date().toISOString() },
  { id: "2", name: "schedule-2026.png", mime_type: "image/png", size_bytes: 850000, created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: "3", name: "voice-memo-lecture.ogg", mime_type: "audio/ogg", size_bytes: 4200000, created_at: new Date(Date.now() - 172800000).toISOString() },
];

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.startsWith("audio/")) return Music;
  if (mimeType.startsWith("video/")) return Video;
  if (mimeType.includes("pdf") || mimeType.includes("document")) return FileText;
  if (mimeType.includes("javascript") || mimeType.includes("json") || mimeType.includes("typescript")) return Code;
  return File;
}

export default function FilesPage() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_FILES.filter((f) =>
    search ? f.name.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto py-8 px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <FolderOpen className="w-5 h-5 text-vault-accent" />
            <h1 className="text-lg font-medium text-vault-text">Files</h1>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-vault-text-secondary hover:text-vault-text bg-vault-surface border border-vault-border-subtle hover:border-vault-border transition-colors">
            <Upload className="w-3.5 h-3.5" />
            Upload
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-text-ghost" />
          <input
            type="text"
            placeholder="Search files…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-vault-surface border border-vault-border-subtle text-sm text-vault-text placeholder:text-vault-text-ghost outline-none focus:border-vault-border-hover transition-colors"
          />
        </div>

        {/* File list */}
        <div className="space-y-1.5">
          {filtered.map((file) => {
            const Icon = getFileIcon(file.mime_type);
            return (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-vault-border-subtle bg-vault-surface hover:bg-vault-surface-hover transition-colors cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-vault-surface-hover flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-vault-text-tertiary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-vault-text truncate">{file.name}</p>
                  <p className="text-2xs text-vault-text-ghost">
                    {formatFileSize(file.size_bytes)} · {formatRelativeTime(file.created_at)}
                  </p>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <FolderOpen className="w-8 h-8 text-vault-text-ghost mx-auto mb-3" />
              <p className="text-sm text-vault-text-ghost">No files yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
