"use client";

import { useFitStore, type Tab } from "@/lib/store";

const TABS: { id: Tab; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "board", label: "Board" },
  { id: "squads", label: "Squads" },
  { id: "vault", label: "Vault" },
];

export default function TabBar() {
  const tab = useFitStore((s) => s.tab);
  const setTab = useFitStore((s) => s.setTab);
  return (
    <nav className="grid grid-cols-4 border-t border-hairline bg-void/95 px-2 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2 backdrop-blur">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setTab(t.id)}
          className={`py-2 text-[11px] font-medium tracking-wide ${tab === t.id ? "text-lime" : "text-fog"}`}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
