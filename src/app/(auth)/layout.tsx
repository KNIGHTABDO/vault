import { VaultLogo } from "@/components/VaultLogo";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-vault-950 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-vault-500/[0.04] blur-3xl" />
      </div>
      <Link href="/" className="relative z-10 mb-8 flex items-center gap-2">
        <VaultLogo size="sm" />
        <span className="font-display text-lg text-vault-300">vault</span>
      </Link>
      <div className="relative z-10 w-full max-w-sm">{children}</div>
    </div>
  );
}
