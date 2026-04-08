import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FilesPageClient } from "./files-client";

export default async function FilesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: files } = await supabase
    .from("files")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return <FilesPageClient files={files || []} />;
}
