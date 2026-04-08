"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { VaultLogo } from "@/components/VaultLogo";
import ReactMarkdown from "react-markdown";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  attachments?: ChatAttachment[];
  metadata?: any;
}

type ChatAttachment = {
  id: string;
  name: string;
  mime_type?: string;
  size_bytes?: number;
  parse_status?: "pending" | "processing" | "completed" | "failed" | "binary";
};

interface ToolCall {
  name: string;
  result?: string;
  expanded?: boolean;
}

export function ChatInterface({ conversationId }: { conversationId: string | null }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [thinkingSeconds, setThinkingSeconds] = useState(0);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(conversationId);
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ tone: "neutral" | "success" | "warning" | "error"; text: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const thinkingStartRef = useRef<number | null>(null);

  // Load messages when conversation changes
  useEffect(() => {
    if (conversationId) {
      setActiveConversationId(conversationId);
      loadMessages(conversationId);
    } else {
      setActiveConversationId(null);
      setMessages([]);
      setLoadingHistory(false);
    }
  }, [conversationId]);

  const loadMessages = useCallback(async (id: string) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        const normalized = (data.messages || []).map((message: any) => ({
          id: String(message.id),
          role: message.role === "assistant" ? "assistant" : "user",
          content: typeof message.content === "string" ? message.content : "",
          created_at: typeof message.created_at === "string" ? message.created_at : new Date().toISOString(),
          attachments: normalizeAttachments(message.attachments),
        }));
        setMessages(normalized);
      }
    } catch {}
    finally {
      setLoadingHistory(false);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking, toolCalls]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 220) + "px";
    }
  }, [input]);

  useEffect(() => {
    if (!thinking) {
      thinkingStartRef.current = null;
      setThinkingSeconds(0);
      return;
    }

    if (!thinkingStartRef.current) {
      thinkingStartRef.current = Date.now();
    }

    const intervalId = window.setInterval(() => {
      if (!thinkingStartRef.current) return;
      const elapsed = Math.max(0, Math.floor((Date.now() - thinkingStartRef.current) / 1000));
      setThinkingSeconds(elapsed);
    }, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [thinking]);

  async function handleSend() {
    if ((!input.trim() && pendingAttachments.length === 0) || loading) return;

    const userMessage = input.trim();
    const outgoingAttachments = pendingAttachments;
    setInput("");
    setPendingAttachments([]);
    setLoading(true);
    setThinking(true);
    setThinkingSeconds(0);
    setToolCalls([]);
    setUploadStatus(null);

    // Add user message to UI
    const tempUserId = "temp-" + Date.now();
    setMessages(prev => [
      ...prev,
      {
        id: tempUserId,
        role: "user",
        content: userMessage,
        attachments: outgoingAttachments,
        created_at: new Date().toISOString(),
      },
    ]);

    let assistantContent = "";
    let currentConvId = activeConversationId;

    try {
      abortRef.current = new AbortController();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }].map(m => ({ role: m.role, content: m.content })),
          conversationId: currentConvId,
          tools: true,
          attachments: outgoingAttachments.map((attachment) => ({
            id: attachment.id,
            name: attachment.name,
            mimeType: attachment.mime_type,
            sizeBytes: attachment.size_bytes,
          })),
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        let message = "Vault could not respond right now. Please try again.";
        try {
          const err = await res.json();
          if (typeof err?.error === "string" && err.error.trim()) {
            message = err.error;
          }
        } catch {}
        throw new Error(message);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No stream");

      // Add assistant message placeholder
      const tempAsstId = "temp-asst-" + Date.now();
      setMessages(prev => [...prev, { id: tempAsstId, role: "assistant", content: "", created_at: new Date().toISOString() }]);

      let sseBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const events = sseBuffer.split("\n\n");
        sseBuffer = events.pop() || "";

        for (const event of events) {
          const dataLine = event.split("\n").find(line => line.startsWith("data: "));
          if (!dataLine) continue;

          const data = dataLine.slice(6).trim();
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);

            if (parsed.type === "conversation_id" && parsed.id) {
              currentConvId = parsed.id;
              setActiveConversationId(parsed.id);
              // Update URL without reload
              window.history.replaceState(null, "", `/chat/${parsed.id}`);
            }

            if (parsed.type === "phase" && typeof parsed.text === "string") {
              setThinking(true);
            }

            if (parsed.type === "content") {
              setThinking(false);
              assistantContent += parsed.text;
              setMessages(prev => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (updated[lastIdx]?.role === "assistant") {
                  updated[lastIdx] = { ...updated[lastIdx], content: assistantContent };
                }
                return updated;
              });
            }

            if (parsed.type === "tool_start") {
              setToolCalls(prev => [...prev, { name: parsed.name, expanded: true }]);
            }

            if (parsed.type === "tool_result") {
              setToolCalls(prev => {
                const updated = [...prev];
                const idx = updated.findIndex(t => t.name === parsed.name && !t.result);
                if (idx >= 0) updated[idx] = { ...updated[idx], result: parsed.result };
                return updated;
              });
            }

            if (parsed.type === "error") {
              assistantContent = parsed.error;
              setMessages(prev => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (updated[lastIdx]?.role === "assistant") {
                  updated[lastIdx] = { ...updated[lastIdx], content: parsed.error };
                }
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        const fallbackMessage = err?.message || "Vault could not respond right now. Please try again.";
        setMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (updated[lastIdx]?.role === "assistant" && !updated[lastIdx].content) {
            updated[lastIdx] = { ...updated[lastIdx], content: fallbackMessage };
          } else if (updated[lastIdx]?.role === "user") {
            updated.push({ id: "err-" + Date.now(), role: "assistant", content: fallbackMessage, created_at: new Date().toISOString() });
          }
          return updated;
        });
      }
    } finally {
      setLoading(false);
      setThinking(false);
      setThinkingSeconds(0);
      abortRef.current = null;
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  async function handleQuickUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile || uploadingFile) return;

    setUploadingFile(true);
    setUploadStatus({ tone: "neutral", text: "Uploading and indexing file..." });

    const uploadToastId = toast.loading(`Uploading ${selectedFile.name}...`);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const text = "You need to be signed in before uploading files.";
        setUploadStatus({ tone: "error", text });
        toast.error(text, { id: uploadToastId });
        return;
      }

      const safeName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${user.id}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase
        .storage
        .from("vault-files")
        .upload(storagePath, selectedFile, { upsert: false });

      if (uploadError) throw new Error(uploadError.message);

      const metadataRes = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedFile.name,
          mimeType: selectedFile.type || "application/octet-stream",
          sizeBytes: selectedFile.size,
          storagePath,
        }),
      });

      if (!metadataRes.ok) {
        const payload = await metadataRes.json();
        throw new Error(payload.error || "Unable to index uploaded file");
      }

      const payload = await metadataRes.json();
      if (payload.file) {
        const normalizedAttachment = normalizeAttachment(payload.file);
        if (normalizedAttachment) {
          setPendingAttachments((prev) => {
            if (prev.some((attachment) => attachment.id === normalizedAttachment.id)) return prev;
            return [...prev, normalizedAttachment];
          });
        }

        const parseStatus = String(payload.file.parse_status || "");
        if (parseStatus === "completed" || parseStatus === "binary") {
          toast.success(`${selectedFile.name} is ready for context.`, { id: uploadToastId });
          setUploadStatus({ tone: "success", text: `Attached ${selectedFile.name} to your next message.` });
        } else if (parseStatus === "failed") {
          toast.error(`${selectedFile.name} uploaded, but indexing failed.`, { id: uploadToastId });
          setUploadStatus({
            tone: "error",
            text: `Attached ${selectedFile.name}, but indexing failed. You can retry from Files.`,
          });
        } else {
          toast.success(`${selectedFile.name} uploaded. Indexing is still running.`, { id: uploadToastId });
          setUploadStatus({
            tone: "warning",
            text: `Attached ${selectedFile.name}. Indexing is still processing.`,
          });
        }
      }
    } catch (err: any) {
      const text = err?.message || "File upload failed";
      setUploadStatus({ tone: "error", text });
      toast.error(text, { id: uploadToastId });
    } finally {
      setUploadingFile(false);
      e.target.value = "";
      window.setTimeout(() => setUploadStatus(null), 5000);
    }
  }

  const toolIcons: Record<string, string> = {
    run_terminal_command: "$",
    read_file: "📄",
    write_file: "✏️",
    store_memory: "🧠",
    search_memory: "🔍",
  };

  const lastMessage = messages[messages.length - 1];
  const shouldShowFallbackThinking = thinking && (
    !lastMessage ||
    lastMessage.role !== "assistant" ||
    Boolean(lastMessage.content)
  );

  return (
    <div className="flex flex-col h-full bg-vault-950">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loadingHistory ? (
          <ChatHistorySkeleton />
        ) : messages.length === 0 && !loading ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
              <div className="mb-6 flex justify-center">
                <VaultLogo size="xl" theme="amber" />
              </div>
              <h2 className="font-display text-3xl md:text-4xl text-vault-100 mb-3">What can I help with?</h2>
              <p className="text-sm text-vault-400 mb-8 max-w-md">Ask me anything. Available capabilities in this workspace are applied automatically per session.</p>
              <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                {["Explain quantum computing", "Write a Python script", "Search for the latest AI news", "Remember my project goals"].map(prompt => (
                  <button key={prompt} onClick={() => setInput(prompt)}
                    className="px-3 py-2 rounded-lg text-xs text-vault-300 bg-vault-900/50 border border-vault-800/40 hover:border-vault-600/50 hover:bg-vault-800/50 transition-all">
                    {prompt}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          /* Messages */
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {messages.map((msg, idx) => (
              <motion.div key={msg.id || idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "user" ? (
                  <div className="max-w-[85%] flex flex-col items-end gap-2">
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="w-full space-y-2">
                        {msg.attachments.map((attachment) => (
                          <MessageAttachmentCard key={attachment.id} attachment={attachment} />
                        ))}
                      </div>
                    )}
                    {msg.content ? (
                      <div className="px-4 py-3 rounded-2xl rounded-br-md bg-vault-500/15 border border-vault-500/20 text-vault-100 text-sm leading-relaxed">
                        {msg.content}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="max-w-[85%]">
                    <div className="prose-vault text-sm leading-relaxed">
                      {msg.content ? <ReactMarkdown>{msg.content}</ReactMarkdown> : null}
                      {loading && idx === messages.length - 1 && !msg.content && thinking && (
                        <ThinkingLine seconds={thinkingSeconds} />
                      )}
                    </div>
                    {/* Tool calls for this message */}
                    {idx === messages.length - 1 && toolCalls.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {toolCalls.map((tc, tci) => (
                          <ToolCallCard key={tci} name={tc.name} result={tc.result} icon={toolIcons[tc.name] || "⚡"} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
            {shouldShowFallbackThinking && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="flex justify-start"
              >
                <div className="max-w-[85%] w-full">
                  <ThinkingLine seconds={thinkingSeconds} />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-vault-800/40 bg-vault-950/75 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-r from-vault-500/10 via-transparent to-vault-400/10" />
            <div className="relative rounded-2xl border border-vault-700/40 bg-vault-900/85 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
              {pendingAttachments.length > 0 && (
                <div className="px-3 pt-3 flex flex-wrap gap-2">
                  {pendingAttachments.map((attachment) => (
                    <ComposerAttachmentChip
                      key={attachment.id}
                      attachment={attachment}
                      onRemove={() => setPendingAttachments((prev) => prev.filter((row) => row.id !== attachment.id))}
                    />
                  ))}
                </div>
              )}

              <div className="px-4 pt-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message Vault"
                  rows={1}
                  className="w-full bg-transparent text-vault-100 placeholder-vault-500 text-[15px] leading-relaxed resize-none focus:outline-none"
                  style={{ maxHeight: "220px" }}
                />
              </div>

              <div className="flex items-center justify-between px-3 pb-3 pt-2">
                <div className="flex flex-col gap-0.5 pl-1">
                  <p className="text-[11px] text-vault-600">Enter to send, Shift+Enter for a new line</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile || loading}
                    className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-vault-700/40 bg-vault-800/30 text-vault-200 hover:bg-vault-800/50 disabled:opacity-40 transition-colors"
                    aria-label="Upload file"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                    </svg>
                  </button>
                  {loading ? (
                    <button
                      onClick={handleStop}
                      className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-colors"
                      aria-label="Stop response"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() && pendingAttachments.length === 0}
                      className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-vault-500/30 bg-vault-500/20 text-vault-100 hover:bg-vault-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      aria-label="Send message"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m0 0l-5-5m5 5l-5 5" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
            {uploadStatus && (
              <div className={`mt-2 rounded-xl border px-3 py-2 text-xs ${uploadStatusClasses(uploadStatus.tone)}`}>
                {uploadStatus.text}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleQuickUpload}
            />
          </div>

          <p className="text-2xs text-vault-600 mt-2 text-center">Vault can make mistakes. Verify important information.</p>
        </div>
      </div>
    </div>
  );
}

function normalizeAttachment(input: any): ChatAttachment | null {
  if (!input || typeof input !== "object") return null;

  const id = typeof input.id === "string" ? input.id : "";
  const name = typeof input.name === "string" && input.name.trim() ? input.name.trim() : "File";
  if (!id) return null;

  const attachment: ChatAttachment = { id, name };

  if (typeof input.mime_type === "string") {
    attachment.mime_type = input.mime_type;
  } else if (typeof input.mimeType === "string") {
    attachment.mime_type = input.mimeType;
  }

  const size = Number(input.size_bytes ?? input.sizeBytes);
  if (Number.isFinite(size) && size >= 0) {
    attachment.size_bytes = size;
  }

  if (
    input.parse_status === "pending" ||
    input.parse_status === "processing" ||
    input.parse_status === "completed" ||
    input.parse_status === "failed" ||
    input.parse_status === "binary"
  ) {
    attachment.parse_status = input.parse_status;
  }

  return attachment;
}

function normalizeAttachments(input: any): ChatAttachment[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => normalizeAttachment(item))
    .filter((item): item is ChatAttachment => Boolean(item));
}

function formatAttachmentSize(sizeBytes?: number) {
  const bytes = Number(sizeBytes);
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function attachmentStatusLabel(status?: ChatAttachment["parse_status"]) {
  if (status === "completed") return "Indexed";
  if (status === "processing") return "Processing";
  if (status === "failed") return "Failed";
  if (status === "binary") return "Binary";
  return "Pending";
}

function attachmentStatusClasses(status?: ChatAttachment["parse_status"]) {
  if (status === "completed") return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
  if (status === "processing") return "bg-amber-500/10 text-amber-300 border-amber-500/20";
  if (status === "failed") return "bg-red-500/10 text-red-300 border-red-500/20";
  if (status === "binary") return "bg-vault-700/20 text-vault-300 border-vault-600/40";
  return "bg-vault-700/20 text-vault-400 border-vault-700/40";
}

function MessageAttachmentCard({ attachment }: { attachment: ChatAttachment }) {
  const sizeLabel = formatAttachmentSize(attachment.size_bytes);

  return (
    <div className="px-3 py-2 rounded-xl border border-vault-700/40 bg-vault-900/60 text-left">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-vault-200 truncate">{attachment.name}</span>
        <span className={`text-2xs px-1.5 py-0.5 rounded-full border ${attachmentStatusClasses(attachment.parse_status)}`}>
          {attachmentStatusLabel(attachment.parse_status)}
        </span>
      </div>
      <div className="mt-1 text-2xs text-vault-500 flex items-center gap-2">
        {attachment.mime_type && <span>{attachment.mime_type}</span>}
        {sizeLabel && <span>{sizeLabel}</span>}
      </div>
    </div>
  );
}

function ComposerAttachmentChip({
  attachment,
  onRemove,
}: {
  attachment: ChatAttachment;
  onRemove: () => void;
}) {
  const sizeLabel = formatAttachmentSize(attachment.size_bytes);

  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-vault-700/50 bg-vault-800/40 px-2.5 py-1.5 max-w-full">
      <span className="text-xs text-vault-200 truncate max-w-52">{attachment.name}</span>
      <span className={`text-2xs px-1.5 py-0.5 rounded-full border ${attachmentStatusClasses(attachment.parse_status)}`}>
        {attachmentStatusLabel(attachment.parse_status)}
      </span>
      {sizeLabel && <span className="text-2xs text-vault-500">{sizeLabel}</span>}
      <button
        type="button"
        onClick={onRemove}
        className="inline-flex items-center justify-center w-5 h-5 rounded-md border border-vault-700/60 text-vault-400 hover:text-red-300 hover:border-red-500/40 leading-none"
        aria-label={`Remove ${attachment.name}`}
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}

function uploadStatusClasses(tone: "neutral" | "success" | "warning" | "error") {
  if (tone === "success") return "bg-emerald-500/10 border-emerald-500/30 text-emerald-200";
  if (tone === "warning") return "bg-amber-500/10 border-amber-500/30 text-amber-200";
  if (tone === "error") return "bg-red-500/10 border-red-500/30 text-red-200";
  return "bg-vault-800/40 border-vault-700/40 text-vault-300";
}

function ChatHistorySkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {Array.from({ length: 5 }).map((_, index) => {
        const isUser = index % 2 === 1;
        return (
          <div key={index} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div className={`rounded-2xl border border-vault-800/50 bg-vault-900/40 p-3 space-y-2 ${isUser ? "w-56" : "w-72"}`}>
              <div className="skeleton h-3 w-5/6 rounded" />
              <div className="skeleton h-3 w-2/3 rounded" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ThinkingLine({
  seconds,
}: {
  seconds: number;
}) {
  const thinkingLabel = seconds > 0 ? `Thought for ${seconds}s` : "Thinking...";

  return (
    <div className="py-1.5">
      <div className="inline-flex items-center rounded-full border border-vault-700/45 bg-vault-900/35 px-3.5 py-2">
        <motion.span
          className="text-xs font-medium"
          style={{
            backgroundImage: "linear-gradient(90deg, rgba(148,163,184,0.52) 25%, rgba(255,255,255,0.98) 50%, rgba(148,163,184,0.52) 75%)",
            backgroundSize: "200% 100%",
            backgroundPosition: "100% 50%",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "transparent",
          }}
          animate={{ backgroundPosition: ["100% 50%", "-100% 50%"] }}
          transition={{ duration: 2.1, repeat: Infinity, ease: "linear" }}
        >
          {thinkingLabel}
        </motion.span>
      </div>
    </div>
  );
}

// Tool call card
function ToolCallCard({ name, result, icon }: { name: string; result?: string; icon: string }) {
  const [expanded, setExpanded] = useState(false);
  const displayNames: Record<string, string> = {
    run_terminal_command: "Terminal Command",
    read_file: "Read File",
    write_file: "Write File",
    store_memory: "Store Memory",
    search_memory: "Search Memory",
  };

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
      className="rounded-lg border border-violet-500/20 bg-violet-500/5 overflow-hidden">
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-violet-500/5 transition-colors">
        <span className="font-mono text-violet-400">{icon}</span>
        <span className="text-violet-300 font-medium">{displayNames[name] || name}</span>
        {result && (
          <span className="text-violet-500/60 ml-auto">
            {expanded ? "▲" : "▼"}
          </span>
        )}
        {!result && (
          <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}
            className="text-violet-400 ml-auto text-2xs">Running...</motion.span>
        )}
      </button>
      <AnimatePresence>
        {expanded && result && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="border-t border-violet-500/10 overflow-hidden">
            <pre className="px-3 py-2 text-[11px] text-violet-300/80 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto scrollbar-thin bg-violet-500/5">
              {result}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
