"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Wordmark from "@/components/Wordmark";
import SealButton from "@/components/SealButton";
import ConnectWallet from "@/components/ConnectWallet";
import { ccc } from "@ckb-ccc/connector-react";
import { useChainBalance } from "@/lib/useChainBalance";
import { fetchInvite, fetchMe, joinSquadRemote, signInWithSigner } from "@/lib/api";
import { useFitStore } from "@/lib/store";
import { txErrorMessage } from "@/lib/ckb";

export default function JoinScreen({ code }: { code: string }) {
  const router = useRouter();
  const { signer } = useChainBalance();
  const { open } = ccc.useCcc();
  const replaceSquads = useFitStore((s) => s.replaceSquads);
  const squads = useFitStore((s) => s.squads);
  const selectSquad = useFitStore((s) => s.selectSquad);
  const [preview, setPreview] = useState<{ name: string; memberCount: number } | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [needSign, setNeedSign] = useState(false);

  useEffect(() => {
    void fetchInvite(code)
      .then((p) => setPreview({ name: p.name, memberCount: p.memberCount }))
      .catch((err) => setError(err instanceof Error ? err.message : "Invite not found."));
  }, [code]);

  async function onJoin(e: FormEvent) {
    e.preventDefault();
    if (!signer) {
      open();
      return;
    }
    setBusy(true);
    setError("");
    try {
      const me = await fetchMe();
      if (!me) {
        await signInWithSigner(signer);
        setNeedSign(false);
      }
      const squad = await joinSquadRemote(code, displayName);
      replaceSquads([...squads.filter((q) => q.id !== squad.id), squad]);
      selectSquad(squad.id);
      router.push("/app");
    } catch (err) {
      setNeedSign(true);
      setError(txErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-void px-5 pt-[calc(14px+env(safe-area-inset-top))]">
      <div className="flex items-center justify-between">
        <Link href="/">
          <Wordmark />
        </Link>
        <ConnectWallet compact />
      </div>
      <form onSubmit={onJoin} className="mt-auto flex flex-col pb-8">
        <p className="text-[11px] uppercase tracking-[0.16em] text-fog">Invite</p>
        <h1 className="mt-2 text-[22px] font-semibold tracking-tight text-paper">
          {preview?.name ?? "…"}
        </h1>
        {preview ? (
          <p className="mt-1 text-[13px] text-fog">
            {preview.memberCount} member{preview.memberCount === 1 ? "" : "s"} · {code.toUpperCase()}
          </p>
        ) : null}
        <label className="mt-8 block text-[11px] uppercase tracking-[0.16em] text-fog">
          Your display name
          <input
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-2 h-14 w-full rounded-[20px] border border-hairline bg-panel px-4 text-[16px] text-paper outline-none focus:border-lime"
          />
        </label>
        {error ? <p className="mt-3 text-[13px] text-blood">{error}</p> : null}
        <div className="mt-8">
          {!signer ? (
            <SealButton onClick={open}>Connect wallet to join</SealButton>
          ) : (
            <SealButton type="submit" disabled={busy}>
              {busy ? "Joining…" : needSign ? "Sign and join" : "Join squad"}
            </SealButton>
          )}
        </div>
        <Link href="/app" className="mt-4 text-center text-[12px] text-fog">
          Back to app
        </Link>
      </form>
    </div>
  );
}
