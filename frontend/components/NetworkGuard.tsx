"use client";

import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { usePeerReview } from "@/hooks/usePeerReview";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";

interface NetworkGuardProps {
  children: React.ReactNode;
}

export function NetworkGuard({ children }: NetworkGuardProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { storage } = useInMemoryStorage();
  const { isContractReady } = usePeerReview({
    instance: undefined,
    storage,
    chainId,
    account: address,
    ethersSigner: undefined,
  });

  const getNetworkIssues = () => {
    const issues: string[] = [];

    if (!isConnected) {
      issues.push("Wallet not connected");
    }

    if (chainId && ![11155111, 31337].includes(chainId)) {
      issues.push("Unsupported network - please switch to Sepolia or Hardhat");
    }

    if (isConnected && chainId && [11155111, 31337].includes(chainId) && !isContractReady) {
      issues.push("Contract not deployed on current network");
    }

    return issues;
  };

  const issues = getNetworkIssues();

  if (issues.length === 0) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-yellow-400" />
          <h2 className="text-xl font-semibold text-white">Network Configuration Issue</h2>
        </div>

        <div className="space-y-3 mb-6">
          {issues.map((issue, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
              <p className="text-white/80 text-sm">{issue}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {chainId && ![11155111, 31337].includes(chainId) && (
            <div className="space-y-2">
              <button
                onClick={() => switchChain({ chainId: 11155111 })}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Switch to Sepolia Testnet
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                onClick={() => switchChain({ chainId: 31337 })}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Switch to Hardhat (Local)
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          )}

          {issues.includes("Contract not deployed on current network") && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <p className="text-yellow-200 text-sm">
                <strong>Contract Address Setup:</strong>
                <br />
                {chainId === 11155111 ? (
                  <>
                    Sepolia address is configured. Make sure your contract is deployed at:
                    <br />
                    <code className="bg-black/20 px-1 rounded block mt-1">
                      0x214664770c723B1694F43E1F26613fdbA957D6F4
                    </code>
                  </>
                ) : (
                  <>
                    Create a <code className="bg-black/20 px-1 rounded">.env.local</code> file with:
                    <br />
                    <code className="bg-black/20 px-1 rounded block mt-1">
                      NEXT_PUBLIC_CONTRACT_ADDRESS_{chainId}=0x[your-contract-address]
                    </code>
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
