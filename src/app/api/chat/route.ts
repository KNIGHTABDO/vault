import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { exec } from "child_process";
import { promisify } from "util";
import { readFile, writeFile } from "fs/promises";
import { buildAttachedFilesContextBlock, buildFileContextBlock } from "@/lib/files/processing";
import { getPolicySummary } from "@/lib/site-content";
import { getChangelogSummary } from "@/lib/changelog";

export const runtime = "nodejs";
export const maxDuration = 60;

type ChatRole = "user" | "assistant" | "system" | "tool";
type ChatMessage = { role: ChatRole; content: string };
type ToolCall = { id: string; name: string; arguments: string };
type ChatAttachment = { id: string; name: string; mimeType?: string; sizeBytes?: number };
type PlannedToolCall = { name: string; arguments: Record<string, unknown> };

type GeminiProvider = {
  kind: "gemini";
  client: GoogleGenAI;
  model: string;
};

type OpenAIProvider = {
  kind: "openai";
  source: "copilot-direct" | "copilot-proxy";
  client: OpenAI;
  model: string;
  supportsTools: boolean;
};

type CoordinatorProvider = GeminiProvider | OpenAIProvider;

type ProviderRegistry = {
  gemini: GeminiProvider | null;
  copilotDirect: OpenAIProvider | null;
  copilotProxy: OpenAIProvider | null;
};

const DEFAULT_GEMINI_MODEL = "gemini-3-flash-preview";
const DEFAULT_COPILOT_MODEL = "gpt-4o";
const COPILOT_API_BASE = "https://api.githubcopilot.com";

const COPILOT_HEADERS = {
  "Editor-Version": "vscode/1.99.0",
  "Editor-Plugin-Version": "copilot-chat/0.22.0",
  "Copilot-Integration-Id": "vscode-chat",
  "User-Agent": "GitHubCopilotChat/0.22.0",
};

const execAsync = promisify(exec);

function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
}

function getGitHubToken() {
  return process.env.GITHUB_TOKEN || process.env.COPILOT_API_KEY || null;
}

