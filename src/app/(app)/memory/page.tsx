import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MemoryPageClient } from "./memory-client";

export default async function MemoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: memories } = await supabase
    .from("memories")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return <MemoryPageClient memories={memories || []} />;
}
