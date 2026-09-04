"use client";

import type { Challenge } from "@/lib/types";
import { formatCkb } from "@/lib/settlement";
import { memberMap, potOf, selfId } from "@/lib/selectors";
import { useFitStore } from "@/lib/store";
import { explorerTxUrl } from "@/lib/ckb";
import PotRing from "@/components/PotRing";

export default function SettlementScreen({ challenge }: { challenge: Challenge }) {
  const snap = useFitStore();
  const settlement = snap.settlements.find((s) => s.challengeId === challenge.id && s.settledAt);
  const members = memberMap(snap);
  const me = selfId(snap, challenge.squadId);
  const pot = potOf(challenge);
  const payouts = settlement?.payouts ?? [];
  const completers = payouts.filter((p) => p.amountCkb > 0).length;
  const leftover = settlement?.leftoverCkb ?? 0;
  const split = payouts
    .filter((p) => p.amountCkb > challenge.stakeCkb)
    .reduce((n, p) => n + (p.amountCkb - challenge.stakeCkb), 0);

  return (
    <div className="px-1 pb-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-paper">Board settled</h1>
          <p className="mt-2 text-[13px] text-fog">
            {completers} completers split {formatCkb(Math.max(split, leftover))} CKB
          </p>
          {challenge.lockTxHash ? (
            <a
              href={explorerTxUrl(challenge.lockTxHash, members.get(me ?? "")?.ckbAddress)}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block text-[12px] text-lime"
            >
              Lock tx
            </a>
          ) : null}
          {settlement?.payoutTxHash ? (
            <a
              href={explorerTxUrl(settlement.payoutTxHash, members.get(me ?? "")?.ckbAddress)}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block text-[12px] text-lime"
            >
              Payout tx
            </a>
          ) : null}
        </div>
        <PotRing total={pot} drained={split} />
      </div>
      <ul className="mt-8 space-y-2">
        {payouts.map((p) => {
          const member = members.get(p.memberId);
          if (!member) return null;
          const you = p.memberId === me;
          const delta = p.amountCkb - challenge.stakeCkb;
          return (
            <li
              key={p.memberId}
              className={`flex items-center justify-between rounded-[20px] border px-4 py-3 ${you ? "border-lime" : "border-hairline"}`}
            >
              <span className="text-[14px] font-medium text-paper">
                {member.name}
                {you ? " · you" : ""}
              </span>
              {p.amountCkb === 0 ? (
                <span className="whitespace-nowrap text-[13px] text-fog">
                  −{formatCkb(challenge.stakeCkb)} <span className="text-blood">missed</span>
                </span>
              ) : delta > 0 ? (
                <span className="whitespace-nowrap font-serif text-[20px] text-lime tabular-nums">
                  +{formatCkb(delta)} CKB
                </span>
              ) : (
                <span className="whitespace-nowrap font-serif text-[20px] text-fog tabular-nums">
                  {formatCkb(p.amountCkb)} CKB
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
