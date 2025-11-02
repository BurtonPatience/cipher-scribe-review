"use client";

import type { ReactNode } from "react";
import { WagmiProvider, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { InMemoryStorageProvider } from "@/hooks/useInMemoryStorage";

const queryClient = new QueryClient();

const hardhatChain = {
  id: 31337,
  name: "Hardhat",
  network: "hardhat",
  nativeCurrency: { name: "Hardhat ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_LOCAL_RPC ?? "http://127.0.0.1:8545"],
    },
  },
} as const;

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "cipher-scribe-demo";

const wagmiConfig = getDefaultConfig({
  appName: "Cipher Scribe",
  projectId,
  chains: [hardhatChain, sepolia],
  transports: {
    [hardhatChain.id]: http(hardhatChain.rpcUrls.default.http[0]),
    [sepolia.id]: http(`https://sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY ?? 'b18fb7e6ca7045ac83c41157ab93f990'}`),
  },
  ssr: true,
});

// 支持本地网络和测试网络自由切换

type Props = {
  children: ReactNode;
};

export function Providers({ children }: Props) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider modalSize="compact" locale="en-US">
          <InMemoryStorageProvider>{children}</InMemoryStorageProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
