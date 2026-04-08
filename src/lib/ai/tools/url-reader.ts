import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function readUrl(
  args: Record<string, unknown>
): Promise<string> {
  const url = args.url as string;

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent([
    `Read and summarize this URL: ${url}\n\nProvide a clear summary of the key points. Include the title and main topics.`,
  ]);

  return JSON.stringify({
    success: true,
    url,
    summary: result.response.text(),
  });
}
