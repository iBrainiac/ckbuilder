/* eslint-disable */
"use client";

import React, { useEffect, useState } from "react";
import { ccc } from "@ckb-ccc/connector-react";
import { truncateAddress } from "@/utils/format";

export default function ConnectWallet() {
  const { open, wallet } = ccc.useCcc();
  const signer = ccc.useSigner();
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("");

  useEffect(() => {
    if (!signer) { setAddress(""); setBalance(""); return; }
    signer.getRecommendedAddress().then(setAddress).catch(() => {});
    signer.getBalance().then((b) => setBalance(ccc.fixedPointToString(b))).catch(() => {});
  }, [signer]);

  if (!wallet) {
    return (
      <button
        onClick={open}
        className="rounded-full bg-cyan-500 px-5 py-2 text-sm font-semibold text-black hover:bg-cyan-400 transition-colors"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <button
      onClick={open}
      className="flex items-center gap-2.5 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 hover:border-zinc-600 transition-colors"
    >
      <img src={wallet.icon} alt={wallet.name} className="w-5 h-5 rounded-full" />
      <div className="text-left">
        <p className="text-xs font-semibold text-zinc-100">{balance} CKB</p>
        <p className="text-xs text-zinc-500">{truncateAddress(address, 10, 6)}</p>
      </div>
    </button>
  );
}
