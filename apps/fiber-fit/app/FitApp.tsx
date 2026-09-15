"use client";

import { useEffect } from "react";
import Link from "next/link";
import Wordmark from "@/components/Wordmark";
import AvatarStack from "@/components/AvatarStack";
import TabBar from "@/components/TabBar";
import ConfirmSheet from "@/components/ConfirmSheet";
import ConnectWallet from "@/components/ConnectWallet";
import AuthGate from "@/components/AuthGate";
import LogoutButton from "@/components/LogoutButton";
import { AppShell } from "@/components/AppShell";
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
      <AppShell
        header={
          <>
            <Link href="/" className="block">
              <Wordmark />
            </Link>
            <div className="flex items-center gap-3">
              <ConnectWallet compact />
              <LogoutButton />
            </div>
          </>
        }
      >
        <CreateSquadScreen />
      </AppShell>
    );
  }

  return (
    <>
    <AppShell
      sidebar={
        <>
          <Link href="/" className="block">
            <Wordmark />
          </Link>
          <TabBar vertical />
          <div className="mt-auto space-y-3 pt-8">
            <ConnectWallet compact />
            <LogoutButton className="w-full" />
          </div>
        </>
      }
      header={
        <>
          <Link href="/" className="block lg:hidden">
            <Wordmark />
          </Link>
          <p className="hidden text-[13px] font-medium text-fog lg:block">
            {tab === "home" ? "Home" : tab === "board" ? "Board" : tab === "squads" ? "Squads" : "Vault"}
          </p>
          <div className="ml-auto flex items-center gap-3">
            <ConnectWallet compact />
            <LogoutButton className="lg:hidden" />
            <AvatarStack names={names} />
          </div>
        </>
      }
      footer={<TabBar />}
    >
      {tab === "home" ? <HomeScreen /> : null}
      {tab === "board" ? <BoardScreen /> : null}
      {tab === "squads" ? <SquadsScreen /> : null}
      {tab === "vault" ? <VaultScreen /> : null}
    </AppShell>
      <ConfirmSheet />
      <CreateChallengeScreen />
      {overlay === "squad" ? (
        <div className="fixed inset-0 z-30 overflow-y-auto bg-void/55 backdrop-blur-md">
          <div className="mx-auto min-h-dvh w-full max-w-[520px] px-5 pt-6 md:flex md:min-h-dvh md:items-start md:pt-10">
            <div className="w-full md:rounded-[28px] md:glass-pane md:px-6 md:py-6">
              <CreateSquadScreen onClose={() => setOverlay("none")} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default function FitApp() {
  const hydrated = useHasHydrated();
  if (!hydrated) {
    return (
      <div className="relative min-h-dvh bg-void">
        <div className="app-orb app-orb-a" />
      </div>
    );
  }
  return (
    <AuthGate>
      <WalletSync />
      <Shell />
    </AuthGate>
  );
}
