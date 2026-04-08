import { GoogleGenerativeAI } from "@google/generative-ai";

export async function readUrl(
  args: Record<string, unknown>
): Promise<string> {
  const url = args.url as string;
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) return JSON.stringify({ success: false, error: "GOOGLE_API_KEY not set" });

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const result = await model.generateContent([
    `Read and summarize this URL: ${url}\n\nProvide a clear summary of the key points. Include the title and main topics.`,
  ]);

  return JSON.stringify({
    success: true,
    url,
    summary: result.response.text(),
  });
}
