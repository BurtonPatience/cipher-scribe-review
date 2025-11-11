"use client";

import { useAccount, useChainId } from "wagmi";
import { AlertCircle, CheckCircle, WifiOff } from "lucide-react";
import { usePeerReview } from "@/hooks/usePeerReview";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";

export function NetworkStatus() {
  const { address, chain } = useAccount();
  const chainId = useChainId();
  const { storage } = useInMemoryStorage();
  const { contractAddress, isContractReady } = usePeerReview({
    instance: undefined,
    storage,
    chainId,
    account: address,
    ethersSigner: undefined,
  });

  const getNetworkInfo = () => {
    if (!chain) return null;

    const isMainnet = chain.id === 1;
    const isSepolia = chain.id === 11155111;
    const isHardhat = chain.id === 31337;

    return {
      name: chain.name,
      id: chain.id,
      isSupported: isSepolia || isHardhat,
      isTestnet: isSepolia,
      isLocal: isHardhat,
      isMainnet,
    };
  };

  const networkInfo = getNetworkInfo();

  const getStatusColor = () => {
    if (!networkInfo) return "text-gray-400";
    if (!networkInfo.isSupported) return "text-red-400";
    if (!isContractReady) return "text-yellow-400";
    return "text-green-400";
  };

  const getStatusIcon = () => {
    if (!networkInfo) return <WifiOff className="w-4 h-4" />;
    if (!networkInfo.isSupported) return <AlertCircle className="w-4 h-4" />;
    if (!isContractReady) return <AlertCircle className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  const getStatusMessage = () => {
    if (!networkInfo) return "Not connected";
    if (!networkInfo.isSupported) return `Unsupported network: ${networkInfo.name}`;
    if (!isContractReady) return `Contract not deployed on ${networkInfo.name}`;
    return `Connected to ${networkInfo.name}`;
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      {getStatusIcon()}
      <span className={getStatusColor()}>
        {getStatusMessage()}
      </span>
      {contractAddress && (
        <span className="text-xs text-gray-400 font-mono">
          {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
        </span>
      )}
    </div>
  );
}
