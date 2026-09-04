import { initials, tintFor } from "@/lib/time";
import type { DayMark } from "@/lib/types";

function Cell({ mark }: { mark: DayMark }) {
  const cls =
    mark === "sealed"
      ? "bg-lime"
      : mark === "missed"
        ? "bg-blood"
        : mark === "pending"
          ? "border border-lime pending-pulse"
          : "border border-hairline bg-transparent";
  return <span className={`inline-block h-[11px] w-[11px] rounded-[4px] ${cls}`} />;
}

function Face({ name, ring }: { name: string; ring?: boolean }) {
  return (
    <span
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-medium text-void ${
        ring ? "ring-1 ring-lime" : "ring-1 ring-void"
      }`}
      style={{ background: tintFor(name) }}
    >
      {initials(name)}
    </span>
  );
}

const ROWS: { name: string; you?: boolean; marks: DayMark[] }[] = [
  {
    name: "You",
    you: true,
    marks: ["sealed", "sealed", "sealed", "sealed", "pending", "future", "future"],
  },
  {
    name: "Nest",
    marks: ["sealed", "sealed", "missed", "sealed", "future", "future", "future"],
  },
  {
    name: "Sol",
    marks: ["sealed", "sealed", "sealed", "sealed", "sealed", "future", "future"],
  },
];

export default function PhoneBoard() {
  return (
    <div className="landing-phone relative mx-auto w-[280px] rounded-[36px] border border-hairline bg-void p-3 pb-4">
      <div className="mx-auto mb-3 h-1 w-16 rounded-full bg-hairline" />
      <p className="px-1 font-sans text-[15px] font-semibold tracking-[-0.06em] text-paper">
        F
        <span className="relative inline-block">
          I
          <span className="pointer-events-none absolute left-1/2 top-[-2px] h-[1.15em] w-px -translate-x-1/2 bg-lime" />
        </span>
        BER&nbsp;FIT
      </p>
      <p className="mt-3 px-1 text-[10px] uppercase tracking-[0.16em] text-fog">7-day Move · day 5</p>
      <p className="mt-1 px-1 font-serif text-[36px] leading-none text-gold tabular-nums">300 CKB</p>
      <div className="mt-4 space-y-1">
        {ROWS.map((row) => (
          <div
            key={row.name}
            className={`flex items-center gap-2 rounded-[14px] px-1.5 py-1 ${row.you ? "ring-1 ring-lime" : ""}`}
          >
            <Face name={row.name} ring={row.you} />
            <span className="w-10 shrink-0 truncate text-[12px] font-medium text-paper">{row.name}</span>
            <div className="flex flex-1 justify-end gap-[3px]">
              {row.marks.map((m, i) => (
                <Cell key={i} mark={m} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 h-11 rounded-full border border-hairline text-center text-[12px] font-medium leading-[44px] text-fog">
        Sealed 07:14
      </p>
      <div className="mt-3 grid grid-cols-4 text-center text-[9px] font-medium tracking-wide">
        <span className="text-fog">Home</span>
        <span className="text-lime">Board</span>
        <span className="text-fog">Squads</span>
        <span className="text-fog">Vault</span>
      </div>
    </div>
  );
}
