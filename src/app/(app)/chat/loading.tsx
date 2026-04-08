export default function ChatLoading() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-vault-surface border border-vault-border-subtle flex items-center justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-vault-text-ghost border-t-vault-accent animate-spin" />
        </div>
        <p className="text-xs text-vault-text-ghost">Loading…</p>
      </div>
    </div>
  );
}
