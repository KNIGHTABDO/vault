import { supabase } from "@/lib/db/client";
import { generateEmbedding } from "@/lib/ai/providers/gemini";

export async function searchMemory(
  args: Record<string, unknown>
): Promise<string> {
  const query = args.query as string;
  const type = args.type as string | undefined;

  // Generate embedding for the query
  const embedding = await generateEmbedding(query);

  // Search using pgvector cosine similarity
  let queryBuilder = supabase
    .from("memories")
    .select("id, type, content, metadata, importance, created_at")
    .order("importance", { ascending: false })
    .limit(5);

  if (type) {
    queryBuilder = queryBuilder.eq("type", type);
  }

  // For now, use text search (pgvector search requires RPC)
  const { data, error } = await supabase
    .from("memories")
    .select("id, type, content, metadata, importance, created_at")
    .ilike("content", `%${query}%`)
    .order("importance", { ascending: false })
    .limit(5);

  if (error) {
    return JSON.stringify({ success: false, error: error.message });
  }

  // Update access counts
  if (data?.length) {
    for (const memory of data) {
      const currentCount = (memory as { access_count?: number }).access_count ?? 0;
      await supabase
        .from("memories")
        .update({
          access_count: currentCount + 1,
          last_accessed_at: new Date().toISOString(),
        })
        .eq("id", memory.id);
    }
  }

  return JSON.stringify({
    success: true,
    memories: data || [],
    count: data?.length || 0,
  });
}

export async function saveMemory(
  args: Record<string, unknown>
): Promise<string> {
  const content = args.content as string;
  const type = args.type as string;
  const tags = args.tags as string[] | undefined;

  // Generate embedding
  const embedding = await generateEmbedding(content);

  const { data, error } = await supabase
    .from("memories")
    .insert({
      user_id: "default", // Will be replaced with real auth
      type,
      content,
      source: "conversation",
      embedding,
      metadata: { tags: tags || [] },
      importance: 0.5,
    })
    .select("id")
    .single();

  if (error) {
    return JSON.stringify({ success: false, error: error.message });
  }

  return JSON.stringify({
    success: true,
    memoryId: data.id,
    message: `Saved: "${content}"`,
  });
}
