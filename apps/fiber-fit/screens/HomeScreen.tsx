"use client";

import { useEffect, useState } from "react";
import PactCard from "@/components/PactCard";
import { useFitStore } from "@/lib/store";
import { dayIndex, needsNumericProof, unitLabel } from "@/lib/time";
import { barMet, findCheckin, isMissed } from "@/lib/settlement";
import { dayMark, potOf, selfId } from "@/lib/selectors";
import { hasLocked } from "@/lib/challenge-status";
import { lockChallengeRemote, missDayRemote, sealDayRemote } from "@/lib/api";
import { MIN_CELL_CKB, sendCkb, txErrorMessage } from "@/lib/ckb";
import { useChainBalance } from "@/lib/useChainBalance";
import { ccc } from "@ckb-ccc/connector-react";
import { WalletHelp } from "@/components/WalletHelp";

export default function HomeScreen() {
  const challenges = useFitStore((s) => s.challenges);
  const checkins = useFitStore((s) => s.checkins);
  const squads = useFitStore((s) => s.squads);
  const setTab = useFitStore((s) => s.setTab);
  const setOverlay = useFitStore((s) => s.setOverlay);
  const selectChallenge = useFitStore((s) => s.selectChallenge);
  const setProof = useFitStore((s) => s.setProof);
  const replaceBoard = useFitStore((s) => s.replaceBoard);
  const syncStatuses = useFitStore((s) => s.syncStatuses);
  const { signer, ckb, refresh } = useChainBalance();
  const { open } = ccc.useCcc();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    syncStatuses();
  }, [syncStatuses]);

  const mine = challenges.filter((c) => {
    const me = selfId(useFitStore.getState(), c.squadId);
    return me && c.memberIds.includes(me);
  });

  if (mine.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col justify-end px-1 pb-4 md:min-h-[36vh] md:justify-center">
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
    <div className="space-y-3 pb-4 md:space-y-0 md:grid md:grid-cols-1 md:gap-4 lg:grid-cols-2">
      <p className="px-1 text-[12px] text-fog lg:col-span-2">Same stake. Same fiber. Lock your own CKB.</p>
      {error ? <p className="px-1 text-[13px] text-blood lg:col-span-2">{error}</p> : null}
      {error.toLowerCase().includes("not enough") ? (
        <div className="px-1 lg:col-span-2">
          <WalletHelp needFaucet />
        </div>
      ) : null}
      {mine.map((c) => {
        const snap = useFitStore.getState();
        const me = selfId(snap, c.squadId);
        if (!me) return null;
        const locked = hasLocked(c, me);
        const today = Math.min(Math.max(dayIndex(c.startDate, c.days), 0), c.days - 1);
        const row = findCheckin(checkins, c.id, me, today);
        const missed = isMissed(row);
        const marks = Array.from({ length: c.days }, (_, d) => dayMark(snap, c, me, d));
        return (
          <div key={c.id} className="space-y-2">
            {locked && needsNumericProof(c.unit) && !row?.sealedAt && !missed ? (
              <label className="block px-1 text-[11px] uppercase tracking-[0.16em] text-fog">
                Today · {unitLabel(c.unit)}
                <input
                  type="number"
                  min={0}
                  value={row?.proofValue ?? ""}
                  onChange={(e) =>
                    setProof(c.id, me, today, e.target.value === "" ? 0 : Number(e.target.value), row?.proofMinutes)
                  }
                  className="glass-field mt-1 h-12 w-full rounded-[20px] px-4 font-serif text-[24px] text-paper tabular-nums"
                />
              </label>
            ) : null}
            {locked && c.unit === "workouts" && c.minDuration && !row?.sealedAt && !missed ? (
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
                  className="glass-field mt-1 h-12 w-full rounded-[20px] px-4 font-serif text-[24px] text-paper tabular-nums"
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
              locked={locked}
              lockBusy={busyId === c.id}
              onOpen={() => selectChallenge(c.id)}
              onLock={() => {
                if (!signer) {
                  open();
                  return;
                }
                const pot = c.potAddress;
                if (!pot) {
                  setError("No pot address.");
                  return;
                }
                if ((ckb ?? 0) < c.stakeCkb) {
                  setError("Not enough CKB in wallet.");
                  return;
                }
                if (c.stakeCkb < MIN_CELL_CKB) {
                  setError(`Stake must be at least ${MIN_CELL_CKB} CKB.`);
                  return;
                }
                setBusyId(c.id);
                setError("");
                void sendCkb(signer, pot, c.stakeCkb)
                  .then((txHash) => lockChallengeRemote(c.id, txHash))
                  .then((board) => {
                    replaceBoard(board);
                    return refresh();
                  })
                  .catch((err) => setError(txErrorMessage(err)))
                  .finally(() => setBusyId(null));
              }}
              onSeal={() => {
                setBusyId(c.id);
                setError("");
                void sealDayRemote(c.id, today, row?.proofValue, row?.proofMinutes)
                  .then((board) => replaceBoard(board))
                  .catch((err) => setError(err instanceof Error ? err.message : "Could not seal."))
                  .finally(() => setBusyId(null));
              }}
            />
            {locked && !row?.sealedAt && !missed ? (
              <button
                type="button"
                disabled={busyId === c.id}
                onClick={() => {
                  setBusyId(c.id);
                  setError("");
                  void missDayRemote(c.id, today)
                    .then((board) => replaceBoard(board))
                    .catch((err) => setError(err instanceof Error ? err.message : "Could not miss."))
                    .finally(() => setBusyId(null));
                }}
                className="w-full text-center text-[12px] text-fog disabled:opacity-40"
              >
                Miss today
              </button>
            ) : null}
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => setOverlay("create")}
        className="h-12 w-full rounded-full border border-lime text-[14px] font-semibold text-lime lg:col-span-2"
      >
        New challenge
      </button>
    </div>
  );
}
