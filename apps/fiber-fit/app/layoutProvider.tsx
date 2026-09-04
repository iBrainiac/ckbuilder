"use client";

import { ccc } from "@ckb-ccc/connector-react";
import { CSSProperties, useMemo, type ReactNode } from "react";

export function LayoutProvider({ children }: { children: ReactNode }) {
  const defaultClient = useMemo(
    () =>
      process.env.NEXT_PUBLIC_IS_MAINNET === "true"
        ? new ccc.ClientPublicMainnet()
        : new ccc.ClientPublicTestnet(),
    []
  );

  return (
    <ccc.Provider
      name="Fiber Fit"
      icon="/icon.svg"
      defaultClient={defaultClient}
      clientOptions={[
        { name: "CKB Testnet", client: new ccc.ClientPublicTestnet() },
        { name: "CKB Mainnet", client: new ccc.ClientPublicMainnet() },
      ]}
      connectorProps={{
        style: {
          "--background": "#111411",
          "--divider": "#1E241E",
          "--btn-primary": "#D6FF3A",
          "--btn-primary-hover": "#c4ee2e",
          "--btn-secondary": "#1E241E",
          "--btn-secondary-hover": "#2a322a",
          "--icon-primary": "#F3F6F1",
          "--icon-secondary": "#7E877C",
          "--tip-color": "#7E877C",
          color: "#F3F6F1",
        } as CSSProperties,
      }}
    >
      {children}
    </ccc.Provider>
  );
}
