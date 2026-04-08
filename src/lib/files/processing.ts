import { createHash } from "crypto";
import { execFile } from "child_process";
import path from "path";
import os from "os";
import { promisify } from "util";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { GoogleGenAI } from "@google/genai";
import * as XLSX from "xlsx";

const DEFAULT_EMBEDDING_MODEL = "gemini-embedding-2-preview";
const DEFAULT_EMBEDDING_DIMENSION = 768;
const MAX_EXTRACTED_TEXT_LENGTH = 1_000_000;
const DEFAULT_CHUNK_SIZE = 1800;
const DEFAULT_CHUNK_OVERLAP = 220;
const MAX_CHUNKS = 220;
const PDF_SCRIPT_TIMEOUT_MS = 120_000;
const PDF_SCRIPT_OUTPUT_MAX_BUFFER = 10 * 1024 * 1024;

const execFileAsync = promisify(execFile);

type ParseStatus = "completed" | "failed" | "binary";

type Chunk = {
  index: number;
  start: number;
  end: number;
  content: string;
};

type ExtractionResult = {
  status: ParseStatus;
  parser: string;
  extractedText: string;
  details: Record<string, unknown>;
  parseError: string | null;
};

type FileChunkMatch = {
  fileId: string;
  fileName: string;
  chunkIndex: number;
  content: string;
  similarity: number;
};

const TEXT_MIME_PREFIXES = ["text/"];
const TEXT_MIME_TYPES = new Set([
  "application/json",
  "application/xml",
  "application/javascript",
  "application/typescript",
  "application/x-sh",
  "application/yaml",
  "application/x-yaml",
  "application/x-ndjson",
  "application/sql",
]);

const TEXT_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".mdx",
  ".json",
  ".jsonl",
  ".csv",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".py",
  ".rb",
  ".go",
  ".rs",
  ".java",
  ".c",
  ".cpp",
  ".h",
  ".hpp",
  ".cs",
  ".swift",
  ".kt",
  ".m",
  ".mm",
  ".sh",
  ".bash",
  ".zsh",
  ".ps1",
  ".toml",
  ".yaml",
  ".yml",
  ".xml",
  ".html",
  ".htm",
  ".css",
  ".scss",
  ".less",
  ".ini",
  ".conf",
  ".env",
  ".log",
  ".sql",
]);

function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
}

function getEmbeddingModel() {
  return process.env.GEMINI_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL;
}

function normalizeText(input: string): string {
  return input.replace(/\u0000/g, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

function decodeText(bytes: Uint8Array): string {
  try {
    const utf8 = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    return normalizeText(utf8);
  } catch {
    const latin1 = new TextDecoder("iso-8859-1", { fatal: false }).decode(bytes);
    return normalizeText(latin1);
  }
}

function getFileExtension(fileName: string): string {
  return path.extname(fileName).toLowerCase();
}

function isTextLike(mimeType: string, extension: string): boolean {
  if (TEXT_EXTENSIONS.has(extension)) return true;
  if (TEXT_MIME_TYPES.has(mimeType)) return true;
  return TEXT_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix));
}

