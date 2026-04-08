"use client";

import { ArrowLeft, User, Camera, Save } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ProfilePage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [language, setLanguage] = useState("en");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-lg mx-auto py-8 px-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/settings"
            className="p-1.5 rounded-lg hover:bg-vault-surface-hover text-vault-text-ghost hover:text-vault-text-secondary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <User className="w-5 h-5 text-vault-accent" />
          <h1 className="text-lg font-medium text-vault-text">Profile</h1>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-8">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-vault-surface border border-vault-border-subtle flex items-center justify-center">
              <span className="text-xl font-medium text-vault-text-tertiary">
                {firstName ? firstName[0]?.toUpperCase() : "?"}
              </span>
            </div>
            <button className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-vault-surface border border-vault-border-subtle flex items-center justify-center text-vault-text-ghost hover:text-vault-text-secondary transition-colors">
              <Camera className="w-3 h-3" />
            </button>
          </div>
          <div>
            <p className="text-sm text-vault-text">
              {firstName || lastName
                ? `${firstName} ${lastName}`.trim()
                : "Your name"}
            </p>
            <p className="text-xs text-vault-text-ghost">
              This is how Vault addresses you
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-vault-text-secondary mb-1.5">
                First name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="w-full px-3.5 py-2.5 rounded-xl bg-vault-surface border border-vault-border-subtle text-sm text-vault-text placeholder:text-vault-text-ghost outline-none focus:border-vault-border-hover transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-vault-text-secondary mb-1.5">
                Last name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="w-full px-3.5 py-2.5 rounded-xl bg-vault-surface border border-vault-border-subtle text-sm text-vault-text placeholder:text-vault-text-ghost outline-none focus:border-vault-border-hover transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-vault-text-secondary mb-1.5">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell Vault a little about yourself…"
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-vault-surface border border-vault-border-subtle text-sm text-vault-text placeholder:text-vault-text-ghost outline-none focus:border-vault-border-hover transition-colors resize-none"
            />
            <p className="text-2xs text-vault-text-ghost mt-1">
              This helps Vault understand you better
            </p>
          </div>

          <div>
            <label className="block text-xs text-vault-text-secondary mb-1.5">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-vault-surface border border-vault-border-subtle text-sm text-vault-text outline-none focus:border-vault-border-hover transition-colors appearance-none cursor-pointer"
            >
              <option value="en">English</option>
              <option value="ar">العربية</option>
              <option value="fr">Français</option>
              <option value="es">Español</option>
              <option value="de">Deutsch</option>
              <option value="pt">Português</option>
              <option value="zh">中文</option>
              <option value="ja">日本語</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-vault-accent hover:bg-vault-accent-hover text-black text-sm font-medium transition-colors duration-150"
            >
              {saved ? (
                <>Saved ✓</>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="mt-12 pt-8 border-t border-vault-border-subtle">
          <h2 className="text-sm font-medium text-vault-text mb-1">
            Danger zone
          </h2>
          <p className="text-xs text-vault-text-ghost mb-4">
            Irreversible actions. Please be careful.
          </p>
          <div className="space-y-2">
            <button className="px-4 py-2 rounded-xl text-xs text-vault-error border border-vault-error/20 hover:bg-vault-error/5 transition-colors">
              Clear all memories
            </button>
            <button className="px-4 py-2 rounded-xl text-xs text-vault-error border border-vault-error/20 hover:bg-vault-error/5 transition-colors ml-2">
              Delete account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