async function exchangeCopilotBearerToken(githubToken: string): Promise<string | null> {
  try {
    const response = await fetch("https://api.github.com/copilot_internal/v2/token", {
      method: "GET",
      headers: {
        Authorization: `token ${githubToken}`,
        "User-Agent": "vault-ai",
        Accept: "application/json",
      },
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as { token?: string };
    return typeof payload.token === "string" ? payload.token : null;
  } catch {
    return null;
  }
}

async function getProviderRegistry(): Promise<ProviderRegistry> {
  const geminiApiKey = getGeminiApiKey();
  const githubToken = getGitHubToken();

  const gemini: GeminiProvider | null = geminiApiKey
    ? {
        kind: "gemini",
        client: new GoogleGenAI({ apiKey: geminiApiKey }),
        model: process.env.GEMINI_MODEL || process.env.GOOGLE_MODEL || DEFAULT_GEMINI_MODEL,
      }
    : null;

  let copilotDirect: OpenAIProvider | null = null;
  if (githubToken) {
    const copilotBearerToken = await exchangeCopilotBearerToken(githubToken);
    if (copilotBearerToken) {
      copilotDirect = {
        kind: "openai",
        source: "copilot-direct",
        client: new OpenAI({
          apiKey: copilotBearerToken,
          baseURL: COPILOT_API_BASE,
          defaultHeaders: COPILOT_HEADERS,
        }),
        model: process.env.COPILOT_MODEL || DEFAULT_COPILOT_MODEL,
        supportsTools: false,
      };
    }
  }

  let copilotProxy: OpenAIProvider | null = null;
  if (process.env.COPILOT_API_URL) {
    const normalizedUrl = process.env.COPILOT_API_URL.trim();
    const isDirectCopilotUrl = normalizedUrl.startsWith(COPILOT_API_BASE);

    if (!isDirectCopilotUrl) {
      copilotProxy = {
        kind: "openai",
        source: "copilot-proxy",
        client: new OpenAI({
          apiKey: process.env.COPILOT_API_KEY || "dummy",
          baseURL: normalizedUrl,
        }),
        model: process.env.COPILOT_MODEL || DEFAULT_COPILOT_MODEL,
        supportsTools: true,
      };
    }
  }

  return {
    gemini,
    copilotDirect,
    copilotProxy,
  };
}

function selectCoordinator(registry: ProviderRegistry): CoordinatorProvider | null {
  // Copilot is the conversation coordinator when available.
  if (registry.copilotDirect) return registry.copilotDirect;
  if (registry.copilotProxy) return registry.copilotProxy;
  if (registry.gemini) return registry.gemini;
  return null;
}

function getErrorStatus(err: unknown): number {
  if (typeof err === "object" && err !== null && "status" in err) {
    const status = (err as { status?: unknown }).status;
    if (typeof status === "number") return status;
  }

  const message = getErrorMessage(err);
  const statusMatch = message.match(/\b(401|403|404|409|429|5\d\d)\b/);
  if (statusMatch) return Number(statusMatch[1]);

  return 500;
}

function getErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (typeof err === "object" && err !== null && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "Unknown error";
}

function toSafeErrorMessage(status: number, rawMessage: string): string {
  if (/reported as leaked/i.test(rawMessage)) {
    return "Vault credentials were rejected by an upstream AI service. Rotate the server key and try again.";
  }
  if (status === 401 || status === 403) {
    return "Vault could not authenticate with the AI service. Please try again in a moment.";
  }
  if (status === 429) {
    return "Vault is currently rate limited. Please try again shortly.";
  }
  return "Vault could not generate a response right now. Please try again.";
}

function sanitizeMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return [];

  return input
    .filter((item): item is { role?: unknown; content?: unknown } => typeof item === "object" && item !== null)
    .map((item) => ({ role: item.role, content: item.content }))
    .filter(
      (item): item is ChatMessage =>
        (item.role === "user" || item.role === "assistant" || item.role === "system" || item.role === "tool") &&
        typeof item.content === "string"
    );
}

function sanitizeAttachments(input: unknown): ChatAttachment[] {
  if (!Array.isArray(input)) return [];

  const deduped = new Map<string, ChatAttachment>();

  for (const item of input) {
    if (typeof item !== "object" || item === null) continue;

    const id = String((item as { id?: unknown }).id || "").trim();
    if (!id) continue;

    const nameRaw = (item as { name?: unknown }).name;
    const mimeTypeRaw = (item as { mimeType?: unknown; mime_type?: unknown }).mimeType ?? (item as { mime_type?: unknown }).mime_type;
    const sizeBytesRaw = (item as { sizeBytes?: unknown; size_bytes?: unknown }).sizeBytes ?? (item as { size_bytes?: unknown }).size_bytes;

    const attachment: ChatAttachment = {
      id,
      name: typeof nameRaw === "string" && nameRaw.trim() ? nameRaw.trim() : "File",
    };

    if (typeof mimeTypeRaw === "string" && mimeTypeRaw.trim()) {
      attachment.mimeType = mimeTypeRaw.trim();
    }

    const parsedSize = Number(sizeBytesRaw);
    if (Number.isFinite(parsedSize) && parsedSize >= 0) {
      attachment.sizeBytes = parsedSize;
    }

    deduped.set(id, attachment);
    if (deduped.size >= 12) break;
  }

  return Array.from(deduped.values());
}

function shouldInjectPolicyContext(prompt: string) {
  const normalized = prompt.toLowerCase();
  return /privacy|terms|legal|policy|policies/.test(normalized);
}

function shouldInjectChangelogContext(prompt: string) {
  const normalized = prompt.toLowerCase();
  return /changelog|release|what'?s new|updates|roadmap/.test(normalized);
}

function likelyNeedsActionTools(prompt: string) {
  const normalized = prompt.toLowerCase();
  return /remember|memory|task|todo|to-do|privacy|terms|legal|changelog|release|update/.test(normalized);
}

function extractJsonCandidate(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const trimmed = text.trim();
  const firstBrace = trimmed.indexOf("{");
  const firstBracket = trimmed.indexOf("[");

  const startsWithObject = firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket);
  if (startsWithObject) {
    const lastBrace = trimmed.lastIndexOf("}");
    if (lastBrace > firstBrace) return trimmed.slice(firstBrace, lastBrace + 1);
  }

  if (firstBracket !== -1) {
    const lastBracket = trimmed.lastIndexOf("]");
    if (lastBracket > firstBracket) return trimmed.slice(firstBracket, lastBracket + 1);
  }

  return trimmed;
}

