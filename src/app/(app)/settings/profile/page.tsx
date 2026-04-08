"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ProfileSettings() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || "");
        setFullName(user.user_metadata?.full_name || "");
      }
    }
    load();
  }, []);

  async function handleSave() {
    const supabase = createClient();
    await supabase.auth.updateUser({ data: { full_name: fullName } });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="font-display text-2xl text-vault-100 mb-6">Profile</h1>
      <div className="space-y-4 bg-vault-900/50 border border-vault-800/40 rounded-xl p-5">
        <div>
          <label className="text-xs text-vault-400 mb-1 block">Email</label>
          <input value={email} disabled className="w-full px-3 py-2.5 rounded-lg bg-vault-800/50 border border-vault-700/30 text-vault-300 text-sm" />
        </div>
        <div>
          <label className="text-xs text-vault-400 mb-1 block">Full Name</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name"
            className="w-full px-3 py-2.5 rounded-lg bg-vault-800/50 border border-vault-700/40 text-vault-100 text-sm focus:outline-none focus:border-vault-500/50" />
        </div>
        <button onClick={handleSave}
          className="px-4 py-2 rounded-lg text-sm bg-vault-500/20 border border-vault-500/30 text-vault-200 hover:bg-vault-500/30 transition-all">
          {saved ? "Saved ✓" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
