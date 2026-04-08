import { Sidebar } from "@/components/sidebar/Sidebar";

// In a real app, fetch conversations from Supabase
const MOCK_CONVERSATIONS = [
  { id: "1", title: "Pharmacology study plan", updated_at: new Date().toISOString() },
  { id: "2", title: "Trip to Barcelona", updated_at: new Date(Date.now() - 86400000).toISOString() },
  { id: "3", title: null, updated_at: new Date(Date.now() - 172800000).toISOString() },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar conversations={MOCK_CONVERSATIONS} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
