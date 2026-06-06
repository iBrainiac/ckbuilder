"use client";

import React from "react";
import { truncateHash } from "@/utils/format";

interface TokenCardProps {
  xudtArgs: string;
  typeHash: string;
  balance: bigint;
  loading: boolean;
}

export default function TokenCard({ xudtArgs, typeHash, balance, loading }: TokenCardProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Your Token</span>
        <span className="text-xs bg-zinc-800 text-zinc-400 rounded px-2 py-0.5">xUDT</span>
      </div>

      {/* Balance */}
      <div>
        {loading ? (
          <div className="h-8 w-40 rounded animate-shimmer" />
        ) : (
          <p className="text-3xl font-bold text-zinc-100">
            {balance.toLocaleString()}
          </p>
        )}
        <p className="text-xs text-zinc-600 mt-1">tokens in your wallet</p>
      </div>

      <div className="h-px bg-zinc-800" />

      {/* Token identifiers */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between gap-4">
          <span className="text-zinc-600 shrink-0">Type hash</span>
          <span className="font-mono text-zinc-400 truncate">{typeHash ? truncateHash(typeHash, 14, 8) : "—"}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-zinc-600 shrink-0">xUDT args</span>
          <span className="font-mono text-zinc-400 truncate">{xudtArgs ? truncateHash(xudtArgs, 14, 8) : "—"}</span>
        </div>
      </div>
    </div>
  );
}
