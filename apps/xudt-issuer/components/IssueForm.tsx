"use client";

import React, { useState } from "react";
import { ccc } from "@ckb-ccc/connector-react";
import { issueTokens, XUDT_CELL_MIN_CKB } from "@/lib/xudt";

interface IssueFormProps {
  onIssued: (txHash: string) => void;
}

export default function IssueForm({ onIssued }: IssueFormProps) {
  const signer = ccc.useSigner();
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = amount.trim() ? BigInt(amount.trim()) : 0n;
  const canSubmit = !!signer && parsed > 0n && !busy;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!signer || parsed <= 0n) return;
    setError(null);
    setBusy(true);
    try {
      const txHash = await issueTokens(signer, parsed);
      setAmount("");
      onIssued(txHash);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      setError(msg.length > 140 ? msg.slice(0, 140) + "…" : msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">
          Amount to mint
        </label>
        <input
          type="number"
          min="1"
          step="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="e.g. 1000000"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-cyan-500 transition-colors"
        />
        <p className="mt-1.5 text-xs text-zinc-600">
          Issuing costs ~<span className="text-zinc-400">{XUDT_CELL_MIN_CKB} CKB</span> to create the token cell
        </p>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-cyan-500 py-2.5 text-sm font-semibold text-black hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {busy ? (
          <>
            <span className="w-3.5 h-3.5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
            Minting…
          </>
        ) : (
          "Mint Tokens"
        )}
      </button>

      {error && <p className="text-xs text-red-400 break-words">{error}</p>}
    </form>
  );
}
