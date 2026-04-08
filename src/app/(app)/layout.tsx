import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar/Sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch real conversations
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, title, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        conversations={conversations || []}
        user={{
          email: user.email || "",
          name: user.user_metadata?.full_name || user.email?.split("@")[0] || "",
        }}
      />
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
}
