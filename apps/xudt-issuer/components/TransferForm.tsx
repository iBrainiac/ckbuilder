"use client";

import React, { useState } from "react";
import { ccc } from "@ckb-ccc/connector-react";
import { transferTokens } from "@/lib/xudt";

interface TransferFormProps {
  xudtArgs: string;
  balance: bigint;
  onTransferred: (txHash: string) => void;
}

export default function TransferForm({ xudtArgs, balance, onTransferred }: TransferFormProps) {
  const signer = ccc.useSigner();
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = amount.trim() ? BigInt(amount.trim()) : 0n;
  const canSubmit = !!signer && toAddress.trim().length > 0 && parsed > 0n && parsed <= balance && !busy;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!signer || !toAddress.trim() || parsed <= 0n) return;
    setError(null);
    setBusy(true);
    try {
      const txHash = await transferTokens(signer, xudtArgs, toAddress.trim(), parsed);
      setToAddress("");
      setAmount("");
      onTransferred(txHash);
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
          Recipient address
        </label>
        <input
          type="text"
          value={toAddress}
          onChange={(e) => setToAddress(e.target.value)}
          placeholder="ckt1..."
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-cyan-500 transition-colors font-mono"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">
          Amount
        </label>
        <input
          type="number"
          min="1"
          step="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="e.g. 500"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-cyan-500 transition-colors"
        />
        {parsed > balance && balance > 0n && (
          <p className="mt-1 text-xs text-red-400">Exceeds your balance of {balance.toLocaleString()}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 py-2.5 text-sm font-semibold text-zinc-100 hover:border-cyan-500 hover:text-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {busy ? (
          <>
            <span className="w-3.5 h-3.5 rounded-full border-2 border-zinc-400/30 border-t-zinc-400 animate-spin" />
            Sending…
          </>
        ) : (
          "Transfer Tokens"
        )}
      </button>

      {error && <p className="text-xs text-red-400 break-words">{error}</p>}
    </form>
  );
}
