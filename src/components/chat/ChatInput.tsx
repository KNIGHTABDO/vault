"use client";

import { useRef, useState, useCallback, type KeyboardEvent } from "react";
import { ArrowUp, Paperclip, Mic, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/utils";

interface Attachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  preview?: string;
}

interface ChatInputProps {
  onSend: (message: string, attachments: File[]) => void;
  isStreaming?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function ChatInput({
  onSend,
  isStreaming = false,
  placeholder = "Message Vault…",
  disabled = false,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSend = (message.trim().length > 0 || pendingFiles.length > 0) && !isStreaming && !disabled;

  const handleSend = useCallback(() => {
    if (!canSend) return;
    onSend(message.trim(), pendingFiles);
    setMessage("");
    setAttachments([]);
    setPendingFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [canSend, message, pendingFiles, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAutoGrow = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newAttachments: Attachment[] = files.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      mimeType: file.type,
      preview: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined,
    }));

    setAttachments((prev) => [...prev, ...newAttachments]);
    setPendingFiles((prev) => [...prev, ...files]);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (id: string) => {
    const index = attachments.findIndex((a) => a.id === id);
    if (index === -1) return;

    setAttachments((prev) => prev.filter((a) => a.id !== id));
    setPendingFiles((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  return (
    <div className="relative flex flex-col gap-2 p-3 rounded-xl bg-vault-surface border border-vault-border-subtle focus-within:border-vault-border-hover transition-colors duration-200">
      {/* File attachments preview */}
      {attachments.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-vault-surface-hover border border-vault-border-subtle group"
            >
              {file.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={file.preview}
                  alt={file.name}
                  className="w-5 h-5 rounded object-cover"
                />
              ) : (
                <Paperclip className="w-3.5 h-3.5 text-vault-text-tertiary" />
              )}
              <span className="text-xs text-vault-text-secondary max-w-[120px] truncate">
                {file.name}
              </span>
              <span className="text-2xs text-vault-text-ghost">
                {formatFileSize(file.size)}
              </span>
              <button
                onClick={() => removeAttachment(file.id)}
                className="p-0.5 rounded hover:bg-vault-surface-active text-vault-text-ghost hover:text-vault-text-secondary transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main input: textarea + send button aligned */}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          className="flex-1 bg-transparent resize-none outline-none text-vault-text placeholder:text-vault-text-ghost text-[15px] leading-[1.5] min-h-[24px] max-h-[160px]"
          placeholder={placeholder}
          rows={1}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleAutoGrow();
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          style={{ fieldSizing: "content" } as React.CSSProperties}
        />

        {/* Send button — vertically centered with last line */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 mb-[2px]",
            canSend
              ? "bg-vault-accent hover:bg-vault-accent-hover text-black"
              : "bg-vault-surface-hover text-vault-text-ghost cursor-not-allowed"
          )}
          aria-label="Send message"
        >
          {isStreaming ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowUp className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Bottom action buttons */}
      <div className="flex items-center gap-1">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt,.csv,.json,.md"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 rounded-md hover:bg-vault-surface-hover text-vault-text-ghost hover:text-vault-text-secondary transition-colors duration-150"
          aria-label="Attach file"
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <button
          className="p-1.5 rounded-md hover:bg-vault-surface-hover text-vault-text-ghost hover:text-vault-text-secondary transition-colors duration-150"
          aria-label="Voice memo"
        >
          <Mic className="w-4 h-4" />
        </button>
        <div className="flex-1" />
        <span className="text-2xs text-vault-text-ghost select-none pr-1">
          Enter ↵
        </span>
      </div>
    </div>
  );
}
