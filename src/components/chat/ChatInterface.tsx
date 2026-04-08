"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { VaultLogo } from "@/components/VaultLogo";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  metadata?: any;
}

interface ToolCall {
  name: string;
  result?: string;
  expanded?: boolean;
}

export function ChatInterface({ conversationId }: { conversationId: string | null }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(conversationId);
  const [provider, setProvider] = useState("gemini");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load messages when conversation changes
  useEffect(() => {
    if (conversationId) {
      setActiveConversationId(conversationId);
      loadMessages(conversationId);
    } else {
      setActiveConversationId(null);
      setMessages([]);
    }
  }, [conversationId]);

  const loadMessages = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {}
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking, toolCalls]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput("");
    setLoading(true);
    setThinking(true);
    setToolCalls([]);

    // Add user message to UI
    const tempUserId = "temp-" + Date.now();
    setMessages(prev => [...prev, { id: tempUserId, role: "user", content: userMessage, created_at: new Date().toISOString() }]);

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
          provider,
          tools: true,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Chat error");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No stream");

      // Add assistant message placeholder
      const tempAsstId = "temp-asst-" + Date.now();
      setMessages(prev => [...prev, { id: tempAsstId, role: "assistant", content: "", created_at: new Date().toISOString() }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);

            if (parsed.type === "conversation_id" && parsed.id) {
              currentConvId = parsed.id;
              setActiveConversationId(parsed.id);
              // Update URL without reload
              window.history.replaceState(null, "", `/chat/${parsed.id}`);
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
                  updated[lastIdx] = { ...updated[lastIdx], content: `Error: ${parsed.error}` };
                }
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (updated[lastIdx]?.role === "assistant" && !updated[lastIdx].content) {
            updated[lastIdx] = { ...updated[lastIdx], content: `Error: ${err.message}` };
          } else if (updated[lastIdx]?.role === "user") {
            updated.push({ id: "err-" + Date.now(), role: "assistant", content: `Error: ${err.message}`, created_at: new Date().toISOString() });
          }
          return updated;
        });
      }
    } finally {
      setLoading(false);
      setThinking(false);
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

  const toolIcons: Record<string, string> = {
    run_terminal_command: "$",
    read_file: "📄",
    write_file: "✏️",
    store_memory: "🧠",
    search_memory: "🔍",
  };

  return (
    <div className="flex flex-col h-full bg-vault-950">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {messages.length === 0 && !loading ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
              <div className="mb-6 flex justify-center">
                <VaultLogo size="xl" theme="amber" />
              </div>
              <h2 className="font-display text-3xl md:text-4xl text-vault-100 mb-3">What can I help with?</h2>
              <p className="text-sm text-vault-400 mb-8 max-w-md">Ask me anything. I can write code, search the web, manage files, and remember things for you.</p>
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
                  <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-br-md bg-vault-500/15 border border-vault-500/20 text-vault-100 text-sm leading-relaxed">
                    {msg.content}
                  </div>
                ) : (
                  <div className="max-w-[85%]">
                    <div className="prose-vault text-sm leading-relaxed">
                      {msg.content ? <ReactMarkdown>{msg.content}</ReactMarkdown> : null}
                      {loading && idx === messages.length - 1 && !msg.content && thinking && (
                        <ThinkingSpinner />
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
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-vault-800/40 bg-vault-950/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-end gap-2">
            {/* Provider selector */}
            <div className="flex gap-1 mb-1">
              {["gemini", "copilot"].map(p => (
                <button key={p} onClick={() => setProvider(p)}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${provider === p ? "bg-vault-500/20 text-vault-300 border border-vault-500/30" : "text-vault-500 hover:text-vault-400 border border-transparent"}`}>
                  {p === "gemini" ? "Gemini" : "Copilot"}
                </button>
              ))}
            </div>
          </div>
          <div className="relative flex items-end gap-2 mt-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 px-4 py-3 rounded-xl bg-vault-900/70 border border-vault-700/40 text-vault-100 placeholder-vault-500 text-sm resize-none focus:outline-none focus:border-vault-500/50 transition-colors leading-relaxed"
              style={{ maxHeight: "200px" }}
            />
            {loading ? (
              <button onClick={handleStop}
                className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 hover:bg-red-500/25 transition-all mb-0.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
              </button>
            ) : (
              <button onClick={handleSend} disabled={!input.trim()}
                className="p-2.5 rounded-xl bg-vault-500/20 border border-vault-500/30 text-vault-300 hover:bg-vault-500/30 disabled:opacity-30 disabled:hover:bg-vault-500/20 transition-all mb-0.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            )}
          </div>
          <p className="text-[10px] text-vault-600 mt-2 text-center">Vault can make mistakes. Verify important information.</p>
        </div>
      </div>
    </div>
  );
}

// Thinking spinner - like ChatGPT
function ThinkingSpinner() {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="relative w-8 h-8">
        <motion.div className="absolute inset-0 rounded-full border-2 border-vault-500/20 border-t-vault-400"
          animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
        <motion.div className="absolute inset-1 rounded-full border border-vault-500/10 border-b-vault-500/40"
          animate={{ rotate: -360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} />
        <motion.div className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
          <div className="w-1.5 h-1.5 rounded-full bg-vault-400" />
        </motion.div>
      </div>
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-vault-400"
            animate={{ y: [0, -6, 0], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity, ease: "easeInOut" }} />
        ))}
      </div>
      <span className="text-xs text-vault-500">Thinking</span>
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
            className="text-violet-400 ml-auto text-[10px]">Running...</motion.span>
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
