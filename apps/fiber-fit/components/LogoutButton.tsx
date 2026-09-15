"use client";

import { useAuthSession } from "@/lib/auth-session";

export default function LogoutButton({ className = "" }: { className?: string }) {
  const { logout, busy } = useAuthSession();
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void logout()}
      className={`inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-paper/25 px-4 text-[13px] font-semibold text-paper transition-colors hover:border-lime hover:text-lime disabled:opacity-40 ${className}`}
    >
      {busy ? "Logging out…" : "Log out"}
    </button>
  );
}
