"use client";

import { useCallback, useEffect, useState } from "react";
import { ccc } from "@ckb-ccc/connector-react";
import { shannonToIntCkb } from "./ckb";

export function useChainBalance() {
  const signer = ccc.useSigner();
  const [ckb, setCkb] = useState<number | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!signer) {
      setCkb(null);
      setAddress(null);
      return;
    }
    try {
      const [addr, shannon] = await Promise.all([
        signer.getRecommendedAddress(),
        signer.getBalance(),
      ]);
      setAddress(addr);
      setCkb(shannonToIntCkb(shannon));
    } catch {
      setCkb(null);
    }
  }, [signer]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { signer, ckb, address, refresh };
}
