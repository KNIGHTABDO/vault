import { supabase } from "@/lib/db/client";
import { analyzeFile } from "@/lib/ai/providers/gemini";

export async function analyzeFileTool(
  args: Record<string, unknown>
): Promise<string> {
  const fileId = args.fileId as string;
  const instruction = args.instruction as string;

  // Get file record
  const { data: file, error } = await supabase
    .from("files")
    .select("*")
    .eq("id", fileId)
    .single();

  if (error || !file) {
    return JSON.stringify({ success: false, error: "File not found" });
  }

  const fileRecord = file as {
    storage_path: string;
    mime_type: string;
    name: string;
  };

  // Download file from Supabase Storage
  const { data: fileData, error: downloadError } = await supabase.storage
    .from("vault-files")
    .download(fileRecord.storage_path);

  if (downloadError || !fileData) {
    return JSON.stringify({
      success: false,
      error: "Could not download file",
    });
  }

  // Convert to buffer
  const arrayBuffer = await fileData.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Analyze with Gemini
  const analysis = await analyzeFile(buffer, fileRecord.mime_type, instruction);

  // Save analysis to file record
  await supabase.from("files").update({ analysis }).eq("id", fileId);

  return JSON.stringify({
    success: true,
    fileName: fileRecord.name,
    analysis,
  });
}
