"use client";

import { ccc } from "@ckb-ccc/connector-react";
import { shortAddress } from "@/lib/ckb";
import { useChainBalance } from "@/lib/useChainBalance";

export default function ConnectWallet({ compact = false }: { compact?: boolean }) {
  const { open, disconnect, wallet, signerInfo } = ccc.useCcc();
  const { ckb, address } = useChainBalance();

  if (!signerInfo) {
    return (
      <button
        type="button"
        onClick={open}
        className={
          compact
            ? "text-[11px] font-medium text-lime"
            : "h-12 w-full rounded-full bg-lime text-[14px] font-semibold text-void"
        }
      >
        Connect wallet
      </button>
    );
  }

  if (compact) {
    return (
      <button type="button" onClick={open} className="max-w-[120px] truncate text-[11px] font-medium text-mint">
        {address ? shortAddress(address) : wallet?.name ?? "Wallet"}
      </button>
    );
  }

  return (
    <div className="rounded-[20px] border border-hairline bg-panel px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={open} className="min-w-0 text-left">
          <p className="text-[11px] uppercase tracking-[0.16em] text-fog">
            {wallet?.name ?? "Wallet"}
          </p>
          <p className="mt-1 truncate font-mono text-[12px] text-paper">
            {address ? shortAddress(address) : "…"}
          </p>
        </button>
        <button type="button" onClick={disconnect} className="shrink-0 text-[12px] text-fog">
          Disconnect
        </button>
      </div>
      {ckb != null ? (
        <p className="mt-3 font-serif text-[28px] leading-none text-mint tabular-nums">{ckb.toLocaleString("en-US")} CKB</p>
      ) : null}
    </div>
  );
}