function toPgVector(values: number[]): string {
  const filtered = values.filter((value) => Number.isFinite(value));
  return `[${filtered.join(",")}]`;
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function stripHtmlTags(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitIntoChunks(text: string, maxSize = DEFAULT_CHUNK_SIZE, overlap = DEFAULT_CHUNK_OVERLAP): Chunk[] {
  const chunks: Chunk[] = [];
  let cursor = 0;
  let index = 0;

  while (cursor < text.length && chunks.length < MAX_CHUNKS) {
    let end = Math.min(text.length, cursor + maxSize);

    if (end < text.length) {
      const lineBreak = text.lastIndexOf("\n", end);
      if (lineBreak > cursor + Math.floor(maxSize * 0.45)) {
        end = lineBreak;
      }
    }

    const content = text.slice(cursor, end).trim();
    if (content) {
      chunks.push({ index, start: cursor, end, content });
      index += 1;
    }

    if (end >= text.length) break;
    cursor = Math.max(0, end - overlap);
  }

  return chunks;
}

async function extractPdfText(buffer: Buffer): Promise<ExtractionResult> {
  const scriptResult = await extractPdfTextWithNodeScript(buffer);
  if (scriptResult.status !== "failed") {
    return scriptResult;
  }

  const pdfJsResult = await extractPdfTextWithPdfJs(buffer);
  if (pdfJsResult.status !== "failed") {
    return pdfJsResult;
  }

  const pdfParseResult = await extractPdfTextWithPdfParse(buffer);
  if (pdfParseResult.status !== "failed") {
    return pdfParseResult;
  }

  return {
    status: "failed",
    parser: "pdf",
    extractedText: "",
    details: {
      attemptedParsers: ["pdf-script", "pdfjs-dist", "pdf-parse"],
    },
    parseError: [scriptResult.parseError, pdfJsResult.parseError, pdfParseResult.parseError].filter(Boolean).join(" | "),
  };
}

async function extractPdfTextWithNodeScript(buffer: Buffer): Promise<ExtractionResult> {
  let tempDir = "";

  try {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "vault-pdf-"));
    const inputPath = path.join(tempDir, "input.pdf");
    const outputPath = path.join(tempDir, "output.json");

    await writeFile(inputPath, buffer);

    const scriptPath = path.resolve(process.cwd(), "scripts", "extract-pdf.mjs");
    await execFileAsync(process.execPath, [scriptPath, inputPath, outputPath], {
      timeout: PDF_SCRIPT_TIMEOUT_MS,
      maxBuffer: PDF_SCRIPT_OUTPUT_MAX_BUFFER,
      windowsHide: true,
    });

    const rawOutput = await readFile(outputPath, "utf-8");
    const payload = JSON.parse(rawOutput) as {
      ok?: boolean;
      parser?: string;
      text?: string;
      pages?: number;
      error?: string;
      details?: Record<string, unknown>;
    };

    const extractedText = normalizeText(String(payload?.text || ""));
    const parser = typeof payload?.parser === "string" && payload.parser.trim()
      ? payload.parser.trim()
      : "pdf-script";
    const parseError = typeof payload?.error === "string" ? payload.error : null;

    if (payload?.ok && extractedText) {
      return {
        status: "completed",
        parser,
        extractedText,
        details: payload?.details || {},
        parseError: null,
      };
    }

    if (payload?.ok && !extractedText) {
      return {
        status: "binary",
        parser,
        extractedText: "",
        details: payload?.details || {},
        parseError: null,
      };
    }

    return {
      status: "failed",
      parser,
      extractedText: "",
      details: payload?.details || {},
      parseError: parseError || "PDF script returned no extractable content",
    };
  } catch (error) {
    return {
      status: "failed",
      parser: "pdf-script",
      extractedText: "",
      details: {},
      parseError: error instanceof Error ? error.message : String(error),
    };
  } finally {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}

async function extractPdfTextWithPdfJs(buffer: Buffer): Promise<ExtractionResult> {
  try {
    const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");

    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(buffer),
      disableWorker: true,
      useWorkerFetch: false,
      isEvalSupported: false,
    });

    const pdf = await loadingTask.promise;
    const pageTexts: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();

      const text = textContent.items
        .map((item: any) => {
          if (typeof item?.str === "string") return item.str;
          return "";
        })
        .join(" ");

      const normalized = normalizeText(text);
      if (normalized) {
        pageTexts.push(normalized);
      }
    }

    await pdf.destroy().catch(() => undefined);

    const extractedText = normalizeText(pageTexts.join("\n\n"));

    return {
      status: extractedText ? "completed" : "binary",
      parser: "pdfjs-dist",
      extractedText,
      details: {
        pages: Number(pdf.numPages || 0),
      },
      parseError: null,
    };
  } catch (error) {
    return {
      status: "failed",
      parser: "pdfjs-dist",
      extractedText: "",
      details: {},
      parseError: error instanceof Error ? error.message : String(error),
    };
  }
}

