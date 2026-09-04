"use client";

import { useMemo, useState } from "react";
import { ccc } from "@ckb-ccc/connector-react";
import { FIBERS, type FiberKind, type Unit } from "@/lib/types";
import { formatCkb } from "@/lib/settlement";
import { MIN_CELL_CKB, sendCkb, txErrorMessage } from "@/lib/ckb";
import { useFitStore } from "@/lib/store";
import { useChainBalance } from "@/lib/useChainBalance";
import FiberChip from "@/components/FiberChip";
import SealButton from "@/components/SealButton";
import { unitsForFiber, ymd } from "@/lib/time";

const LENGTHS = [7, 14, 30] as const;

export default function CreateChallengeScreen() {
  const overlay = useFitStore((s) => s.overlay);
  const setOverlay = useFitStore((s) => s.setOverlay);
  const squads = useFitStore((s) => s.squads);
  const selectedSquadId = useFitStore((s) => s.selectedSquadId);
  const createChallenge = useFitStore((s) => s.createChallenge);
  const { signer, ckb, address, refresh } = useChainBalance();
  const { open } = ccc.useCcc();

  const squad = squads.find((q) => q.id === selectedSquadId) ?? squads[0];
  const [name, setName] = useState("");
  const [fiber, setFiber] = useState<FiberKind>("Move");
  const [unit, setUnit] = useState<Unit>("steps");
  const [days, setDays] = useState(7);
  const [customDays, setCustomDays] = useState("");
  const [stake, setStake] = useState("100");
  const [bar, setBar] = useState("10000");
  const [rule, setRule] = useState("");
  const [minDuration, setMinDuration] = useState("");
  const [startDate, setStartDate] = useState(ymd());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const options = useMemo(() => unitsForFiber(fiber), [fiber]);
  const length = customDays ? Number(customDays) : days;
  const stakeN = Math.trunc(Number(stake) || 0);
  const members = squad?.members.length ?? 0;
  const pot = members * stakeN;
  const availableCkb = ckb ?? 0;

  if (overlay !== "create") return null;

  async function onLock() {
    if (!squad) {
      setError("Create a squad first.");
      return;
    }
    if (!signer || !address) {
      setError("Connect a wallet to lock stake.");
      return;
    }
    if (stakeN < MIN_CELL_CKB) {
      setError(`Stake must be at least ${MIN_CELL_CKB} CKB.`);
      return;
    }
    if (availableCkb < stakeN) {
      setError("Not enough CKB in wallet.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const potAddress = squad.potAddress ?? address;
      const lockTxHash = await sendCkb(signer, potAddress, stakeN);
      const result = createChallenge({
        squadId: squad.id,
        name,
        fiber,
        bar: Number(bar) || 1,
        unit,
        customRule: rule || undefined,
        minDuration: minDuration ? Number(minDuration) : undefined,
        days: Number.isFinite(length) && length > 0 ? length : 7,
        stakeCkb: stakeN,
        startDate,
        lockTxHash,
        potAddress,
      });
      if (result.error) setError(result.error);
      await refresh();
    } catch (err) {
      setError(txErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="absolute inset-0 z-30 overflow-y-auto bg-void px-5 pb-10 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold text-paper">New challenge</h1>
        <button type="button" onClick={() => setOverlay("none")} className="text-[13px] text-fog">
          Close
        </button>
      </div>

      <label className="mt-8 block text-[11px] uppercase tracking-[0.16em] text-fog">
        Name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-2 h-14 w-full rounded-[20px] border border-hairline bg-panel px-4 text-[16px] text-paper outline-none focus:border-lime"
        />
      </label>

      <p className="mt-6 text-[11px] uppercase tracking-[0.16em] text-fog">Fiber</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {FIBERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => {
              setFiber(f);
              const next = unitsForFiber(f)[0];
              setUnit(next.unit as Unit);
              setBar(String(next.defaultBar));
            }}
          >
            <FiberChip fiber={f} selected={fiber === f} />
          </button>
        ))}
      </div>

      {options.length > 1 ? (
        <div className="mt-4 flex gap-2">
          {options.map((o) => (
            <button
              key={o.unit}
              type="button"
              onClick={() => {
                setUnit(o.unit as Unit);
                setBar(String(o.defaultBar));
              }}
              className={`h-10 rounded-full px-4 text-[13px] ${unit === o.unit ? "bg-lime text-void" : "border border-hairline text-fog"}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      ) : null}

      <p className="mt-6 text-[11px] uppercase tracking-[0.16em] text-fog">Length</p>
      <div className="mt-2 flex gap-2">
        {LENGTHS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => {
              setDays(n);
              setCustomDays("");
            }}
            className={`h-10 rounded-full px-4 text-[13px] ${!customDays && days === n ? "bg-lime text-void" : "border border-hairline text-fog"}`}
          >
            {n}
          </button>
        ))}
        <input
          value={customDays}
          onChange={(e) => setCustomDays(e.target.value)}
          placeholder="n"
          inputMode="numeric"
          className="h-10 w-14 rounded-full border border-hairline bg-transparent px-3 text-center text-[13px] text-paper outline-none"
        />
      </div>

      {unit !== "checkin" && unit !== "yesno" ? (
        <label className="mt-6 block text-[11px] uppercase tracking-[0.16em] text-fog">
          Daily bar
          <input
            value={bar}
            onChange={(e) => setBar(e.target.value)}
            inputMode="numeric"
            className="mt-2 h-14 w-full rounded-[20px] border border-hairline bg-panel px-4 font-serif text-[28px] text-paper outline-none tabular-nums focus:border-lime"
          />
        </label>
      ) : null}

      {fiber === "Train" ? (
        <label className="mt-4 block text-[11px] uppercase tracking-[0.16em] text-fog">
          Optional min duration (min)
          <input
            value={minDuration}
            onChange={(e) => setMinDuration(e.target.value)}
            inputMode="numeric"
            className="mt-2 h-12 w-full rounded-[20px] border border-hairline bg-panel px-4 text-[15px] text-paper outline-none"
          />
        </label>
      ) : null}

      {fiber === "Custom" ? (
        <input
          value={rule}
          onChange={(e) => setRule(e.target.value)}
          placeholder="Rule text"
          className="mt-4 h-14 w-full rounded-[20px] border border-hairline bg-panel px-4 text-[15px] text-paper outline-none"
        />
      ) : null}

      <label className="mt-6 block text-[11px] uppercase tracking-[0.16em] text-fog">
        Start date
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="mt-2 h-14 w-full rounded-[20px] border border-hairline bg-panel px-4 text-[15px] text-paper outline-none"
        />
      </label>

      <label className="mt-6 block text-[11px] uppercase tracking-[0.16em] text-fog">
        Stake per person (integer CKB, min 62)
        <input
          value={stake}
          onChange={(e) => setStake(e.target.value)}
          inputMode="numeric"
          className="mt-2 h-14 w-full rounded-[20px] border border-hairline bg-panel px-4 font-serif text-[28px] text-mint outline-none tabular-nums focus:border-lime"
        />
      </label>

      <div className="mt-8 rounded-[20px] border border-hairline bg-panel p-4">
        <p className="text-[13px] text-fog">
          {members} squad members will lock {formatCkb(stakeN)} CKB each
        </p>
        <p className="mt-3 whitespace-nowrap font-serif text-[52px] leading-none text-paper tabular-nums">
          {formatCkb(pot)} CKB
        </p>
        <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-fog">Total pot</p>
        <p className="mt-3 text-[12px] text-gold">
          Completers split what missed members leave behind.
        </p>
        <p className="mt-2 text-[11px] text-fog">
          Wallet: {signer ? `${formatCkb(availableCkb)} CKB available` : "not connected"}
        </p>
        <p className="mt-1 text-[11px] text-fog">
          Lock sends your stake to {squad?.potAddress ? "the squad pot" : "your address (pot)"}.
        </p>
      </div>

      {error ? <p className="mt-4 text-[13px] text-blood">{error}</p> : null}

      <div className="mt-8">
        {signer ? (
          <SealButton onClick={() => void onLock()} disabled={busy}>
            {busy ? "Signing…" : "Lock and open"}
          </SealButton>
        ) : (
          <SealButton onClick={open}>Connect wallet to lock</SealButton>
        )}
      </div>
    </div>
  );
}
