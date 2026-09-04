"use client";

import { Avatar } from "@/components/AvatarStack";
import DayCell from "@/components/DayCell";
import SealButton from "@/components/SealButton";
import { useFitStore } from "@/lib/store";
import { dayIndex } from "@/lib/time";
import { formatCkb } from "@/lib/settlement";
import { confirmsOf, dayMark, memberMap, potOf, projected } from "@/lib/selectors";
import SettlementScreen from "./SettlementScreen";

export default function BoardScreen() {
  const challenges = useFitStore((s) => s.challenges);
  const selectedId = useFitStore((s) => s.selectedChallengeId);
  const setOverlay = useFitStore((s) => s.setOverlay);
  const toggleMark = useFitStore((s) => s.toggleMark);
  const snap = useFitStore();

  const board =
    challenges.find((c) => c.id === selectedId) ??
    challenges.find((c) => c.status !== "settled") ??
    challenges[0];

  if (!board) {
    return <p className="px-1 text-[15px] text-fog">No board. Open a challenge.</p>;
  }

  if (board.status === "settled") {
    return <SettlementScreen challenge={board} />;
  }

  const members = memberMap(snap);
  const { complete, missed } = projected(snap, board);
  const idx = dayIndex(board.startDate, board.days);
  const lastDay = idx >= board.days - 1;
  const confirmed = confirmsOf(snap, board.id);
  const pot = potOf(board);

  return (
    <div className="pb-4">
      <header className="px-1">
        <h1 className="text-[22px] font-semibold tracking-tight text-paper">{board.name}</h1>
        <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-fog">
          {lastDay ? `Day ${Math.min(idx + 1, board.days)} · Last day` : `Day ${Math.max(idx + 1, 0)}`}
        </p>
        <div className="mt-4 flex gap-5">
          <Metric label="Pot" value={`${formatCkb(pot)} CKB`} gold />
          <Metric label="Complete" value={String(complete.length)} />
          <Metric label="Missed" value={String(missed.length)} />
        </div>
      </header>

      <div className="mt-5 space-y-1">
        {board.memberIds.map((id) => {
          const m = members.get(id);
          if (!m) return null;
          const you = m.isSelf;
          return (
            <div
              key={id}
              className={`flex items-center gap-2 rounded-[16px] px-2 py-1.5 ${you ? "ring-1 ring-lime" : ""}`}
            >
              <Avatar name={m.name} size={32} ring={you} />
              <span className="w-14 shrink-0 truncate text-[13px] font-medium text-paper">{m.name}</span>
              <div className="flex min-w-0 flex-1 justify-end gap-[3px] overflow-x-auto">
                {Array.from({ length: board.days }, (_, d) => (
                  <DayCell
                    key={d}
                    mark={dayMark(snap, board, id, d)}
                    size={14}
                    onClick={() => toggleMark(board.id, id, d)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 px-1 text-[11px] text-fog">
        Tap a cell to seal or miss. Future days stay empty.
      </p>

      {board.status === "confirming" || lastDay ? (
        <footer className="mt-8 px-1">
          <p className="mb-3 text-center text-[12px] text-fog">
            {confirmed.length} of {board.memberIds.length} confirmed
          </p>
          <SealButton onClick={() => setOverlay("confirm")}>Confirm the board</SealButton>
        </footer>
      ) : null}
    </div>
  );
}

function Metric({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.16em] text-fog">{label}</p>
      <p
        className={`mt-1 whitespace-nowrap font-serif text-[28px] leading-none tabular-nums ${gold ? "text-gold" : "text-paper"}`}
      >
        {value}
      </p>
    </div>
  );
}
