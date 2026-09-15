"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { ccc } from "@ckb-ccc/connector-react";
import { logoutRemote } from "@/lib/api";
import { useFitStore } from "@/lib/store";

type AuthSessionValue = {
  address: string;
  busy: boolean;
  logout: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionValue | null>(null);

export function AuthSessionProvider({
  address,
  onCleared,
  children,
}: {
  address: string;
  onCleared: () => void;
  children: ReactNode;
}) {
  const { disconnect } = ccc.useCcc();
  const replaceSquads = useFitStore((s) => s.replaceSquads);
  const replaceBoard = useFitStore((s) => s.replaceBoard);
  const [busy, setBusy] = useState(false);

  const logout = useCallback(async () => {
    setBusy(true);
    try {
      await logoutRemote();
    } catch {
      /* cookie may already be gone */
    }
    try {
      disconnect();
    } catch {
      /* wallet already closed */
    }
    replaceSquads([]);
    replaceBoard({ challenges: [], checkins: [], settlements: [] });
    onCleared();
    setBusy(false);
  }, [disconnect, onCleared, replaceBoard, replaceSquads]);

  return (
    <AuthSessionContext.Provider value={{ address, busy, logout }}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const value = useContext(AuthSessionContext);
  if (!value) {
    throw new Error("useAuthSession must be used inside a signed-in session.");
  }
  return value;
}
