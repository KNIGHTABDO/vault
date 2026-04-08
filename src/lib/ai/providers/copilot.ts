const COPILOT_URL = process.env.COPILOT_API_URL || "http://localhost:4141/v1";
const COPILOT_KEY = process.env.COPILOT_API_KEY || "dummy";

interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: unknown[];
  tool_call_id?: string;
}

interface CopilotOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export async function chatWithCopilot(
  messages: ChatMessage[],
  options: CopilotOptions = {}
): Promise<string> {
  const {
    model = "gpt-4o",
    temperature = 0.7,
    maxTokens = 2048,
    stream = false,
  } = options;

  const response = await fetch(`${COPILOT_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${COPILOT_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Copilot API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

// Streaming version
export async function* streamCopilot(
  messages: ChatMessage[],
  options: CopilotOptions = {}
): AsyncGenerator<string> {
  const {
    model = "gpt-4o",
    temperature = 0.7,
    maxTokens = 2048,
  } = options;

  const response = await fetch(`${COPILOT_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${COPILOT_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Copilot API error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6).trim();
        if (data === "[DONE]") return;
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // Skip malformed JSON
        }
      }
    }
  }
}
