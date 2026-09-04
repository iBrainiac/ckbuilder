"use client";

import { useEffect } from "react";
import { formatCkb } from "@/lib/settlement";
import { explorerTxUrl } from "@/lib/ckb";
import { vault } from "@/lib/selectors";
import { useFitStore } from "@/lib/store";
import { useChainBalance } from "@/lib/useChainBalance";
import ConnectWallet from "@/components/ConnectWallet";

export default function VaultScreen() {
  const snap = useFitStore();
  const selectChallenge = useFitStore((s) => s.selectChallenge);
  const abandonChallenge = useFitStore((s) => s.abandonChallenge);
  const deleteChallenge = useFitStore((s) => s.deleteChallenge);
  const setSelfAddress = useFitStore((s) => s.setSelfAddress);
  const { ckb, address, refresh } = useChainBalance();
  const { available, locked, earned } = vault(snap, ckb);
  const open = snap.challenges.filter((c) => c.status !== "settled");
  const settled = snap.challenges.filter((c) => c.status === "settled");

  useEffect(() => {
    if (address) setSelfAddress(address);
  }, [address, setSelfAddress]);

  return (
    <div className="px-1 pb-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-fog">Available</p>
      <p className="mt-2 whitespace-nowrap font-serif text-[56px] leading-none text-mint tabular-nums">
        {formatCkb(available)} CKB
      </p>
      <div className="mt-4">
        <ConnectWallet />
      </div>
      <p className="mt-3 text-[11px] text-fog">Live chain balance. Integer CKB, fees extra.</p>

      <h2 className="mt-10 text-[11px] uppercase tracking-[0.16em] text-fog">Locked in pacts</h2>
      <p className="mt-2 whitespace-nowrap font-serif text-[28px] text-paper tabular-nums">
        {formatCkb(locked)} CKB
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {open.length === 0 ? (
          <p className="text-[13px] text-fog">Nothing locked.</p>
        ) : (
          open.map((c) => (
            <span key={c.id} className="inline-flex items-center gap-2 rounded-full border border-hairline px-3 py-1.5">
              <button type="button" onClick={() => selectChallenge(c.id)} className="text-[12px] text-paper">
                {c.name}
                <span className="ml-2 whitespace-nowrap text-mint">{formatCkb(c.stakeCkb)} CKB</span>
              </button>
              {c.lockTxHash ? (
                <a
                  href={explorerTxUrl(c.lockTxHash, address)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-lime"
                >
                  tx
                </a>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  const seals = snap.checkins.some((x) => x.challengeId === c.id && x.sealedAt);
                  const r = seals ? abandonChallenge(c.id) : deleteChallenge(c.id);
                  if (r.error) window.alert(r.error);
                  void refresh();
                }}
                className="text-[11px] text-fog"
              >
                {snap.checkins.some((x) => x.challengeId === c.id && x.sealedAt) ? "Abandon" : "Delete"}
              </button>
            </span>
          ))
        )}
      </div>
      <p className="mt-2 text-[11px] text-fog">
        Abandon drops the pact locally. On-chain CKB stays at the pot address.
      </p>

      <h2 className="mt-10 text-[11px] uppercase tracking-[0.16em] text-fog">
        Earned from missed members
      </h2>
      <p className="mt-3 whitespace-nowrap font-serif text-[36px] leading-none text-gold tabular-nums">
        {formatCkb(earned)} CKB
      </p>
      {settled.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => selectChallenge(c.id)}
          className="mt-4 block text-left text-[13px] text-fog"
        >
          {c.name} · board
        </button>
      ))}
    </div>
  );
}
