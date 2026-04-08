export default function TasksPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md p-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-vault-500/10 border border-vault-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-vault-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="font-display text-xl text-vault-200 mb-2">Tasks</h2>
        <p className="text-sm text-vault-400">Track ongoing tasks and workflows. Monitor progress and manage complex multi-step operations.</p>
        <p className="text-xs text-vault-600 mt-4">Coming soon — built with real Supabase integration</p>
      </div>
    </div>
  );
}
