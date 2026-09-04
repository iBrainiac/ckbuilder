"use client";

import { useState } from "react";
import SealButton from "@/components/SealButton";
import { useFitStore } from "@/lib/store";
import { formatCkb, settlePayouts } from "@/lib/settlement";
import { confirmsOf, memberMap, outboundPayouts, potOf, projected, selfId } from "@/lib/selectors";
import { sendPayouts, txErrorMessage } from "@/lib/ckb";
import { useChainBalance } from "@/lib/useChainBalance";
import { Sheet } from "@/components/Sheet";

export default function ConfirmSheet() {
  const overlay = useFitStore((s) => s.overlay);
  const setOverlay = useFitStore((s) => s.setOverlay);
  const confirm = useFitStore((s) => s.confirm);
  const selectedId = useFitStore((s) => s.selectedChallengeId);
  const snap = useFitStore();
  const { signer, address, refresh } = useChainBalance();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const board = snap.challenges.find((c) => c.id === selectedId);
  if (overlay !== "confirm" || !board || board.status === "settled") return null;

  const { complete, missed } = projected(snap, board);
  const preview = settlePayouts(board, snap.checkins);
  const confirmed = confirmsOf(snap, board.id);
  const me = selfId(snap, board.squadId);
  const needed = Math.ceil(board.memberIds.length / 2);
  const members = memberMap(snap);
  const boardId = board.id;
  const pendingOut = outboundPayouts(preview.payouts, members, address);

  async function confirmAs(memberId: string) {
    const nextCount = confirmed.includes(memberId) ? confirmed.length : confirmed.length + 1;
    const willSettle = nextCount >= needed;
    setBusy(true);
    setError("");
    try {
      let hash: string | undefined;
      if (willSettle && pendingOut.length > 0) {
        if (!signer) {
          setError("Connect a wallet to pay completers on-chain.");
          setBusy(false);
          return;
        }
        hash = await sendPayouts(signer, pendingOut);
        await refresh();
      }
      confirm(boardId, memberId, hash);
      const ch = useFitStore.getState().challenges.find((c) => c.id === boardId);
      if (ch?.status === "settled") setOverlay("none");
    } catch (err) {
      setError(txErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet onClose={() => setOverlay("none")} title="Confirm the board">
      <p className="text-[13px] text-fog">The board is the record. Unsealed days count as misses.</p>
      <p className="mt-4 whitespace-nowrap font-serif text-[40px] leading-none text-gold tabular-nums">
        {formatCkb(potOf(board))} CKB
      </p>
      <p className="mt-2 text-[13px] text-fog">
        {complete.length} complete · {missed.length} missed
      </p>
      <p className="mt-1 text-[12px] text-fog">
        Remainder {formatCkb(preview.leftoverCkb)} CKB goes to the first completer by id.
      </p>
      {pendingOut.length > 0 ? (
        <p className="mt-2 text-[12px] text-mint">
          {pendingOut.length} on-chain payout{pendingOut.length === 1 ? "" : "s"} when this settles.
        </p>
      ) : (
        <p className="mt-2 text-[12px] text-fog">
          No outbound payouts (self-pot or members without addresses).
        </p>
      )}
      <p className="mt-4 text-[12px] text-fog">
        {confirmed.length} of {board.memberIds.length} confirmed · need {needed}
      </p>
      {error ? <p className="mt-3 text-[13px] text-blood">{error}</p> : null}
      <ul className="mt-4 space-y-2">
        {board.memberIds.map((id) => {
          const member = members.get(id);
          if (!member) return null;
          const done = confirmed.includes(id);
          return (
            <li key={id} className="flex items-center justify-between rounded-[16px] border border-hairline px-3 py-2">
              <span className="text-[13px] text-paper">
                {member.name}
                {id === me ? " · you" : ""}
              </span>
              {done ? (
                <span className="text-[11px] uppercase tracking-[0.14em] text-mint">Confirmed</span>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void confirmAs(id)}
                  className="text-[12px] font-medium text-lime disabled:opacity-40"
                >
                  Confirm
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-6">
        <SealButton
          onClick={() => me && void confirmAs(me)}
          disabled={!me || busy || (me ? confirmed.includes(me) : false)}
        >
          {busy ? "Signing…" : "Confirm as you"}
        </SealButton>
      </div>
    </Sheet>
  );
}
