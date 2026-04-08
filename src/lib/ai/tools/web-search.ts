import { GoogleGenerativeAI } from "@google/generative-ai";

export async function searchWeb(
  args: Record<string, unknown>
): Promise<string> {
  const query = args.query as string;
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) return JSON.stringify({ success: false, error: "GOOGLE_API_KEY not set" });

  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    tools: [{ googleSearchRetrieval: {} }] as never[],
  });

  const result = await model.generateContent(
    `Search the web for: ${query}. Provide a concise summary of the top 3-5 most relevant results with sources.`
  );

  const text = result.response.text();

  return JSON.stringify({
    success: true,
    query,
    results: text,
  });
}
