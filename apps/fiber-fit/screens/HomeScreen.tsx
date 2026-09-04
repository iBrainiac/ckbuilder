"use client";

import { useEffect } from "react";
import PactCard from "@/components/PactCard";
import { useFitStore } from "@/lib/store";
import { dayIndex, needsNumericProof, unitLabel } from "@/lib/time";
import { barMet, findCheckin } from "@/lib/settlement";
import { dayMark, potOf, selfId } from "@/lib/selectors";

export default function HomeScreen() {
  const challenges = useFitStore((s) => s.challenges);
  const checkins = useFitStore((s) => s.checkins);
  const squads = useFitStore((s) => s.squads);
  const setTab = useFitStore((s) => s.setTab);
  const setOverlay = useFitStore((s) => s.setOverlay);
  const selectChallenge = useFitStore((s) => s.selectChallenge);
  const setProof = useFitStore((s) => s.setProof);
  const seal = useFitStore((s) => s.seal);
  const syncStatuses = useFitStore((s) => s.syncStatuses);

  useEffect(() => {
    syncStatuses();
  }, [syncStatuses]);

  const mine = challenges.filter((c) => {
    const me = selfId(useFitStore.getState(), c.squadId);
    return me && c.memberIds.includes(me);
  });

  if (mine.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col justify-end px-1 pb-4">
        <p className="mb-6 text-[15px] text-fog">No pacts. Open one.</p>
        <button
          type="button"
          onClick={() => {
            if (squads.length === 0) setTab("squads");
            else setOverlay("create");
          }}
          className="h-14 w-full rounded-full bg-lime text-[15px] font-semibold text-void"
        >
          {squads.length === 0 ? "Create a squad" : "New challenge"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-4">
      <p className="px-1 text-[12px] text-fog">Same stake. Same fiber.</p>
      {mine.map((c) => {
        const snap = useFitStore.getState();
        const me = selfId(snap, c.squadId);
        if (!me) return null;
        const today = Math.min(Math.max(dayIndex(c.startDate, c.days), 0), c.days - 1);
        const row = findCheckin(checkins, c.id, me, today);
        const marks = Array.from({ length: c.days }, (_, d) => dayMark(snap, c, me, d));
        return (
          <div key={c.id} className="space-y-2">
            {needsNumericProof(c.unit) && !row?.sealedAt ? (
              <label className="block px-1 text-[11px] uppercase tracking-[0.16em] text-fog">
                Today · {unitLabel(c.unit)}
                <input
                  type="number"
                  min={0}
                  value={row?.proofValue ?? ""}
                  onChange={(e) =>
                    setProof(c.id, me, today, e.target.value === "" ? 0 : Number(e.target.value), row?.proofMinutes)
                  }
                  className="mt-1 h-12 w-full rounded-[20px] border border-hairline bg-panel px-4 font-serif text-[24px] text-paper outline-none tabular-nums focus:border-lime"
                />
              </label>
            ) : null}
            {c.unit === "workouts" && c.minDuration && !row?.sealedAt ? (
              <label className="block px-1 text-[11px] uppercase tracking-[0.16em] text-fog">
                Minutes
                <input
                  type="number"
                  min={0}
                  value={row?.proofMinutes ?? ""}
                  onChange={(e) =>
                    setProof(
                      c.id,
                      me,
                      today,
                      row?.proofValue,
                      e.target.value === "" ? 0 : Number(e.target.value)
                    )
                  }
                  className="mt-1 h-12 w-full rounded-[20px] border border-hairline bg-panel px-4 font-serif text-[24px] text-paper outline-none tabular-nums focus:border-lime"
                />
              </label>
            ) : null}
            <PactCard
              challenge={c}
              todayValue={row?.proofValue ?? (c.unit === "checkin" || c.unit === "yesno" ? (row?.sealedAt ? 1 : 0) : 0)}
              target={c.bar}
              unit={c.unit}
              dayNumber={dayIndex(c.startDate, c.days) + 1}
              days={c.days}
              pot={potOf(c)}
              marks={marks}
              sealedAt={row?.sealedAt ?? null}
              barReady={barMet(c, row)}
              onOpen={() => selectChallenge(c.id)}
              onSeal={() => seal(c.id, me, today)}
            />
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => setOverlay("create")}
        className="h-12 w-full rounded-full border border-lime text-[14px] font-semibold text-lime"
      >
        New challenge
      </button>
    </div>
  );
}
