import { NextRequest, NextResponse } from "next/server";
import { chatWithCopilot, streamCopilot } from "@/lib/ai/providers/copilot";
import { chatWithGemini } from "@/lib/ai/providers/gemini";
import { routeTask } from "@/lib/ai/router";
import { SYSTEM_PROMPT } from "@/lib/ai/prompts/system";
import { executeTool, getOpenAIToolSchemas } from "@/lib/ai/tools";
import { supabase } from "@/lib/db/client";
import { analyzeFile } from "@/lib/ai/providers/gemini";

interface ChatMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tool_calls?: { id: string; type: string; function: { name: string; arguments: string } }[];
  tool_call_id?: string;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const messagesJson = formData.get("messages") as string;
    const files = formData.getAll("files") as File[];

    const messages: ChatMessage[] = JSON.parse(messagesJson);

    // Process uploaded files
    let fileContext = "";
    if (files.length > 0) {
      for (const file of files) {
        const buffer = Buffer.from(await file.arrayBuffer());
        try {
          const analysis = await analyzeFile(
            buffer,
            file.type,
            "Describe this file briefly. What type is it and what does it contain? Extract any key information."
          );
          fileContext += `\n[Attached file: ${file.name} (${file.type})]\n${analysis}\n`;
        } catch {
          fileContext += `\n[Attached file: ${file.name} — could not analyze]\n`;
        }
      }
    }

    // Route the task
    const route = routeTask("chat", {
      hasFiles: files.length > 0,
      messageCount: messages.length,
    });

    // Build messages with system prompt and file context
    const systemMessage: ChatMessage = {
      role: "system",
      content: SYSTEM_PROMPT + (fileContext ? `\n\n## ATTACHED FILES\n${fileContext}` : ""),
    };

    // Try Copilot first (with streaming), fall back to Gemini
    if (route.provider === "copilot") {
      try {
        const copilotMessages = [systemMessage, ...messages].map((m) => ({
          role: m.role as "system" | "user" | "assistant" | "tool",
          content: m.content,
          tool_calls: m.tool_calls,
          tool_call_id: m.tool_call_id,
        }));

        // Check if we should use tools
        const tools = getOpenAIToolSchemas();

        // First call — might return tool calls
        const response = await fetch(
          `${process.env.COPILOT_API_URL}/chat/completions`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.COPILOT_API_KEY}`,
            },
            body: JSON.stringify({
              model: "gpt-4o",
              messages: copilotMessages,
              tools,
              tool_choice: "auto",
              stream: true,
              temperature: 0.7,
              max_tokens: 2048,
            }),
          }
        );

        if (!response.ok) throw new Error("Copilot failed");

        // Stream the response back
        return new Response(response.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      } catch {
        // Fall through to Gemini
        console.log("Copilot unavailable, falling back to Gemini");
      }
    }

    // Gemini fallback
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    const geminiResponse = await chatWithGemini(
      messages.map((m) => ({ role: m.role, content: m.content })),
      {
        searchGrounding: route.useSearchGrounding,
        systemPrompt: SYSTEM_PROMPT + (fileContext ? `\n\n## ATTACHED FILES\n${fileContext}` : ""),
      }
    );

    // Return as stream for consistency
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(geminiResponse));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