function parsePlannedToolCalls(text: string): PlannedToolCall[] {
  const candidate = extractJsonCandidate(text);

  try {
    const parsed = JSON.parse(candidate) as unknown;
    const rawCalls = Array.isArray(parsed)
      ? parsed
      : typeof parsed === "object" && parsed !== null && Array.isArray((parsed as { calls?: unknown }).calls)
        ? (parsed as { calls: unknown[] }).calls
        : [];

    const allowedTools = new Set([
      "store_memory",
      "search_memory",
      "create_task",
      "list_tasks",
      "update_task",
      "delete_task",
      "get_policy_page",
      "get_changelog",
    ]);

    return rawCalls
      .filter((entry): entry is { name?: unknown; arguments?: unknown } => typeof entry === "object" && entry !== null)
      .map((entry) => ({
        name: typeof entry.name === "string" ? entry.name : "",
        arguments: typeof entry.arguments === "object" && entry.arguments !== null ? (entry.arguments as Record<string, unknown>) : {},
      }))
      .filter((entry) => allowedTools.has(entry.name))
      .slice(0, 3);
  } catch {
    return [];
  }
}

async function planFallbackToolCallsWithGemini(args: {
  gemini: GeminiProvider;
  messages: ChatMessage[];
  latestPrompt: string;
}) {
  const transcript = args.messages
    .slice(-6)
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n\n");

  const plannerPrompt = [
    "You are a strict tool planner for Vault.",
    "Convert the user intent into up to 3 tool calls.",
    "Only include calls when clearly requested.",
    "Return JSON only with shape: {\"calls\": [{\"name\": string, \"arguments\": object}]}",
    "Available tools and arguments:",
    "- store_memory: { key: string, value: string, importance?: 'low'|'medium'|'high' }",
    "- search_memory: { query: string }",
    "- create_task: { content: string, dueDate?: string }",
    "- list_tasks: { status?: 'all'|'open'|'done', limit?: number }",
    "- update_task: { taskId: string, completed?: boolean, content?: string, dueDate?: string|null }",
    "- delete_task: { taskId: string }",
    "- get_policy_page: { topic?: 'privacy'|'terms'|'all' }",
    "- get_changelog: { limit?: number }",
    "If there is no action request, return {\"calls\": []}.",
    "",
    "Recent conversation:",
    transcript,
    "",
    "Latest user message:",
    args.latestPrompt,
  ].join("\n");

  const response = await args.gemini.client.models.generateContent({
    model: args.gemini.model,
    contents: plannerPrompt,
    config: {
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.MEDIUM,
      },
    },
  });

  return parsePlannedToolCalls(response.text || "");
}

function mergeFileContextResults(
  ...results: Array<{ context: string; references: string[] }>
) {
  const contextBlocks = results
    .map((result) => result.context.trim())
    .filter(Boolean);

  const references = results
    .flatMap((result) => result.references || [])
    .map((reference) => String(reference || "").trim())
    .filter(Boolean);

  return {
    context: contextBlocks.join("\n\n"),
    references,
  };
}

async function createConversation(supabase: any, userId: string, title: string): Promise<string | null> {
  const attempts = [
    { user_id: userId, title },
    { user_id: userId, title, provider: "vault", model: "vault" },
  ];

  for (const payload of attempts) {
    const { data, error } = await supabase.from("conversations").insert(payload).select("id").single();
    if (!error && data?.id) return data.id;
  }

  return null;
}

async function saveAssistantMessage(
  supabase: any,
  conversationId: string,
  content: string,
  toolCalls: ToolCall[]
) {
  const basePayload = {
    conversation_id: conversationId,
    role: "assistant",
    content,
  };

  if (!toolCalls.length) {
    await supabase.from("messages").insert(basePayload);
    return;
  }

  const withToolCalls = {
    ...basePayload,
    tool_calls: toolCalls.map((toolCall) => ({ name: toolCall.name })),
  };

  const { error } = await supabase.from("messages").insert(withToolCalls);
  if (error) {
    await supabase.from("messages").insert(basePayload);
  }
}

function buildGeminiContents(messages: ChatMessage[]) {
  return messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));
}

