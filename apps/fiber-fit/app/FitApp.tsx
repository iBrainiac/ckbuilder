"use client";

import { useEffect } from "react";
import Link from "next/link";
import Wordmark from "@/components/Wordmark";
import AvatarStack from "@/components/AvatarStack";
import TabBar from "@/components/TabBar";
import ConfirmSheet from "@/components/ConfirmSheet";
import ConnectWallet from "@/components/ConnectWallet";
import AuthGate from "@/components/AuthGate";
import HomeScreen from "@/screens/HomeScreen";
import BoardScreen from "@/screens/BoardScreen";
import SquadsScreen from "@/screens/SquadsScreen";
import VaultScreen from "@/screens/VaultScreen";
import CreateChallengeScreen from "@/screens/CreateChallengeScreen";
import CreateSquadScreen from "@/screens/CreateSquadScreen";
import { useFitStore, useHasHydrated } from "@/lib/store";
import { useChainBalance } from "@/lib/useChainBalance";

function WalletSync() {
  const { address } = useChainBalance();
  const setSelfAddress = useFitStore((s) => s.setSelfAddress);
  const squadCount = useFitStore((s) => s.squads.length);
  useEffect(() => {
    if (address) setSelfAddress(address);
  }, [address, setSelfAddress, squadCount]);
  return null;
}

function Shell() {
  const tab = useFitStore((s) => s.tab);
  const overlay = useFitStore((s) => s.overlay);
  const setOverlay = useFitStore((s) => s.setOverlay);
  const squads = useFitStore((s) => s.squads);
  const syncStatuses = useFitStore((s) => s.syncStatuses);

  useEffect(() => {
    syncStatuses();
  }, [syncStatuses, tab]);

  const names = squads.flatMap((q) => q.members.map((m) => m.name));

  if (squads.length === 0) {
    return (
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-void px-4 pt-[calc(14px+env(safe-area-inset-top))]">
        <CreateSquadScreen />
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-void">
      <header className="flex items-center justify-between gap-3 px-5 pb-3 pt-[calc(14px+env(safe-area-inset-top))]">
        <Link href="/" className="block">
          <Wordmark />
        </Link>
        <div className="flex items-center gap-3">
          <ConnectWallet compact />
          <AvatarStack names={names} />
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4">
        {tab === "home" ? <HomeScreen /> : null}
        {tab === "board" ? <BoardScreen /> : null}
        {tab === "squads" ? <SquadsScreen /> : null}
        {tab === "vault" ? <VaultScreen /> : null}
      </div>
      <TabBar />
      <ConfirmSheet />
      <CreateChallengeScreen />
      {overlay === "squad" ? (
        <div className="absolute inset-0 z-30 overflow-y-auto bg-void px-5 pt-6">
          <CreateSquadScreen onClose={() => setOverlay("none")} />
        </div>
      ) : null}
    </div>
  );
}

export default function FitApp() {
  const hydrated = useHasHydrated();
  if (!hydrated) {
    return <div className="min-h-dvh bg-void" />;
  }
  return (
    <AuthGate>
      <WalletSync />
      <Shell />
    </AuthGate>
  );
}
