import { GoogleGenerativeAI } from "@google/generative-ai";

let _genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    const key = process.env.GOOGLE_API_KEY;
    if (!key) throw new Error("GOOGLE_API_KEY is not set");
    _genAI = new GoogleGenerativeAI(key);
  }
  return _genAI;
}

export function getGeminiModel(modelName = "gemini-2.5-flash") {
  return getGenAI().getGenerativeModel({ model: modelName });
}

export function getGeminiModelWithTools(
  tools: Record<string, unknown>[],
  modelName = "gemini-2.5-flash"
) {
  return getGenAI().getGenerativeModel({
    model: modelName,
    tools: [{ functionDeclarations: tools as never[] }],
  });
}

// Generate embedding for memory/vector search
export async function generateEmbedding(text: string): Promise<number[]> {
  const model = getGenAI().getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

// Analyze file with Gemini multimodal
export async function analyzeFile(
  file: Buffer,
  mimeType: string,
  instruction: string
): Promise<string> {
  const model = getGenAI().getGenerativeModel({ model: "gemini-2.5-flash" });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType,
        data: file.toString("base64"),
      },
    },
    instruction,
  ]);

  return result.response.text();
}

// Chat with Gemini (with optional search grounding)
export async function chatWithGemini(
  messages: { role: string; content: string }[],
  options?: {
    searchGrounding?: boolean;
    tools?: Record<string, unknown>[];
    systemPrompt?: string;
  }
) {
  const modelName =
    messages.length > 10 ? "gemini-2.5-pro" : "gemini-2.5-flash";
  const model = getGenAI().getGenerativeModel({
    model: modelName,
    systemInstruction: options?.systemPrompt,
    tools: options?.searchGrounding
      ? [{ googleSearchRetrieval: {} }]
      : options?.tools?.length
        ? [{ functionDeclarations: options.tools as never[] }]
        : undefined,
  });

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1];

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(lastMessage.content);

  return result.response.text();
}

export { getGenAI as genAI };
