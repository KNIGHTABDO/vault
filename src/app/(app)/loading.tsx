export default function AppLoading() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-5">
        <div className="space-y-2">
          <div className="skeleton h-6 w-40 rounded" />
          <div className="skeleton h-3 w-72 rounded" />
        </div>

        <div className="rounded-2xl border border-vault-800/40 bg-vault-900/35 p-4 space-y-3">
          <div className="skeleton h-3.5 w-56 rounded" />
          <div className="skeleton h-3.5 w-48 rounded" />
        </div>

        <div className="rounded-2xl border border-vault-800/40 bg-vault-900/35 p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-vault-800/50 bg-vault-950/30 p-3 space-y-2">
              <div className="skeleton h-3.5 w-2/5 rounded" />
              <div className="skeleton h-3 w-4/5 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
