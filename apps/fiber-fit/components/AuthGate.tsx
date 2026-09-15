"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ccc } from "@ckb-ccc/connector-react";
import Wordmark from "@/components/Wordmark";
import ConnectWallet from "@/components/ConnectWallet";
import SealButton from "@/components/SealButton";
import { AuthFrame } from "@/components/AppShell";
import { AuthSessionProvider } from "@/lib/auth-session";
import { useFitStore } from "@/lib/store";
import { useChainBalance } from "@/lib/useChainBalance";
import { fetchMe, fetchSquads, fetchBoard, logoutRemote, signInWithSigner } from "@/lib/api";
import { MIN_CELL_CKB, txErrorMessage } from "@/lib/ckb";
import { WalletHelp } from "@/components/WalletHelp";

export default function AuthGate({ children }: { children: ReactNode }) {
  const { signer, address, ckb } = useChainBalance();
  const { open, disconnect } = ccc.useCcc();
  const replaceSquads = useFitStore((s) => s.replaceSquads);
  const replaceBoard = useFitStore((s) => s.replaceBoard);
  const [session, setSession] = useState<string | null | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const clearLocal = useCallback(() => {
    replaceSquads([]);
    replaceBoard({ challenges: [], checkins: [], settlements: [] });
  }, [replaceBoard, replaceSquads]);

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
      clearLocal();
      setReady(false);
    });
  }, [session, address, clearLocal]);

  useEffect(() => {
    if (!session) {
      clearLocal();
      setReady(false);
      return;
    }
    let cancelled = false;
    setReady(false);
    void Promise.all([fetchSquads(), fetchBoard()])
      .then(([squads, board]) => {
        if (cancelled) return;
        replaceSquads(squads);
        replaceBoard(board);
        setReady(true);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not load squads.");
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [session, replaceSquads, replaceBoard, clearLocal]);

  const onCleared = useCallback(() => {
    setSession(null);
    setReady(false);
  }, []);

  if (session === undefined) {
    return (
      <div className="relative min-h-dvh bg-void">
        <div className="app-orb app-orb-a" />
      </div>
    );
  }

  if (!signer) {
    return (
      <AuthFrame>
        <Wordmark />
        <div className="mt-auto pb-8 md:mt-16 md:pb-0">
          <p className="text-[22px] font-semibold tracking-tight text-paper">Sign in</p>
          <p className="mt-2 max-w-[36ch] text-[15px] leading-relaxed text-fog">
            A CKB wallet is who you are. No email. Then you can create a squad or open an invite.
          </p>
          <div className="mt-8">
            <SealButton onClick={open}>Sign in</SealButton>
          </div>
          <WalletHelp needWallet />
        </div>
      </AuthFrame>
    );
  }

  if (!session) {
    return (
      <AuthFrame>
        <div className="flex items-center justify-between">
          <Wordmark />
          <div className="flex items-center gap-3">
            <ConnectWallet compact />
            <button type="button" onClick={disconnect} className="text-[11px] font-medium text-fog">
              Disconnect
            </button>
          </div>
        </div>
        <div className="mt-auto pb-8 md:mt-16 md:pb-0">
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
          <WalletHelp needFaucet={ckb != null && ckb < MIN_CELL_CKB} />
        </div>
      </AuthFrame>
    );
  }

  if (!ready) {
    return (
      <div className="relative min-h-dvh bg-void">
        <div className="app-orb app-orb-a" />
      </div>
    );
  }

  return (
    <AuthSessionProvider address={session} onCleared={onCleared}>
      {children}
    </AuthSessionProvider>
  );
}
