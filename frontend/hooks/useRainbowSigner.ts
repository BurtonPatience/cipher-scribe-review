"use client";

import { useEffect, useMemo, useState } from "react";
import type { WalletClient } from "viem";
import { BrowserProvider, JsonRpcSigner } from "ethers";

export function useRainbowSigner(walletClient: WalletClient | undefined) {
  const [signer, setSigner] = useState<JsonRpcSigner | undefined>(undefined);

  const provider = useMemo(() => {
    if (!walletClient) {
      return undefined;
    }
    const network = walletClient.chain ? {
      chainId: walletClient.chain.id,
      name: walletClient.chain.name,
    } : undefined;
    return new BrowserProvider(walletClient.transport as any, network);
  }, [walletClient]);

  useEffect(() => {
    let cancelled = false;
    async function resolveSigner() {
      if (!provider || !walletClient || !walletClient.account) {
        setSigner(undefined);
        return;
      }
      const nextSigner = await provider.getSigner(walletClient.account.address);
      if (!cancelled) {
        setSigner(nextSigner);
      }
    }
    resolveSigner();
    return () => {
      cancelled = true;
    };
  }, [provider, walletClient]);

  return signer;
}

