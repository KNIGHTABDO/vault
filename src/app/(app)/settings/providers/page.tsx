export default function AssistantSettings() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <div>
        <h1 className="font-display text-2xl text-vault-100 mb-2">Assistant</h1>
        <p className="text-sm text-vault-400">
          Vault automatically selects the best available engine and keeps responses stable with built-in failover.
        </p>
      </div>

      <div className="bg-vault-900/50 border border-vault-800/40 rounded-xl p-5 space-y-4">
        <StatusRow label="Automatic failover" description="If one backend path fails, Vault retries with a backup route." status="Enabled" />
        <StatusRow label="Tool-assisted responses" description="Vault can use tools during chat when needed for files, memory, and shell tasks." status="Enabled" />
        <StatusRow label="Engine details" description="Underlying engine details are intentionally hidden from end users." status="Hidden" />
      </div>

      <p className="text-xs text-vault-500">
        Operational configuration is managed server-side by workspace admins.
      </p>
    </div>
  );
}

function StatusRow({
  label,
  description,
  status,
}: {
  label: string;
  description: string;
  status: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-vault-500/10 border border-vault-500/20 flex items-center justify-center text-vault-300 text-sm">
        ✓
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-vault-200">{label}</p>
        <p className="text-xs text-vault-500 mt-0.5">{description}</p>
      </div>
      <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        {status}
      </span>
    </div>
  );
}
