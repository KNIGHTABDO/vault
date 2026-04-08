import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

export function getGeminiModel(modelName = "gemini-2.0-flash") {
  return genAI.getGenerativeModel({ model: modelName });
}

export function getGeminiModelWithTools(
  tools: Record<string, unknown>[],
  modelName = "gemini-2.0-flash"
) {
  return genAI.getGenerativeModel({
    model: modelName,
    tools: [{ functionDeclarations: tools as never[] }],
  });
}

// Generate embedding for memory/vector search
export async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

// Upload file to Gemini Files API
export async function uploadToGemini(file: Buffer, mimeType: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType,
        data: file.toString("base64"),
      },
    },
    "Describe this file briefly. What type is it and what does it contain?",
  ]);

  return {
    description: result.response.text(),
    model,
  };
}

// Analyze file with Gemini multimodal
export async function analyzeFile(
  file: Buffer,
  mimeType: string,
  instruction: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
    messages.length > 10 ? "gemini-2.5-pro" : "gemini-2.0-flash";
  const model = genAI.getGenerativeModel({
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

export { genAI };
