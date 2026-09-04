"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ccc } from "@ckb-ccc/connector-react";
import Wordmark from "@/components/Wordmark";
import ConnectWallet from "@/components/ConnectWallet";
import SealButton from "@/components/SealButton";
import { useFitStore } from "@/lib/store";
import { useChainBalance } from "@/lib/useChainBalance";
import { fetchMe, fetchSquads, logoutRemote, signInWithSigner } from "@/lib/api";
import { txErrorMessage } from "@/lib/ckb";

export default function AuthGate({ children }: { children: ReactNode }) {
  const { signer, address } = useChainBalance();
  const { open } = ccc.useCcc();
  const replaceSquads = useFitStore((s) => s.replaceSquads);
  const [session, setSession] = useState<string | null | undefined>(undefined);
  const [squadsReady, setSquadsReady] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchMe()
      .then((me) => {
        if (!cancelled) setSession(me?.address ?? null);
      })
      .catch(() => {
        if (!cancelled) setSession(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!session || !address || session === address) return;
    void logoutRemote().then(() => {
      setSession(null);
      replaceSquads([]);
      setSquadsReady(false);
    });
  }, [session, address, replaceSquads]);

  useEffect(() => {
    if (!session) {
      replaceSquads([]);
      setSquadsReady(false);
      return;
    }
    let cancelled = false;
    setSquadsReady(false);
    void fetchSquads()
      .then((squads) => {
        if (cancelled) return;
        replaceSquads(squads);
        setSquadsReady(true);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not load squads.");
        setSquadsReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [session, replaceSquads]);

  if (session === undefined) {
    return <div className="min-h-dvh bg-void" />;
  }

  if (!signer) {
    return (
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-void px-5 pt-[calc(14px+env(safe-area-inset-top))]">
        <Wordmark />
        <div className="mt-auto pb-8">
          <p className="text-[22px] font-semibold tracking-tight text-paper">Connect a wallet</p>
          <p className="mt-2 max-w-[36ch] text-[15px] leading-relaxed text-fog">
            Sign in with CKB. No email. The address is who you are, then you can create or join a squad.
          </p>
          <div className="mt-8">
            <SealButton onClick={open}>Connect wallet</SealButton>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-void px-5 pt-[calc(14px+env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <Wordmark />
          <ConnectWallet compact />
        </div>
        <div className="mt-auto pb-8">
          <p className="text-[22px] font-semibold tracking-tight text-paper">Sign in</p>
          <p className="mt-2 max-w-[36ch] text-[15px] leading-relaxed text-fog">
            One signature proves the wallet is yours. Then you can create a squad or open an invite.
          </p>
          {error ? <p className="mt-4 text-[13px] text-blood">{error}</p> : null}
          <div className="mt-8">
            <SealButton
              disabled={busy}
              onClick={() => {
                setBusy(true);
                setError("");
                void signInWithSigner(signer)
                  .then((addr) => setSession(addr))
                  .catch((err) => setError(txErrorMessage(err)))
                  .finally(() => setBusy(false));
              }}
            >
              {busy ? "Signing…" : "Sign in"}
            </SealButton>
          </div>
        </div>
      </div>
    );
  }

  if (!squadsReady) {
    return <div className="min-h-dvh bg-void" />;
  }

  return children;
}
