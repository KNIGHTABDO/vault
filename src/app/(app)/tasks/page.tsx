import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TasksPageClient } from "./tasks-client";

export default async function TasksPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return <TasksPageClient tasks={tasks || []} />;
}
