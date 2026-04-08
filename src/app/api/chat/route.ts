import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

function getGeminiClient() {
  return new OpenAI({
    apiKey: process.env.GOOGLE_API_KEY!,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  });
}

function getCopilotClient() {
  return new OpenAI({
    apiKey: process.env.COPILOT_API_KEY || "dummy",
    baseURL: process.env.COPILOT_API_URL || "http://localhost:4141/v1",
  });
}

function getClient(provider: string) {
  return provider === "copilot" ? getCopilotClient() : getGeminiClient();
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
  const { messages, conversationId, provider = "gemini", model, tools } = body;

  let convId = conversationId;

  // Create conversation if new
  if (!convId) {
    const title = messages[messages.length - 1]?.content?.slice(0, 80) || "New Chat";
    const { data: conv } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, title, provider, model })
      .select("id")
      .single();
    convId = conv?.id;
  }

  // Save user message
  if (messages.length > 0) {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === "user") {
      await supabase.from("messages").insert({
        conversation_id: convId,
        role: "user",
        content: lastMsg.content,
      });
    }
  }

  // Build system prompt
  const systemMessage = {
    role: "system" as const,
    content: `You are Vault, a helpful AI assistant. You have access to several tools:
- read_file, write_file, edit_file: Read and write files
- list_files: List files in directories
- run_terminal_command: Execute shell commands
- web_search: Search the web
- web_fetch: Fetch web page content
- store_memory: Store important information for future reference
- search_memory: Search stored memories

Always be helpful, concise, and proactive. When you use tools, explain what you\'re doing and why.
If you need to run terminal commands, use run_terminal_command.
If you need to remember something important, use store_memory.`,
  };

  const apiMessages = [systemMessage, ...messages];

  const toolDefs = [
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
            key: { type: "string", description: "Memory key/label" },
            value: { type: "string", description: "Information to remember" },
            importance: { type: "string", enum: ["low", "medium", "high"], description: "Importance level" },
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
  ];

  const client = getClient(provider);
  const modelName = model || (provider === "copilot" ? "gpt-4o" : "gemini-2.0-flash");

  try {
    const stream = await client.chat.completions.create({
      model: modelName,
      messages: apiMessages,
      tools: tools ? toolDefs : undefined,
      stream: true,
      max_tokens: 4096,
    });

    const encoder = new TextEncoder();
    let assistantContent = "";
    let toolCalls: { id: string; name: string; arguments: string }[] = [];

    const readable = new ReadableStream({
      async start(controller) {
        // Send conversation ID first
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "conversation_id", id: convId })}\n\n`));

        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta;
            if (!delta) continue;

            // Handle content
            if (delta.content) {
              assistantContent += delta.content;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "content", text: delta.content })}\n\n`));
            }

            // Handle tool calls
            if (delta.tool_calls) {
              for (const tc of delta.tool_calls) {
                if (tc.index !== undefined) {
                  if (!toolCalls[tc.index]) {
                    toolCalls[tc.index] = { id: tc.id || "", name: tc.function?.name || "", arguments: "" };
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "tool_start", name: tc.function?.name || "" })}\n\n`));
                  }
                  if (tc.function?.arguments) {
                    toolCalls[tc.index].arguments += tc.function.arguments;
                  }
                }
              }
            }
          }

          // Execute tool calls
          for (const tc of toolCalls) {
            if (tc.name && tc.arguments) {
              let result = "";
              try {
                const args = JSON.parse(tc.arguments);
                result = await executeTool(tc.name, args, user.id, supabase);
              } catch {
                result = "Failed to parse tool arguments";
              }
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "tool_result", name: tc.name, result: result.slice(0, 2000) })}\n\n`));
            }
          }

          // Save assistant message
          if (assistantContent) {
            await supabase.from("messages").insert({
              conversation_id: convId,
              role: "assistant",
              content: assistantContent,
              metadata: toolCalls.length > 0 ? { tool_calls: toolCalls.map(t => ({ name: t.name })) } : null,
            });
          }

          // Auto-generate title from first message
          if (messages.length === 1 && messages[0].role === "user") {
            const titlePrompt = `Generate a very short title (max 6 words) for this conversation. Return ONLY the title, no quotes.\n\nUser: ${messages[0].content}`;
            try {
              const titleResponse = await client.chat.completions.create({
                model: modelName,
                messages: [{ role: "user", content: titlePrompt }],
                max_tokens: 30,
              });
              const title = titleResponse.choices[0]?.message?.content?.trim().slice(0, 100);
              if (title) {
                await supabase.from("conversations").update({ title }).eq("id", convId);
              }
            } catch {}
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", error: "Stream interrupted" })}\n\n`));
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
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Model error" }, { status: 500 });
  }
}

// Tool execution
import { exec } from "child_process";
import { promisify } from "util";
import { readFile, writeFile } from "fs/promises";

const execAsync = promisify(exec);

async function executeTool(name: string, args: any, userId: string, supabase: any): Promise<string> {
  switch (name) {
    case "run_terminal_command":
      try {
        const { stdout, stderr } = await execAsync(args.command, { timeout: 30000 });
        return (stdout + stderr).slice(0, 5000) || "Command executed successfully";
      } catch (err: any) {
        return `Error: ${(err.message || err.stderr || "Unknown error").slice(0, 2000)}`;
      }

    case "read_file":
      try {
        return await readFile(args.path, "utf-8");
      } catch (err: any) {
        return `Error reading file: ${err.message}`;
      }

    case "write_file":
      try {
        const { mkdir } = await import("fs/promises");
        const path = await import("path");
        await mkdir(path.dirname(args.path), { recursive: true });
        await writeFile(args.path, args.content);
        return `File written: ${args.path}`;
      } catch (err: any) {
        return `Error writing file: ${err.message}`;
      }

    case "store_memory":
      try {
        await supabase.from("memories").insert({
          user_id: userId,
          key: args.key,
          content: args.value,
          importance: args.importance || "medium",
          embedding_text: `${args.key}: ${args.value}`,
        });
        return `Memory stored: ${args.key}`;
      } catch (err: any) {
        return `Error storing memory: ${err.message}`;
      }

    case "search_memory":
      try {
        const { data } = await supabase
          .from("memories")
          .select("key, content, importance")
          .eq("user_id", userId)
          .or(`key.ilike.%${args.query}%,content.ilike.%${args.query}%`)
          .limit(5);
        if (!data?.length) return "No memories found";
        return data.map((m: any) => `[${m.key}] (${m.importance}): ${m.content}`).join("\n");
      } catch (err: any) {
        return `Error searching memory: ${err.message}`;
      }

    default:
      return `Unknown tool: ${name}`;
  }
}
