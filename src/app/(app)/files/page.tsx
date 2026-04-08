"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type FileRow = {
  id: string;
  name: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  parse_status?: "pending" | "processing" | "completed" | "failed" | "binary";
  parser?: string | null;
  parse_error?: string | null;
  indexed_at?: string | null;
  content_sha256?: string | null;
  extracted_text?: string | null;
  metadata?: {
    chunkCount?: number;
    embeddedChunkCount?: number;
    embeddingModel?: string | null;
    extractedTextLength?: number;
    extractedTextTruncated?: boolean;
    embeddingError?: string;
    [key: string]: unknown;
  };
  created_at: string;
};

function statusLabel(status?: FileRow["parse_status"]) {
  if (status === "completed") return "Indexed";
  if (status === "processing") return "Processing";
  if (status === "failed") return "Failed";
  if (status === "binary") return "Binary";
  return "Pending";
}

function statusClasses(status?: FileRow["parse_status"]) {
  if (status === "completed") return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
  if (status === "processing") return "bg-amber-500/10 text-amber-300 border-amber-500/20";
  if (status === "failed") return "bg-red-500/10 text-red-300 border-red-500/20";
  if (status === "binary") return "bg-vault-700/30 text-vault-300 border-vault-600/40";
  return "bg-vault-700/20 text-vault-400 border-vault-700/40";
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function loadFiles() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/files");
      if (!res.ok) throw new Error("Failed to load files");
      const data = await res.json();
      setFiles(data.files || []);
    } catch (err: any) {
      setError(err?.message || "Unable to load files");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFiles();
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile || uploading) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("You need to be signed in.");
      return;
    }

    setUploading(true);
    setError("");
    const uploadToastId = toast.loading(`Uploading ${selectedFile.name}...`);

    try {
      const safeName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${user.id}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase
        .storage
        .from("vault-files")
        .upload(storagePath, selectedFile, { upsert: false });

      if (uploadError) throw new Error(uploadError.message);

      const metadataRes = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedFile.name,
          mimeType: selectedFile.type || "application/octet-stream",
          sizeBytes: selectedFile.size,
          storagePath,
        }),
      });

      if (!metadataRes.ok) {
        const payload = await metadataRes.json();
        throw new Error(payload.error || "Unable to save file metadata");
      }

      const payload = await metadataRes.json();
      if (payload.file) {
        setFiles((prev) => [payload.file, ...prev]);
      }

      const parseStatus = String(payload?.file?.parse_status || "");
      if (parseStatus === "completed" || parseStatus === "binary") {
        toast.success("File uploaded and indexed.", { id: uploadToastId });
      } else if (parseStatus === "failed") {
        toast.error("File uploaded, but indexing failed.", { id: uploadToastId });
      } else {
        toast.success("File uploaded. Indexing is still running.", { id: uploadToastId });
      }
    } catch (err: any) {
      setError(err?.message || "Unable to upload file");
      toast.error(err?.message || "Unable to upload file", { id: uploadToastId });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(fileId: string) {
    const deleteToastId = toast.loading("Deleting file...");
    const res = await fetch(`/api/files/${fileId}`, { method: "DELETE" });
    if (res.ok) {
      setFiles((prev) => prev.filter((file) => file.id !== fileId));
      toast.success("File deleted.", { id: deleteToastId });
      return;
    }
    toast.error("Unable to delete file.", { id: deleteToastId });
  }

  async function handleRetryIndex(fileId: string) {
    const retryToastId = toast.loading("Re-indexing file...");

    try {
      const res = await fetch(`/api/files/${fileId}/reindex`, { method: "POST" });
      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload?.error || "Unable to re-index file");
      }

      const payload = await res.json();
      if (payload?.file) {
        setFiles((prev) => prev.map((file) => (file.id === payload.file.id ? payload.file : file)));
      }

      if (payload?.status === "completed" || payload?.status === "binary") {
        toast.success("File indexing completed.", { id: retryToastId });
      } else {
        toast.error("File indexing is still incomplete.", { id: retryToastId });
      }
    } catch (err: any) {
      toast.error(err?.message || "Unable to re-index file", { id: retryToastId });
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="font-display text-2xl text-vault-100">Files</h1>
          <p className="text-sm text-vault-400 mt-1">Upload and manage files available to Vault within your workspace context.</p>
        </div>

        <div className="bg-vault-900/50 border border-vault-800/40 rounded-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-vault-500/20 border border-vault-500/30 text-vault-100 hover:bg-vault-500/30 cursor-pointer transition-colors">
              <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
              {uploading ? "Uploading..." : "Upload file"}
            </label>
            <p className="text-xs text-vault-500">{files.length} files indexed</p>
          </div>
          <p className="text-2xs text-vault-500">
            Upload supports text, code, JSON, CSV, DOCX, XLS/XLSX, PDF, and binary files. Original bytes stay in storage with no lossy conversion.
          </p>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <div className="bg-vault-900/30 border border-vault-800/30 rounded-2xl divide-y divide-vault-800/30">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-xl border border-vault-800/50 bg-vault-950/30 p-3 space-y-2">
                  <div className="skeleton h-3.5 w-2/5 rounded" />
                  <div className="skeleton h-3 w-1/3 rounded" />
                  <div className="skeleton h-3 w-4/5 rounded" />
                </div>
              ))}
            </div>
          ) : files.length === 0 ? (
            <p className="text-sm text-vault-500 p-4">No files uploaded yet.</p>
          ) : (
            files.map((file) => (
              <div key={file.id} className="p-4 flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm text-vault-200 font-medium">{file.name}</p>
                    <span className={`text-2xs px-2 py-0.5 rounded-full border ${statusClasses(file.parse_status)}`}>
                      {statusLabel(file.parse_status)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-2xs text-vault-600">
                    <span>{file.mime_type}</span>
                    <span>{formatBytes(file.size_bytes)}</span>
                    <span>{new Date(file.created_at).toLocaleString()}</span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-2xs text-vault-500">
                    {file.parser && <span>Parser: {file.parser}</span>}
                    {typeof file.metadata?.chunkCount === "number" && <span>Chunks: {file.metadata.chunkCount}</span>}
                    {typeof file.metadata?.embeddedChunkCount === "number" && <span>Embedded: {file.metadata.embeddedChunkCount}</span>}
                    {file.metadata?.embeddingModel && <span>Embedding model: {file.metadata.embeddingModel}</span>}
                    {file.indexed_at && <span>Indexed: {new Date(file.indexed_at).toLocaleString()}</span>}
                  </div>

                  {file.parse_error && (
                    <p className="mt-2 text-2xs text-red-400">Parse error: {file.parse_error}</p>
                  )}

                  {!file.parse_error && file.metadata?.embeddingError && (
                    <p className="mt-2 text-2xs text-amber-400">Embedding warning: {file.metadata.embeddingError}</p>
                  )}

                  {file.extracted_text && (
                    <div className="mt-2 rounded-lg border border-vault-800/50 bg-vault-950/40 p-2">
                      <p className="text-2xs text-vault-500 mb-1">Extracted preview</p>
                      <p className="text-2xs text-vault-300 whitespace-pre-wrap line-clamp-4">
                        {file.extracted_text.slice(0, 600)}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:self-start">
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="text-xs px-2 py-1 rounded-md border border-vault-700/40 text-vault-500 hover:text-red-400 hover:border-red-500/30 transition-colors"
                  >
                    Delete
                  </button>
                  {(file.parse_status === "failed" || file.parse_status === "pending") && (
                    <button
                      onClick={() => handleRetryIndex(file.id)}
                      className="text-xs px-2 py-1 rounded-md border border-vault-700/40 text-vault-300 hover:text-vault-100 hover:border-vault-500/40 transition-colors"
                    >
                      Retry
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