async function extractPdfTextWithPdfParse(buffer: Buffer): Promise<ExtractionResult> {
  try {
    const pdfModule: any = await import("pdf-parse");
    const parser = new pdfModule.PDFParse({ data: buffer });

    try {
      const [textResult, infoResult] = await Promise.all([
        parser.getText(),
        parser.getInfo().catch(() => undefined),
      ]);

      const extractedText = normalizeText(String(textResult?.text || ""));
      const pages = Number(infoResult?.total || textResult?.total || 0);

      return {
        status: extractedText ? "completed" : "binary",
        parser: "pdf-parse",
        extractedText,
        details: {
          pages: Number.isFinite(pages) ? pages : 0,
          info: infoResult?.info || null,
        },
        parseError: null,
      };
    } finally {
      await parser.destroy().catch(() => undefined);
    }
  } catch (error) {
    return {
      status: "failed",
      parser: "pdf-parse",
      extractedText: "",
      details: {},
      parseError: error instanceof Error ? error.message : String(error),
    };
  }
}

async function extractDocxText(buffer: Buffer): Promise<ExtractionResult> {
  try {
    const mammothModule: any = await import("mammoth");
    const result = await mammothModule.extractRawText({ buffer });
    const extractedText = normalizeText(String(result?.value || ""));

    return {
      status: extractedText ? "completed" : "binary",
      parser: "mammoth",
      extractedText,
      details: {
        warnings: Array.isArray(result?.messages) ? result.messages.map((m: any) => String(m.message || "")) : [],
      },
      parseError: null,
    };
  } catch (error) {
    return {
      status: "failed",
      parser: "mammoth",
      extractedText: "",
      details: {},
      parseError: error instanceof Error ? error.message : String(error),
    };
  }
}

function extractSpreadsheetText(buffer: Buffer): ExtractionResult {
  try {
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const sections: string[] = [];

    for (const name of workbook.SheetNames) {
      const worksheet = workbook.Sheets[name];
      const csv = XLSX.utils.sheet_to_csv(worksheet, {
        blankrows: true,
        strip: false,
      });

      sections.push(`### Sheet: ${name}\n${csv}`);
    }

    const extractedText = normalizeText(sections.join("\n\n"));

    return {
      status: extractedText ? "completed" : "binary",
      parser: "xlsx",
      extractedText,
      details: {
        sheets: workbook.SheetNames,
        sheetCount: workbook.SheetNames.length,
      },
      parseError: null,
    };
  } catch (error) {
    return {
      status: "failed",
      parser: "xlsx",
      extractedText: "",
      details: {},
      parseError: error instanceof Error ? error.message : String(error),
    };
  }
}

function extractTextLikeContent(fileName: string, mimeType: string, bytes: Uint8Array): ExtractionResult {
  const extension = getFileExtension(fileName);
  const text = decodeText(bytes);

  if (!text) {
    return {
      status: "binary",
      parser: "text-decoder",
      extractedText: "",
      details: { mimeType, extension },
      parseError: null,
    };
  }

  if (extension === ".json" || mimeType === "application/json") {
    try {
      const parsed = JSON.parse(text);
      const pretty = JSON.stringify(parsed, null, 2);
      return {
        status: "completed",
        parser: "json",
        extractedText: pretty,
        details: {
          keys: typeof parsed === "object" && parsed !== null ? Object.keys(parsed as Record<string, unknown>).length : 0,
        },
        parseError: null,
      };
    } catch {
      return {
        status: "completed",
        parser: "text-decoder",
        extractedText: text,
        details: { invalidJson: true },
        parseError: null,
      };
    }
  }

  if ([".html", ".htm", ".xml"].includes(extension) || mimeType.includes("xml") || mimeType.includes("html")) {
    const stripped = stripHtmlTags(text);
    return {
      status: stripped ? "completed" : "binary",
      parser: "html-strip",
      extractedText: stripped || text,
      details: {
        originalLength: text.length,
        strippedLength: stripped.length,
      },
      parseError: null,
    };
  }

  return {
    status: "completed",
    parser: "text-decoder",
    extractedText: text,
    details: {
      lineCount: text.split("\n").length,
      characterCount: text.length,
    },
    parseError: null,
  };
}

