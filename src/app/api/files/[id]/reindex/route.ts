import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { processAndIndexStoredFile } from "@/lib/files/processing";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) => {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: fileRow, error: fileError } = await supabase
    .from("files")
    .select("id, name, mime_type, storage_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fileError || !fileRow) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  await supabase
    .from("files")
    .update({ parse_status: "processing", parse_error: null })
    .eq("id", id)
    .eq("user_id", user.id);

  const result = await processAndIndexStoredFile({
    supabase,
    userId: user.id,
    fileId: fileRow.id,
    fileName: fileRow.name,
    mimeType: fileRow.mime_type,
    storagePath: fileRow.storage_path,
  });

  const { data: refreshed } = await supabase
    .from("files")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({
    success: result.ok,
    file: refreshed || null,
    status: result.status,
    chunkCount: result.chunkCount,
    embeddingError: result.embeddingError,
  });
}
