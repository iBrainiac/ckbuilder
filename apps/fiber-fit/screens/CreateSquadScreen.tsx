"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Wordmark from "@/components/Wordmark";
import SealButton from "@/components/SealButton";
import ConnectWallet from "@/components/ConnectWallet";
import { useFitStore } from "@/lib/store";
import { useChainBalance } from "@/lib/useChainBalance";
import { createSquadRemote } from "@/lib/api";

export default function CreateSquadScreen({
  onClose,
}: {
  onClose?: () => void;
}) {
  const router = useRouter();
  const { signer } = useChainBalance();
  const replaceSquads = useFitStore((s) => s.replaceSquads);
  const squads = useFitStore((s) => s.squads);
  const selectSquad = useFitStore((s) => s.selectSquad);
  const setTab = useFitStore((s) => s.setTab);
  const [squad, setSquad] = useState("");
  const [me, setMe] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!signer) {
      setError("Connect a wallet and sign in first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const created = await createSquadRemote(squad, me);
      replaceSquads([...squads.filter((q) => q.id !== created.id), created]);
      selectSquad(created.id);
      setTab("squads");
      onClose?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create squad.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex min-h-[70vh] flex-col justify-end px-1 pb-4">
      {onClose ? (
        <button type="button" onClick={onClose} className="self-end text-[13px] text-fog">
          Close
        </button>
      ) : (
        <Wordmark />
      )}
      <p className="mt-8 text-[15px] text-fog">Create a squad, then share the invite.</p>
      {!signer ? (
        <div className="mt-6">
          <ConnectWallet />
        </div>
      ) : null}
      <label className="mt-6 block text-[11px] uppercase tracking-[0.16em] text-fog">
        Squad name
        <input
          required
          value={squad}
          onChange={(e) => setSquad(e.target.value)}
          className="mt-2 h-14 w-full rounded-[20px] border border-hairline bg-panel px-4 text-[16px] text-paper outline-none focus:border-lime"
        />
      </label>
      <label className="mt-4 block text-[11px] uppercase tracking-[0.16em] text-fog">
        Your display name
        <input
          required
          value={me}
          onChange={(e) => setMe(e.target.value)}
          className="mt-2 h-14 w-full rounded-[20px] border border-hairline bg-panel px-4 text-[16px] text-paper outline-none focus:border-lime"
        />
      </label>
      {error ? <p className="mt-3 text-[13px] text-blood">{error}</p> : null}
      <div className="mt-8">
        <SealButton type="submit" disabled={busy || !signer}>
          {busy ? "Creating…" : "Create a squad"}
        </SealButton>
      </div>
      <p className="mt-10 text-[11px] uppercase tracking-[0.16em] text-fog">Have an invite?</p>
      <div className="mt-2 flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="XK4P2M7Q"
          className="h-12 min-w-0 flex-1 rounded-[20px] border border-hairline bg-panel px-4 font-mono text-[13px] text-paper outline-none focus:border-lime"
        />
        <button
          type="button"
          onClick={() => code.trim() && router.push(`/app/join/${code.trim()}`)}
          className="h-12 rounded-full border border-lime px-4 text-[13px] font-semibold text-lime"
        >
          Join
        </button>
      </div>
    </form>
  );
}
