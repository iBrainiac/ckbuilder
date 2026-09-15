"use client";

import { useFitStore, type Tab } from "@/lib/store";

const TABS: { id: Tab; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "board", label: "Board" },
  { id: "squads", label: "Squads" },
  { id: "vault", label: "Vault" },
];

export default function TabBar({ vertical = false }: { vertical?: boolean }) {
  const tab = useFitStore((s) => s.tab);
  const setTab = useFitStore((s) => s.setTab);

  if (vertical) {
    return (
      <nav className="mt-8 flex flex-col gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-[16px] px-3 py-3 text-left text-[14px] font-medium tracking-wide transition-colors ${
              tab === t.id ? "bg-lime/15 text-lime" : "text-fog hover:text-paper"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>
    );
  }

  return (
    <nav className="glass-bar grid grid-cols-4 px-2 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2 md:rounded-b-[28px] lg:hidden">
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
