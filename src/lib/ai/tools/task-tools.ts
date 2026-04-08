import { supabase } from "@/lib/db/client";

export async function createTask(
  args: Record<string, unknown>
): Promise<string> {
  const content = args.content as string;
  const dueDate = args.dueDate as string | undefined;

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: "default",
      content,
      due_date: dueDate || null,
      completed: false,
    })
    .select("id")
    .single();

  if (error) {
    return JSON.stringify({ success: false, error: error.message });
  }

  return JSON.stringify({
    success: true,
    taskId: data.id,
    message: `Task created: "${content}"${dueDate ? ` (due: ${dueDate})` : ""}`,
  });
}

export async function listTasks(
  args: Record<string, unknown>
): Promise<string> {
  const filter = (args.filter as string) || "pending";

  let query = supabase.from("tasks").select("*").order("created_at", {
    ascending: false,
  });

  if (filter === "pending") {
    query = query.eq("completed", false);
  } else if (filter === "completed") {
    query = query.eq("completed", true);
  } else if (filter === "overdue") {
    query = query
      .eq("completed", false)
      .lt("due_date", new Date().toISOString());
  }

  const { data, error } = await query.limit(20);

  if (error) {
    return JSON.stringify({ success: false, error: error.message });
  }

  return JSON.stringify({
    success: true,
    tasks: data || [],
    count: data?.length || 0,
  });
}
