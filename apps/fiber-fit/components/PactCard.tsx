"use client";

import type { Challenge } from "@/lib/types";
import { formatCkb } from "@/lib/settlement";
import { unitLabel } from "@/lib/time";
import FiberChip from "./FiberChip";
import DayStrip from "./DayStrip";
import SealButton from "./SealButton";
import type { DayMark } from "@/lib/types";

export default function PactCard({
  challenge,
  todayValue,
  target,
  unit,
  dayNumber,
  days,
  pot,
  marks,
  sealedAt,
  barReady,
  onOpen,
  onSeal,
}: {
  challenge: Challenge;
  todayValue: number;
  target: number;
  unit: string;
  dayNumber: number;
  days: number;
  pot: number;
  marks: DayMark[];
  sealedAt: string | null;
  barReady: boolean;
  onOpen: () => void;
  onSeal: () => void;
}) {
  const pct = Math.min(100, Math.round((todayValue / Math.max(target, 1)) * 100));

  return (
    <article className="rounded-[20px] border border-hairline bg-panel p-4">
      <button type="button" onClick={onOpen} className="w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-[17px] font-semibold tracking-tight text-paper">{challenge.name}</h2>
          <FiberChip fiber={challenge.fiber} />
        </div>
        {challenge.customRule ? (
          <p className="mt-2 text-[13px] text-fog">{challenge.customRule}</p>
        ) : null}
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="font-serif text-[44px] leading-none text-paper tabular-nums">
              {todayValue.toLocaleString("en-US")}
            </p>
            <p className="mt-1 text-[11px] text-fog">
              / {target.toLocaleString("en-US")} {unitLabel(unit)} · day {Math.min(Math.max(dayNumber, 1), days)}
              {dayNumber >= days ? " · last day" : ""}
            </p>
          </div>
          <p className="whitespace-nowrap font-serif text-[22px] text-mint tabular-nums">
            {formatCkb(pot)} CKB
          </p>
        </div>
        <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-hairline">
          <div className="h-full rounded-full bg-lime" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-3">
          <DayStrip marks={marks} />
        </div>
      </button>
      <div className="mt-4">
        {sealedAt ? (
          <p className="h-14 rounded-full border border-hairline text-center text-[13px] font-medium leading-[56px] text-fog">
            Sealed {sealedAt}
          </p>
        ) : (
          <SealButton onClick={onSeal} disabled={!barReady}>
            Seal today
          </SealButton>
        )}
      </div>
    </article>
  );
}
