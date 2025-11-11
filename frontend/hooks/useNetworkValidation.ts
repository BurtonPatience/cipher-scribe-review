import { useAccount, useChainId } from "wagmi";
import { useMemo } from "react";

export function useNetworkValidation() {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  const validation = useMemo(() => {
    const supportedChains = [11155111, 31337]; // Sepolia and Hardhat
    const isSupportedChain = chainId ? supportedChains.includes(chainId) : false;

    return {
      isConnected,
      chainId,
      isSupportedChain,
      networkName: chainId === 11155111 ? "Sepolia" : chainId === 31337 ? "Hardhat" : "Unknown",
      isValid: isConnected && isSupportedChain,
      errors: [
        !isConnected && "Wallet not connected",
        isConnected && !isSupportedChain && `Unsupported network. Please switch to Sepolia or Hardhat.`,
      ].filter(Boolean) as string[],
    };
  }, [isConnected, chainId]);

  return validation;
}