async function extractContent(fileName: string, mimeType: string, bytes: Uint8Array): Promise<ExtractionResult> {
  const extension = getFileExtension(fileName);
  const normalizedMime = mimeType.toLowerCase();
  const buffer = Buffer.from(bytes);

  if (normalizedMime === "application/pdf" || extension === ".pdf") {
    return extractPdfText(buffer);
  }

  if (
    normalizedMime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === ".docx"
  ) {
    return extractDocxText(buffer);
  }

  if (
    normalizedMime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    normalizedMime === "application/vnd.ms-excel" ||
    extension === ".xlsx" ||
    extension === ".xls"
  ) {
    return extractSpreadsheetText(buffer);
  }

  if (isTextLike(normalizedMime, extension)) {
    return extractTextLikeContent(fileName, normalizedMime, bytes);
  }

  return {
    status: "binary",
    parser: "binary",
    extractedText: "",
    details: {
      mimeType: normalizedMime,
      extension,
      message: "Stored as binary file. Content is preserved in storage without lossy conversion.",
    },
    parseError: null,
  };
}

async function embedTexts(texts: string[], fileName: string): Promise<number[][] | null> {
  if (!texts.length) return [];

  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });
  const embeddingModel = getEmbeddingModel();
  const allEmbeddings: number[][] = [];

  const BATCH_SIZE = 16;
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE).map((text) =>
      `task: search result | title: ${fileName || "none"} | text: ${text}`
    );

    const response = await ai.models.embedContent({
      model: embeddingModel,
      contents: batch,
      config: {
        outputDimensionality: DEFAULT_EMBEDDING_DIMENSION,
      },
    });

    const vectors = (response.embeddings || []).map((item) => item.values || []);
    allEmbeddings.push(...vectors);
  }

  return allEmbeddings;
}

function shortenForStorage(text: string): { value: string; truncated: boolean } {
  if (text.length <= MAX_EXTRACTED_TEXT_LENGTH) {
    return { value: text, truncated: false };
  }

  return {
    value: text.slice(0, MAX_EXTRACTED_TEXT_LENGTH),
    truncated: true,
  };
}