function getToolDefinitions() {
  return [
    {
      type: "function" as const,
      function: {
        name: "run_terminal_command",
        description: "Run a terminal command and return the output",
        parameters: {
          type: "object",
          properties: {
            command: { type: "string", description: "The command to run" },
          },
          required: ["command"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "read_file",
        description: "Read the contents of a file",
        parameters: {
          type: "object",
          properties: {
            path: { type: "string", description: "File path to read" },
          },
          required: ["path"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "write_file",
        description: "Write content to a file",
        parameters: {
          type: "object",
          properties: {
            path: { type: "string", description: "File path to write" },
            content: { type: "string", description: "Content to write" },
          },
          required: ["path", "content"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "store_memory",
        description: "Store important information for future reference",
        parameters: {
          type: "object",
          properties: {
            key: { type: "string", description: "Memory key or label" },
            value: { type: "string", description: "Information to remember" },
            importance: {
              type: "string",
              enum: ["low", "medium", "high"],
              description: "Importance level",
            },
          },
          required: ["key", "value"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "search_memory",
        description: "Search stored memories",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
          },
          required: ["query"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "create_task",
        description: "Create a new task for the current user",
        parameters: {
          type: "object",
          properties: {
            content: { type: "string", description: "Task content" },
            dueDate: { type: "string", description: "Optional due date in YYYY-MM-DD format" },
          },
          required: ["content"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "list_tasks",
        description: "List current user tasks",
        parameters: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["all", "open", "done"], description: "Task status filter" },
            limit: { type: "number", description: "Max number of tasks to return" },
          },
          required: [],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "update_task",
        description: "Update task state or content",
        parameters: {
          type: "object",
          properties: {
            taskId: { type: "string", description: "Task identifier" },
            completed: { type: "boolean", description: "Completion state" },
            content: { type: "string", description: "Updated task content" },
            dueDate: { type: ["string", "null"], description: "Set or clear due date" },
          },
          required: ["taskId"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "delete_task",
        description: "Delete an existing task",
        parameters: {
          type: "object",
          properties: {
            taskId: { type: "string", description: "Task identifier" },
          },
          required: ["taskId"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "get_policy_page",
        description: "Get policy details for privacy or terms pages",
        parameters: {
          type: "object",
          properties: {
            topic: { type: "string", enum: ["privacy", "terms", "all"], description: "Policy topic" },
          },
          required: [],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "get_changelog",
        description: "Get recent product changelog entries",
        parameters: {
          type: "object",
          properties: {
            limit: { type: "number", description: "Number of releases to include" },
          },
          required: [],
        },
      },
    },
  ];
}

async function generateGeminiSpecialistBrief(args: {
  gemini: GeminiProvider;
  messages: ChatMessage[];
  fileContext: string;
}) {
  const recentTranscript = args.messages
    .slice(-8)
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n\n");

  const prompt = [
    "You are the specialist analyst for Vault.",
    "Generate concise factual notes for the conversation coordinator.",
    "If you have no useful specialist insights, return exactly: NO_SPECIALIST_NOTES",
    "Do not write the final answer for the user.",
    "",
    "Conversation:",
    recentTranscript,
    "",
    "Retrieved file context:",
    args.fileContext || "No file context available.",
  ].join("\n");

  const response = await args.gemini.client.models.generateContent({
    model: args.gemini.model,
    contents: prompt,
    config: {
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.HIGH,
      },
    },
  });

  const text = response.text?.trim() || "";
  if (!text || text === "NO_SPECIALIST_NOTES") return null;
  return text.slice(0, 4000);
}

function buildSystemPrompt(args: {
  toolsEnabled: boolean;
  fallbackExecutionEnabled: boolean;
  hasGeminiSpecialist: boolean;
  hasFileContext: boolean;
  hasPolicyContext: boolean;
  hasChangelogContext: boolean;
}) {
  const capabilityLines = [
    `- Specialist analysis path: ${args.hasGeminiSpecialist ? "enabled" : "disabled"}`,
    `- File retrieval context: ${args.hasFileContext ? "enabled" : "disabled"}`,
    `- Live tool execution: ${args.toolsEnabled ? "enabled" : "disabled"}`,
    `- Server fallback actions (memory/tasks/legal/changelog): ${args.fallbackExecutionEnabled ? "enabled" : "disabled"}`,
    `- Policy context injection: ${args.hasPolicyContext ? "enabled" : "disabled"}`,
    `- Changelog context injection: ${args.hasChangelogContext ? "enabled" : "disabled"}`,
  ];

  const behavior = args.toolsEnabled
    ? "You may call tools when needed. Only claim a tool was run after receiving its result."
    : args.fallbackExecutionEnabled
      ? "Live tool execution is disabled for this turn, but server fallback actions may already execute memory/task/legal/changelog requests. Use provided tool results when present and never claim memory is unavailable unless a tool result confirms failure."
      : "Live tool execution is disabled for this turn. You may still use provided file context and conversation history, but never claim you executed a tool.";

  return [
    "You are Vault, a precise and practical AI assistant.",
    "You are the conversation-facing coordinator and must produce the final user response.",
    "Never expose internal provider names unless the user explicitly asks for architecture details.",
    "If a capability is unavailable, say so clearly instead of implying success.",
    "When users ask to remember something, manage tasks, or explain privacy/terms/changelog, prioritize those actions and confirmations.",
    behavior,
    "Session capabilities:",
    capabilityLines.join("\n"),
    "When file context is provided, ground your answer in it and cite references as Source 1, Source 2, etc.",
  ].join("\n\n");
}

async function generateConversationTitleWithProvider(
  provider: CoordinatorProvider,
  userPrompt: string
): Promise<string | null> {
  const titlePrompt = `Generate a very short title (max 6 words) for this conversation. Return ONLY the title, no quotes.\n\nUser: ${userPrompt}`;

  if (provider.kind === "gemini") {
    const response = await provider.client.models.generateContent({
      model: provider.model,
      contents: titlePrompt,
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });
    return response.text?.trim().slice(0, 100) || null;
  }

  const response = await provider.client.chat.completions.create({
    model: provider.model,
    messages: [{ role: "user", content: titlePrompt }],
    max_tokens: 30,
  });
  return response.choices[0]?.message?.content?.trim().slice(0, 100) || null;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) => {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const messages = sanitizeMessages(body?.messages);
  const conversationId = typeof body?.conversationId === "string" ? body.conversationId : null;
  const toolsRequested = Boolean(body?.tools);
  const attachments = sanitizeAttachments(body?.attachments);

  if (!messages.length) {
    return NextResponse.json({ error: "No valid messages provided" }, { status: 400 });
  }

  let convId = conversationId;

  if (!convId) {
    const title = messages[messages.length - 1]?.content.slice(0, 80) || "New Chat";
    convId = await createConversation(supabase, user.id, title);
    if (!convId) {
      return NextResponse.json({ error: "Unable to create conversation" }, { status: 500 });
    }
  }

  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.role === "user") {
    const messagePayload = {
      conversation_id: convId,
      role: "user",
      content: lastMessage.content,
      attachments: attachments.length ? attachments : null,
    };

    const { error: insertWithAttachmentsError } = await supabase.from("messages").insert(messagePayload);
    if (insertWithAttachmentsError && attachments.length) {
      await supabase.from("messages").insert({
        conversation_id: convId,
        role: "user",
        content: lastMessage.content,
      });
    }
  }

  const providers = await getProviderRegistry();
  const coordinator = selectCoordinator(providers);

  if (!coordinator) {
    return NextResponse.json(
      { error: "Vault is not configured with an AI backend yet." },
      { status: 500 }
    );
  }

  const latestUserPrompt = [...messages].reverse().find((message) => message.role === "user")?.content || "";

  const attachedFileContext = attachments.length
    ? await buildAttachedFilesContextBlock({
        supabase,
        userId: user.id,
        fileIds: attachments.map((attachment) => attachment.id),
        perFileChunkLimit: 3,
        maxSources: 12,
      })
    : { context: "", references: [] as string[] };

  const semanticFileContext = latestUserPrompt.trim()
    ? await buildFileContextBlock({
        supabase,
        userId: user.id,
        query: latestUserPrompt,
        limit: 6,
      })
    : { context: "", references: [] as string[] };

  const fileContextResult = mergeFileContextResults(attachedFileContext, semanticFileContext);

  let specialistBrief: string | null = null;
  if (providers.gemini && coordinator.kind === "openai") {
    try {
      specialistBrief = await generateGeminiSpecialistBrief({
        gemini: providers.gemini,
        messages,
        fileContext: fileContextResult.context.slice(0, 12000),
      });
    } catch {
      specialistBrief = null;
    }
  }

  const policyContext = shouldInjectPolicyContext(latestUserPrompt)
    ? getPolicySummary("all")
    : "";

  let changelogContext = "";
  if (shouldInjectChangelogContext(latestUserPrompt)) {
    try {
      changelogContext = await getChangelogSummary(3);
    } catch {
      changelogContext = "";
    }
  }

  const toolsEnabled = coordinator.kind === "openai" && coordinator.supportsTools && toolsRequested;
  const fallbackExecutionEnabled = !toolsEnabled && toolsRequested && Boolean(providers.gemini);
  const fallbackToolCalls: ToolCall[] = [];
  const fallbackToolResults: Array<{ name: string; result: string }> = [];

  if (fallbackExecutionEnabled && likelyNeedsActionTools(latestUserPrompt) && providers.gemini) {
    try {
      const plannedCalls = await planFallbackToolCallsWithGemini({
        gemini: providers.gemini,
        messages,
        latestPrompt: latestUserPrompt,
      });

      for (const [index, plannedCall] of plannedCalls.entries()) {
        const result = await executeTool(plannedCall.name, plannedCall.arguments, user.id, supabase);
        fallbackToolCalls.push({
          id: `fallback-${index + 1}`,
          name: plannedCall.name,
          arguments: JSON.stringify(plannedCall.arguments || {}),
        });
        fallbackToolResults.push({ name: plannedCall.name, result });
      }
    } catch {
      // Ignore planner failures and continue with standard response generation.
    }
  }

  const systemPrompt = buildSystemPrompt({
    toolsEnabled,
    fallbackExecutionEnabled,
    hasGeminiSpecialist: Boolean(providers.gemini && coordinator.kind === "openai"),
    hasFileContext: Boolean(fileContextResult.context),
    hasPolicyContext: Boolean(policyContext),
    hasChangelogContext: Boolean(changelogContext),
  });

  const toolDefs = getToolDefinitions();

  try {
    const encoder = new TextEncoder();
    let assistantContent = "";
    const toolCalls: ToolCall[] = [];

    if (coordinator.kind === "gemini") {
      let geminiSystemInstruction = systemPrompt;

      if (fileContextResult.context) {
        const refs = fileContextResult.references.join("\n");
        geminiSystemInstruction += `\n\nRetrieved file context:\n${fileContextResult.context.slice(0, 12000)}\n\nReferences:\n${refs}`;
      }

      if (policyContext) {
        geminiSystemInstruction += `\n\nPolicy reference context:\n${policyContext.slice(0, 8000)}`;
      }

      if (changelogContext) {
        geminiSystemInstruction += `\n\nRecent changelog context:\n${changelogContext.slice(0, 4000)}`;
      }

      if (fallbackToolResults.length) {
        const fallbackSummary = fallbackToolResults
          .map((entry) => `- ${entry.name}: ${entry.result}`)
          .join("\n");
        geminiSystemInstruction += `\n\nServer-executed tool results for this turn:\n${fallbackSummary}`;
      }

      if (specialistBrief) {
        geminiSystemInstruction += `\n\nSpecialist analysis notes:\n${specialistBrief}`;
      }

      const stream = await coordinator.client.models.generateContentStream({
        model: coordinator.model,
        contents: buildGeminiContents(messages),
        config: {
          systemInstruction: geminiSystemInstruction,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
        },
      });

      const readable = new ReadableStream({
        async start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "conversation_id", id: convId })}\n\n`));

          for (const fallback of fallbackToolResults) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "tool_start", name: fallback.name })}\n\n`));
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "tool_result", name: fallback.name, result: fallback.result.slice(0, 2000) })}\n\n`));
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "phase", text: "Analyzing request" })}\n\n`));
          if (fileContextResult.context) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "phase", text: "Using uploaded file context" })}\n\n`));
          }
          if (specialistBrief) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "phase", text: "Integrating specialist notes" })}\n\n`));
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "phase", text: "Generating response" })}\n\n`));

          try {
            for await (const chunk of stream as any) {
              const text = typeof chunk?.text === "string" ? chunk.text : "";
              if (!text) continue;
              assistantContent += text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "content", text })}\n\n`));
            }

            if (assistantContent) {
              await saveAssistantMessage(supabase, convId, assistantContent, fallbackToolCalls);
            }

            if (messages.length === 1 && messages[0].role === "user") {
              try {
                const title = await generateConversationTitleWithProvider(coordinator, messages[0].content);
                if (title) {
                  await supabase.from("conversations").update({ title }).eq("id", convId);
                }
              } catch {}
            }

            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", error: "Vault response stream was interrupted." })}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    const orchestrationMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    if (specialistBrief) {
      orchestrationMessages.push({
        role: "system",
        content: `Specialist analysis notes for this turn:\n${specialistBrief}`,
      });
    }

    if (fileContextResult.context) {
      orchestrationMessages.push({
        role: "system",
        content: [
          "Retrieved file context for grounding:",
          fileContextResult.context.slice(0, 12000),
          "",
          "References:",
          fileContextResult.references.join("\n"),
        ].join("\n"),
      });
    }

    if (policyContext) {
      orchestrationMessages.push({
        role: "system",
        content: `Policy reference context:\n${policyContext.slice(0, 8000)}`,
      });
    }

    if (changelogContext) {
      orchestrationMessages.push({
        role: "system",
        content: `Recent changelog context:\n${changelogContext.slice(0, 4000)}`,
      });
    }

    if (fallbackToolResults.length) {
      orchestrationMessages.push({
        role: "system",
        content: [
          "Server-executed tool results for this turn:",
          ...fallbackToolResults.map((entry) => `- ${entry.name}: ${entry.result}`),
        ].join("\n"),
      });
    }

    orchestrationMessages.push(
      ...messages
        .filter((message): message is typeof message & { role: "user" | "assistant" } =>
          message.role === "user" || message.role === "assistant"
        )
        .map((message) => ({ role: message.role, content: message.content }))
    );

    const stream = await coordinator.client.chat.completions.create({
      model: coordinator.model,
      messages: orchestrationMessages,
      tools: toolsEnabled ? toolDefs : undefined,
      stream: true,
      max_tokens: 4096,
    });

    const readable = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "conversation_id", id: convId })}\n\n`));

        for (const fallback of fallbackToolResults) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "tool_start", name: fallback.name })}\n\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "tool_result", name: fallback.name, result: fallback.result.slice(0, 2000) })}\n\n`));
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "phase", text: "Analyzing request" })}\n\n`));
        if (fileContextResult.context) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "phase", text: "Using uploaded file context" })}\n\n`));
        }
        if (specialistBrief) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "phase", text: "Integrating specialist notes" })}\n\n`));
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "phase", text: "Generating response" })}\n\n`));

        try {
          for await (const chunk of stream as any) {
            const delta = chunk.choices?.[0]?.delta;
            if (!delta) continue;

            if (delta.content) {
              assistantContent += delta.content;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "content", text: delta.content })}\n\n`));
            }

            if (delta.tool_calls) {
              for (const toolCall of delta.tool_calls) {
                if (toolCall.index !== undefined) {
                  if (!toolCalls[toolCall.index]) {
                    toolCalls[toolCall.index] = {
                      id: toolCall.id || "",
                      name: toolCall.function?.name || "",
                      arguments: "",
                    };
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "tool_start", name: toolCall.function?.name || "" })}\n\n`));
                  }

                  if (toolCall.function?.arguments) {
                    toolCalls[toolCall.index].arguments += toolCall.function.arguments;
                  }
                }
              }
            }
          }

          for (const toolCall of toolCalls.filter(Boolean)) {
            if (toolCall.name && toolCall.arguments) {
              let result = "";
              try {
                const args = JSON.parse(toolCall.arguments);
                result = await executeTool(toolCall.name, args, user.id, supabase);
              } catch {
                result = "Failed to parse tool arguments";
              }

              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "tool_result", name: toolCall.name, result: result.slice(0, 2000) })}\n\n`));
            }
          }

          if (assistantContent) {
            await saveAssistantMessage(
              supabase,
              convId,
              assistantContent,
              toolsEnabled ? toolCalls : fallbackToolCalls
            );
          }

          if (messages.length === 1 && messages[0].role === "user") {
            try {
              const title = await generateConversationTitleWithProvider(coordinator, messages[0].content);
              if (title) {
                await supabase.from("conversations").update({ title }).eq("id", convId);
              }
            } catch {}
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", error: "Vault response stream was interrupted." })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const status = getErrorStatus(error);
    const message = getErrorMessage(error);
    return NextResponse.json({ error: toSafeErrorMessage(status, message) }, { status });
  }
}

async function executeTool(name: string, args: any, userId: string, supabase: any): Promise<string> {
  switch (name) {
    case "run_terminal_command":
      try {
        const { stdout, stderr } = await execAsync(args.command, { timeout: 30000 });
        return (stdout + stderr).slice(0, 5000) || "Command executed successfully";
      } catch (error: any) {
        return `Error: ${(error.message || error.stderr || "Unknown error").slice(0, 2000)}`;
      }

    case "read_file":
      try {
        return await readFile(args.path, "utf-8");
      } catch (error: any) {
        return `Error reading file: ${error.message}`;
      }

    case "write_file":
      try {
        const { mkdir } = await import("fs/promises");
        const pathModule = await import("path");
        await mkdir(pathModule.dirname(args.path), { recursive: true });
        await writeFile(args.path, args.content);
        return `File written: ${args.path}`;
      } catch (error: any) {
        return `Error writing file: ${error.message}`;
      }

    case "store_memory":
      try {
        const importanceMap: Record<string, number> = {
          low: 0.3,
          medium: 0.6,
          high: 0.9,
        };

        await supabase.from("memories").insert({
          user_id: userId,
          type: "fact",
          content: args.value,
          source: "conversation",
          importance: importanceMap[args.importance] ?? 0.6,
          metadata: { key: args.key || "memory" },
        });
        return `Memory stored: ${args.key || "memory"}`;
      } catch (error: any) {
        return `Error storing memory: ${error.message}`;
      }

    case "search_memory":
      try {
        const { data } = await supabase
          .from("memories")
          .select("type, content, importance, metadata")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50);

        const query = String(args.query || "").toLowerCase();
        const matched = (data || [])
          .filter((memory: any) => {
            const key = String(memory?.metadata?.key || "").toLowerCase();
            const content = String(memory?.content || "").toLowerCase();
            return key.includes(query) || content.includes(query);
          })
          .slice(0, 5);

        if (!matched.length) return "No memories found";

        return matched
          .map((memory: any) => {
            const key = memory?.metadata?.key || memory?.type || "memory";
            return `[${key}] (${memory.importance}): ${memory.content}`;
          })
          .join("\n");
      } catch (error: any) {
        return `Error searching memory: ${error.message}`;
      }

    case "create_task":
      try {
        const content = String(args.content || "").trim();
        if (!content) return "Error creating task: content is required";

        const dueDate = typeof args.dueDate === "string" && args.dueDate.trim()
          ? args.dueDate.trim()
          : null;

        const payload: {
          user_id: string;
          content: string;
          completed: boolean;
          due_date?: string;
        } = {
          user_id: userId,
          content,
          completed: false,
        };

        if (dueDate) {
          payload.due_date = dueDate;
        }

        const { data, error } = await supabase
          .from("tasks")
          .insert(payload)
          .select("id, content, completed, due_date")
          .single();

        if (error) return `Error creating task: ${error.message}`;

        return `Task created: [${data.id}] ${data.content}${data.due_date ? ` (due ${data.due_date})` : ""}`;
      } catch (error: any) {
        return `Error creating task: ${error.message}`;
      }

    case "list_tasks":
      try {
        const status = String(args.status || "open").toLowerCase();
        const limitRaw = Number(args.limit);
        const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(Math.floor(limitRaw), 30)) : 12;

        let query = supabase
          .from("tasks")
          .select("id, content, completed, due_date, created_at")
          .eq("user_id", userId)
          .order("completed", { ascending: true })
          .order("created_at", { ascending: false })
          .limit(limit);

        if (status === "open") query = query.eq("completed", false);
        if (status === "done") query = query.eq("completed", true);

        const { data, error } = await query;
        if (error) return `Error listing tasks: ${error.message}`;

        if (!data?.length) return "No tasks found";

        return data
          .map((task: any) => {
            const marker = task.completed ? "done" : "open";
            const dueLabel = task.due_date ? ` | due ${task.due_date}` : "";
            return `[${task.id}] (${marker}) ${task.content}${dueLabel}`;
          })
          .join("\n");
      } catch (error: any) {
        return `Error listing tasks: ${error.message}`;
      }

    case "update_task":
      try {
        const taskId = String(args.taskId || args.task_id || "").trim();
        if (!taskId) return "Error updating task: taskId is required";

        const updates: { completed?: boolean; content?: string; due_date?: string | null } = {};

        if (typeof args.completed === "boolean") {
          updates.completed = args.completed;
        }

        if (typeof args.content === "string" && args.content.trim()) {
          updates.content = args.content.trim();
        }

        if (typeof args.dueDate === "string") {
          updates.due_date = args.dueDate.trim() ? args.dueDate.trim() : null;
        }

        if (!Object.keys(updates).length) {
          return "Error updating task: no update fields provided";
        }

        const { data, error } = await supabase
          .from("tasks")
          .update(updates)
          .eq("id", taskId)
          .eq("user_id", userId)
          .select("id, content, completed, due_date")
          .single();

        if (error) return `Error updating task: ${error.message}`;

        const marker = data.completed ? "done" : "open";
        return `Task updated: [${data.id}] (${marker}) ${data.content}${data.due_date ? ` (due ${data.due_date})` : ""}`;
      } catch (error: any) {
        return `Error updating task: ${error.message}`;
      }

    case "delete_task":
      try {
        const taskId = String(args.taskId || args.task_id || "").trim();
        if (!taskId) return "Error deleting task: taskId is required";

        const { error } = await supabase
          .from("tasks")
          .delete()
          .eq("id", taskId)
          .eq("user_id", userId);

        if (error) return `Error deleting task: ${error.message}`;
        return `Task deleted: ${taskId}`;
      } catch (error: any) {
        return `Error deleting task: ${error.message}`;
      }

    case "get_policy_page":
      try {
        const topicRaw = String(args.topic || "all").toLowerCase();
        const topic = topicRaw === "privacy" || topicRaw === "terms" ? topicRaw : "all";
        return getPolicySummary(topic);
      } catch (error: any) {
        return `Error loading policy content: ${error.message}`;
      }

    case "get_changelog":
      try {
        const limitRaw = Number(args.limit);
        const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(Math.floor(limitRaw), 6)) : 3;
        const summary = await getChangelogSummary(limit);
        return summary || "No changelog entries are currently available";
      } catch (error: any) {
        return `Error loading changelog: ${error.message}`;
      }

    default:
      return `Unknown tool: ${name}`;
  }
}
