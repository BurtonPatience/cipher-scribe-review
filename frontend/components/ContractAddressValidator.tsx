"use client";

import { useAccount, useChainId } from "wagmi";
import { usePeerReview } from "@/hooks/usePeerReview";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";

interface ContractAddressValidatorProps {
  children: (isValid: boolean, contractAddress?: string) => React.ReactNode;
}

export function ContractAddressValidator({ children }: ContractAddressValidatorProps) {
  const { address } = useAccount();
  const chainId = useChainId();
  const { storage } = useInMemoryStorage();
  const { contractAddress, isContractReady } = usePeerReview({
    instance: undefined,
    storage,
    chainId,
    account: address,
    ethersSigner: undefined,
  });

  const isValid = isContractReady && contractAddress !== undefined && contractAddress !== "0x0000000000000000000000000000000000000000";

  return <>{children(isValid, contractAddress)}</>;
}