export async function processAndIndexStoredFile(params: {
  supabase: any;
  userId: string;
  fileId: string;
  fileName: string;
  mimeType: string;
  storagePath: string;
}) {
  const { supabase, userId, fileId, fileName, mimeType, storagePath } = params;

  const { data: fileBlob, error: downloadError } = await supabase.storage
    .from("vault-files")
    .download(storagePath);

  if (downloadError || !fileBlob) {
    const message = downloadError?.message || "Unable to download file from storage";
    await supabase
      .from("files")
      .update({ parse_status: "failed", parse_error: message })
      .eq("id", fileId)
      .eq("user_id", userId);

    return {
      ok: false,
      reason: message,
    };
  }

  const arrayBuffer = await fileBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const contentSha256 = createHash("sha256").update(bytes).digest("hex");

  const extraction = await extractContent(fileName, mimeType, bytes);

  const extractedText = extraction.extractedText;
  const chunks = extractedText ? splitIntoChunks(extractedText) : [];
  const textsToEmbed = chunks.map((chunk) => chunk.content);

  let vectors: number[][] | null = null;
  let embeddingError: string | null = null;

  if (textsToEmbed.length) {
    try {
      vectors = await embedTexts(textsToEmbed, fileName);
    } catch (error) {
      vectors = null;
      embeddingError = error instanceof Error ? error.message : String(error);
    }
  }

  const storagePayload = shortenForStorage(extractedText);

  await supabase
    .from("file_chunks")
    .delete()
    .eq("file_id", fileId)
    .eq("user_id", userId);

  if (chunks.length) {
    const rows = chunks.map((chunk, index) => {
      const vector = vectors?.[index];
      return {
        file_id: fileId,
        user_id: userId,
        chunk_index: chunk.index,
        content: chunk.content,
        token_estimate: estimateTokens(chunk.content),
        embedding: vector && vector.length ? toPgVector(vector) : null,
        metadata: {
          start: chunk.start,
          end: chunk.end,
          length: chunk.content.length,
        },
      };
    });

    const batchSize = 50;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await supabase.from("file_chunks").insert(batch);
      if (error) {
        embeddingError = embeddingError || error.message;
      }
    }
  }

  const status: ParseStatus = extraction.status === "failed"
    ? "failed"
    : extraction.status === "binary"
      ? "binary"
      : "completed";

  const metadata = {
    ...(extraction.details || {}),
    chunkCount: chunks.length,
    embeddedChunkCount: vectors?.length || 0,
    embeddingModel: vectors ? getEmbeddingModel() : null,
    embeddingDimension: vectors?.[0]?.length || null,
    extractedTextLength: extractedText.length,
    extractedTextTruncated: storagePayload.truncated,
  } as Record<string, unknown>;

  if (embeddingError) {
    metadata.embeddingError = embeddingError;
  }

  const updatePayload: Record<string, unknown> = {
    parse_status: status,
    parser: extraction.parser,
    parse_error: extraction.parseError,
    content_sha256: contentSha256,
    extracted_text: storagePayload.value,
    indexed_at: status === "completed" ? new Date().toISOString() : null,
    metadata,
  };

  await supabase
    .from("files")
    .update(updatePayload)
    .eq("id", fileId)
    .eq("user_id", userId);

  return {
    ok: status !== "failed",
    status,
    chunkCount: chunks.length,
    embeddingError,
  };
}

async function embedQuery(query: string): Promise<number[] | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.embedContent({
    model: getEmbeddingModel(),
    contents: [`task: search result | query: ${query}`],
    config: {
      outputDimensionality: DEFAULT_EMBEDDING_DIMENSION,
    },
  });

  const first = response.embeddings?.[0]?.values;
  if (!first || !first.length) return null;
  return first;
}

export async function findRelevantFileChunks(params: {
  supabase: any;
  userId: string;
  query: string;
  limit?: number;
}): Promise<FileChunkMatch[]> {
  const { supabase, userId, query } = params;
  const limit = Math.max(1, Math.min(params.limit || 6, 20));
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  try {
    const queryEmbedding = await embedQuery(cleanQuery);

    if (queryEmbedding?.length) {
      const { data, error } = await supabase.rpc("match_file_chunks", {
        p_user_id: userId,
        p_query_embedding: toPgVector(queryEmbedding),
        p_match_count: limit,
      });

      if (!error && Array.isArray(data)) {
        return data.map((row: any) => ({
          fileId: String(row.file_id),
          fileName: String(row.file_name || "File"),
          chunkIndex: Number(row.chunk_index || 0),
          content: String(row.content || ""),
          similarity: Number(row.similarity || 0),
        }));
      }
    }
  } catch {
    // Fall through to keyword fallback.
  }

  const keyword = cleanQuery.split(/\s+/).slice(0, 6).join(" ").slice(0, 100);
  if (!keyword) return [];

  try {
    const { data, error } = await supabase
      .from("file_chunks")
      .select("file_id, chunk_index, content, files!inner(name)")
      .eq("user_id", userId)
      .ilike("content", `%${keyword}%`)
      .limit(limit);

    if (error || !Array.isArray(data)) return [];

    return data.map((row: any) => ({
      fileId: String(row.file_id),
      fileName: String(row.files?.name || "File"),
      chunkIndex: Number(row.chunk_index || 0),
      content: String(row.content || ""),
      similarity: 0,
    }));
  } catch {
    return [];
  }
}

