import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { processAndIndexStoredFile } from "@/lib/files/processing";

export async function GET() {
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

  const { data, error } = await supabase
    .from("files")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = Array.isArray(data) ? data : [];
  const recoverableFailures = rows
    .filter((row: any) => {
      const status = String(row?.parse_status || "");
      const parser = String(row?.parser || "").toLowerCase();
      const parseError = String(row?.parse_error || "").toLowerCase();
      return status === "failed" && (parser.includes("pdf") || parseError.includes("fake worker") || parseError.includes("pdf.worker"));
    })
    .slice(0, 2);

  if (recoverableFailures.length) {
    for (const failedRow of recoverableFailures) {
      try {
        await processAndIndexStoredFile({
          supabase,
          userId: user.id,
          fileId: failedRow.id,
          fileName: failedRow.name,
          mimeType: failedRow.mime_type,
          storagePath: failedRow.storage_path,
        });
      } catch {
        // Keep original status if retry fails.
      }
    }

    const { data: refreshed } = await supabase
      .from("files")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200);

    return NextResponse.json({ files: refreshed || rows });
  }

  return NextResponse.json({ files: rows });
}

export async function POST(request: Request) {
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

  const body = await request.json();

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const mimeType = typeof body?.mimeType === "string" ? body.mimeType.trim() : "application/octet-stream";
  const storagePath = typeof body?.storagePath === "string" ? body.storagePath.trim() : "";
  const sizeBytes = Number(body?.sizeBytes);
  const analysis = typeof body?.analysis === "string" ? body.analysis : null;

  if (!name || !storagePath || !Number.isFinite(sizeBytes)) {
    return NextResponse.json({ error: "Invalid file metadata" }, { status: 400 });
  }

  const baseInsertPayload = {
    user_id: user.id,
    name,
    mime_type: mimeType,
    size_bytes: sizeBytes,
    storage_path: storagePath,
    analysis,
  };

  let data: any = null;
  let error: any = null;

  ({ data, error } = await supabase
    .from("files")
    .insert({
      ...baseInsertPayload,
      parse_status: "processing",
      parser: "pending",
      metadata: {
        ingestionVersion: 2,
      },
    })
    .select("*")
    .single());

  if (error) {
    ({ data, error } = await supabase
      .from("files")
      .insert(baseInsertPayload)
      .select("*")
      .single());
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  try {
    await processAndIndexStoredFile({
      supabase,
      userId: user.id,
      fileId: data.id,
      fileName: name,
      mimeType,
      storagePath,
    });

    const { data: refreshed } = await supabase
      .from("files")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", user.id)
      .single();

    if (refreshed) {
      data = refreshed;
    }
  } catch {
    // Keep initial row if ingestion fails unexpectedly.
  }

  return NextResponse.json({ file: data });
}