export async function buildFileContextBlock(params: {
  supabase: any;
  userId: string;
  query: string;
  limit?: number;
}) {
  const matches = await findRelevantFileChunks(params);

  if (!matches.length) {
    return {
      context: "",
      references: [] as string[],
    };
  }

  const references = matches.map((match, index) =>
    `${index + 1}. ${match.fileName} (chunk ${match.chunkIndex + 1})`
  );

  const context = matches
    .map((match, index) => {
      const header = `[Source ${index + 1}] ${match.fileName} (chunk ${match.chunkIndex + 1})`;
      return `${header}\n${match.content}`;
    })
    .join("\n\n");

  return {
    context,
    references,
  };
}

export async function buildAttachedFilesContextBlock(params: {
  supabase: any;
  userId: string;
  fileIds: string[];
  perFileChunkLimit?: number;
  maxSources?: number;
}) {
  const { supabase, userId } = params;
  const perFileChunkLimit = Math.max(1, Math.min(params.perFileChunkLimit || 3, 8));
  const maxSources = Math.max(1, Math.min(params.maxSources || 12, 20));

  const uniqueFileIds = Array.from(
    new Set((params.fileIds || []).map((fileId) => String(fileId || "").trim()).filter(Boolean))
  );

  const sources: Array<{ fileName: string; chunkIndex: number; content: string }> = [];

  for (const fileId of uniqueFileIds) {
    if (sources.length >= maxSources) break;

    let fileName = "File";
    let chunkRows: Array<{ chunk_index: number; content: string; files?: { name?: string } }> = [];

    try {
      const { data, error } = await supabase
        .from("file_chunks")
        .select("chunk_index, content, files!inner(name)")
        .eq("user_id", userId)
        .eq("file_id", fileId)
        .order("chunk_index", { ascending: true })
        .limit(perFileChunkLimit);

      if (!error && Array.isArray(data) && data.length) {
        chunkRows = data;
      }
    } catch {
      chunkRows = [];
    }

    if (chunkRows.length) {
      fileName = String(chunkRows[0]?.files?.name || "File");

      for (const row of chunkRows) {
        if (sources.length >= maxSources) break;
        sources.push({
          fileName,
          chunkIndex: Number(row.chunk_index || 0),
          content: String(row.content || ""),
        });
      }

      continue;
    }

    try {
      let fallbackName = "File";
      let fallbackText = "";

      const { data: fileWithExtracted } = await supabase
        .from("files")
        .select("name, extracted_text, analysis")
        .eq("id", fileId)
        .eq("user_id", userId)
        .single();

      if (fileWithExtracted) {
        fallbackName = String(fileWithExtracted.name || "File");
        fallbackText = String(fileWithExtracted.extracted_text || fileWithExtracted.analysis || "");
      }

      if (!fallbackText) {
        const { data: fileMinimal } = await supabase
          .from("files")
          .select("name, analysis")
          .eq("id", fileId)
          .eq("user_id", userId)
          .single();

        if (fileMinimal) {
          fallbackName = String(fileMinimal.name || fallbackName);
          fallbackText = String(fileMinimal.analysis || "");
        }
      }

      const normalizedFallbackText = normalizeText(fallbackText);
      if (!normalizedFallbackText) continue;

      const fallbackChunks = splitIntoChunks(normalizedFallbackText, 1200, 120).slice(0, perFileChunkLimit);
      for (const chunk of fallbackChunks) {
        if (sources.length >= maxSources) break;
        sources.push({
          fileName: fallbackName,
          chunkIndex: chunk.index,
          content: chunk.content,
        });
      }
    } catch {
      continue;
    }
  }

  if (!sources.length) {
    return {
      context: "",
      references: [] as string[],
    };
  }

  const references = sources.map((source, index) => `${index + 1}. ${source.fileName} (chunk ${source.chunkIndex + 1})`);

  const context = sources
    .map((source, index) => {
      const header = `[Source ${index + 1}] ${source.fileName} (chunk ${source.chunkIndex + 1})`;
      return `${header}\n${source.content}`;
    })
    .join("\n\n");

  return {
    context,
    references,
  };
}
