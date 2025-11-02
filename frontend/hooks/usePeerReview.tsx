"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";

import { CipherScribeReviewABI } from "@/abi/CipherScribeReviewABI";
import { CipherScribeReviewAddresses } from "@/abi/CipherScribeReviewAddresses";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";

const READONLY_URLS: Record<number, string> = {
  31337: process.env.NEXT_PUBLIC_LOCAL_RPC ?? "http://127.0.0.1:8545",
  11155111: `https://sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY ?? 'b18fb7e6ca7045ac83c41157ab93f990'}`,
};

type PaperSummary = {
  paperId: `0x${string}`; // bytes32 from contract
  title: string;
  track: string;
  authorHash: string;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type PeerReviewState = {
  contractAddress?: `0x${string}`;
  isContractReady: boolean;
  isConnected: boolean;
  papers: PaperSummary[];
  selectedPaper?: PaperSummary;
  selectPaper: (paperId: string) => Promise<void>;
  refresh: () => Promise<void>;
  submitScore: (score: number) => Promise<void>;
  decryptFinalScore: () => Promise<void>;
  decryptEncryptedTotal: () => Promise<void>;
  registerPaper: (paperId: string, title: string, track: string, authorHash: string) => Promise<void>;
  hasUserVoted?: boolean;
  decryptedAverage?: number;
  decryptedTotal?: number;
  statusMessage?: string;
  isSubmitting: boolean;
  isDecrypting: boolean;
  isRegistering: boolean;
  relayerHealth: 'unknown' | 'healthy' | 'unhealthy';
  checkRelayerHealth: () => Promise<boolean>;
};

export function usePeerReview(parameters: {
  instance: FhevmInstance | undefined;
  storage: GenericStringStorage;
  chainId: number | undefined;
  account: string | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
}) {
  const { instance, storage, chainId, account, ethersSigner } = parameters;
  const [papers, setPapers] = useState<PaperSummary[]>([]);
  const [selectedPaperId, setSelectedPaperId] = useState<string | undefined>();
  const [decryptedAverage, setDecryptedAverage] = useState<number | undefined>(
    undefined,
  );
  const [decryptedTotal, setDecryptedTotal] = useState<number | undefined>(
    undefined,
  );
  const [statusMessage, setStatusMessage] = useState<string | undefined>(
    undefined,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [hasUserVoted, setHasUserVoted] = useState<boolean | undefined>(undefined);
  const [relayerHealth, setRelayerHealth] = useState<'unknown' | 'healthy' | 'unhealthy'>('unknown');

  // Support dynamic contract address from environment variable at runtime
  // Next.js public env vars (NEXT_PUBLIC_*) are available at build time
  // and can be overridden via .env.local or deployment environment
  const getContractAddress = useCallback((chainId: number | undefined) => {
    if (!chainId) return undefined;

    // First, try environment variable (build-time or runtime override)
    // Format: NEXT_PUBLIC_CONTRACT_ADDRESS_<CHAIN_ID>
    const envKey = `NEXT_PUBLIC_CONTRACT_ADDRESS_${chainId}`;
    const envAddress = process.env[envKey] as string | undefined;
    if (envAddress && /^0x[a-fA-F0-9]{40}$/.test(envAddress)) {
      console.log(`Using contract address from environment: ${envAddress} for chain ${chainId}`);
      return envAddress as `0x${string}`;
    }

    // Second, try hardcoded default addresses for known networks
    const defaultAddresses: Record<number, string> = {
      31337: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // Hardhat localhost
      11155111: "0xe3cec2B0BD16fF86919e70b533770d2a0FB47E76", // Sepolia mainnet
    };

    const defaultAddress = defaultAddresses[chainId];
    if (defaultAddress) {
      console.log(`Using default contract address: ${defaultAddress} for chain ${chainId}`);
      return defaultAddress as `0x${string}`;
    }

    // Fallback to generated addresses from deployment files (only if valid)
    const entry = CipherScribeReviewAddresses[
      chainId.toString() as keyof typeof CipherScribeReviewAddresses
    ];

    // Only use generated address if it's valid (not the zero address)
    if (entry?.address && entry.address !== "0x0000000000000000000000000000000000000000") {
      console.log(`Using generated contract address: ${entry.address} for chain ${chainId}`);
      return entry?.address as `0x${string}` | undefined;
    }

    // If no valid address found, return undefined
    console.warn(`No valid contract address found for chain ${chainId}. Please configure NEXT_PUBLIC_CONTRACT_ADDRESS_${chainId} or check deployment.`);
    return undefined;
  }, []);

  const contractEntry = useMemo(() => {
    if (!chainId) return undefined;
    const address = getContractAddress(chainId);
    if (!address) return undefined;

    // Find the entry from generated addresses or create a dynamic one
    const staticEntry = CipherScribeReviewAddresses[
      chainId.toString() as keyof typeof CipherScribeReviewAddresses
    ];

    // Always return the dynamic configuration
    return {
      address,
      chainId,
      chainName: staticEntry?.chainName || `chain-${chainId}`,
    };
  }, [chainId, getContractAddress]);

  const contractAddress = contractEntry?.address as `0x${string}` | undefined;
  const isContractReady =
    Boolean(contractAddress) && contractAddress !== ethers.ZeroAddress;

  const readonlyProvider = useMemo(() => {
    if (!contractEntry) return undefined;
    // Always use dedicated RPC providers for readonly operations to avoid wallet provider issues
    const fallbackRpc = READONLY_URLS[contractEntry.chainId];
    if (fallbackRpc) {
      console.log(`[usePeerReview] Using dedicated RPC for chain ${contractEntry.chainId}: ${fallbackRpc}`);
      return new ethers.JsonRpcProvider(fallbackRpc);
    }
    // Only fallback to signer provider if no dedicated RPC is configured
    console.log(`[usePeerReview] Using signer provider for chain ${contractEntry.chainId}`);
    return ethersSigner?.provider;
  }, [contractEntry, ethersSigner]);

  const readonlyContract = useMemo(() => {
    if (!contractAddress || !readonlyProvider) return undefined;
    return new ethers.Contract(
      contractAddress,
      CipherScribeReviewABI.abi,
      readonlyProvider,
    );
  }, [contractAddress, readonlyProvider]);

  const contractWithSigner = useMemo(() => {
    if (!contractAddress || !ethersSigner) return undefined;
    return new ethers.Contract(
      contractAddress,
      CipherScribeReviewABI.abi,
      ethersSigner,
    );
  }, [contractAddress, ethersSigner]);

  const selectedPaper = useMemo(
    () => papers.find((paper) => paper.paperId === selectedPaperId),
    [papers, selectedPaperId],
  );

  const refresh = useCallback(async () => {
    if (!readonlyContract) {
      console.log("[usePeerReview] No readonly contract available");
      setPapers([]);
      setSelectedPaperId(undefined);
      setStatusMessage("Contract not available on this network");
      return;
    }

    // Only call contract if we're on a network where contract should exist
    if (chainId !== 31337 && chainId !== 11155111) {
      console.log(`[usePeerReview] Unsupported network: ${chainId}`);
      setPapers([]);
      setSelectedPaperId(undefined);
      setStatusMessage("Unsupported network. Please connect to localhost (Hardhat) or Sepolia.");
      return;
    }

    try {
      console.log(`[usePeerReview] Fetching papers from chain ${chainId}, contract ${contractAddress}`);
      const response = await readonlyContract.listPapers();
      console.log(`[usePeerReview] Received ${response.length} papers`);

      // If we're on localhost and no papers exist, create a test paper
      if (chainId === 31337 && response.length === 0 && contractWithSigner) {
        console.log("[usePeerReview] No papers found on localhost, creating test paper...");
        try {
          const testPaperId = "demo-paper-001";
          const paperIdBytes32 = ethers.keccak256(ethers.toUtf8Bytes(testPaperId));
          const tx = await contractWithSigner.registerPaper(
            paperIdBytes32,
            "Demo Paper: FHE-Based Secure Computing",
            "Computer Science",
            "demo-author-hash"
          );
          await tx.wait();
          console.log("[usePeerReview] Test paper created successfully");

          // Re-fetch papers after creating test paper
          const updatedResponse = await readonlyContract.listPapers();
          console.log(`[usePeerReview] After creating test paper: ${updatedResponse.length} papers`);
          response.splice(0, response.length, ...updatedResponse);
        } catch (createError) {
          console.warn("[usePeerReview] Failed to create test paper:", createError);
        }
      }

      const mapped: PaperSummary[] = response.map((paper: any) => ({
        paperId: paper.paperId, // Keep as bytes32 for internal use
        title: paper.title,
        track: paper.track,
        authorHash: paper.authorHash,
        reviewCount: Number(paper.reviewCount),
        createdAt: new Date(Number(paper.createdAt) * 1000),
        updatedAt: new Date(Number(paper.updatedAt) * 1000),
      }));
      setPapers(mapped);
      if (!selectedPaperId && mapped.length > 0) {
        setSelectedPaperId(mapped[0].paperId);
      }
      setStatusMessage(`Loaded ${mapped.length} papers`);
    } catch (error: any) {
      console.error("Failed to fetch papers:", error);
      setPapers([]);
      setSelectedPaperId(undefined);
      // Check if it's a network/contract issue
      if (error.code === 'CALL_EXCEPTION' || error.reason === 'require(false)' || error.message?.includes('require(false)')) {
        if (chainId === 11155111) {
          setStatusMessage("Sepolia contract not deployed yet. Please switch to localhost network to test.");
        } else if (chainId === 31337) {
          setStatusMessage("Contract not found on localhost. Please ensure Hardhat node is running and contract is deployed.");
        } else {
          setStatusMessage("Contract not deployed on this network. Please switch to localhost or deploy the contract.");
        }
      } else {
        setStatusMessage("Unable to load papers from the contract.");
      }
    }
  }, [readonlyContract, selectedPaperId, chainId, contractWithSigner]);

  useEffect(() => {
    if (isContractReady) {
      refresh();
    }
  }, [isContractReady, refresh]);

  // Reset state when network changes
  useEffect(() => {
    console.log(`[usePeerReview] Network changed to ${chainId}`);
    setPapers([]);
    setSelectedPaperId(undefined);
    setDecryptedAverage(undefined);
    setDecryptedTotal(undefined);
    setHasUserVoted(undefined);
    setStatusMessage("Network changed, reloading data...");
  }, [chainId]);

  const selectPaper = useCallback(async (paperId: string) => {
    setSelectedPaperId(paperId);
    setDecryptedAverage(undefined);
    setDecryptedTotal(undefined);
    setHasUserVoted(undefined);

    // Check if user has already voted for this paper
    if (readonlyContract && account) {
      try {
        // paperId is already bytes32 from contract, use directly
        const hasVoted = await readonlyContract.reviewerHasSubmitted(paperId, account);
        setHasUserVoted(hasVoted);
      } catch (error) {
        console.error("Failed to check voting status:", error);
        setHasUserVoted(false);
      }
    }
  }, [readonlyContract, account]);

  const requireReady = useCallback(() => {
    if (!isContractReady) {
      throw new Error("Contract is not deployed on the connected network.");
    }
    if (!contractWithSigner || !ethersSigner || !account) {
      throw new Error("Connect your wallet to interact with the contract.");
    }
    // Only require FHEVM instance for Sepolia network (real FHEVM operations)
    if (chainId === 11155111 && !instance) {
      throw new Error("FHEVM is not ready. Please wait for initialization.");
    }
    if (!selectedPaperId) {
      throw new Error("Select a paper first.");
    }
  }, [account, contractWithSigner, ethersSigner, instance, isContractReady, selectedPaperId, chainId]);

  const checkRelayerHealth = useCallback(async (): Promise<boolean> => {
    if (!instance || chainId !== 11155111) {
      // For localhost or when no instance, consider it healthy
      setRelayerHealth('healthy');
      return true;
    }

    try {
      setRelayerHealth('unknown');
      // Try a simple encryption operation to test relayer connectivity
      const testInput = instance.createEncryptedInput(
        contractAddress as `0x${string}`,
        account as `0x${string}`,
      );
      testInput.add32(1); // Simple test value

      // Set a timeout for the health check
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Health check timeout')), 10000);
      });

      await Promise.race([testInput.encrypt(), timeoutPromise]);

      setRelayerHealth('healthy');
      console.log('Relayer health check: PASSED');
      return true;
    } catch (error: any) {
      console.error('Relayer health check failed:', error);
      setRelayerHealth('unhealthy');

      // Don't show error message for health checks, just log it
      const errorMessage = error.message || 'Unknown error';
      if (errorMessage.includes('relayer') ||
          errorMessage.includes('backend') ||
          errorMessage.includes('connection') ||
          errorMessage.includes('task has stopped')) {
        console.warn('Relayer service appears to be down or experiencing issues');
      }

      return false;
    }
  }, [instance, chainId, contractAddress, account]);

  const submitScore = useCallback(
    async (score: number) => {
      const maxRetries = 3;
      let lastError: Error | undefined;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          requireReady();
          if (!contractWithSigner || !selectedPaperId || !account) {
            return;
          }

          // For localhost, skip FHEVM instance requirement
          if (chainId === 31337 && !instance) {
            console.log("Localhost development: skipping FHEVM instance requirement");
          } else if (chainId !== 31337 && !instance) {
            return;
          }

          setIsSubmitting(true);

          let encrypted;
          if (chainId === 31337) {
            // Localhost development: use mock encrypted data
            console.log("Localhost development: using mock encrypted data");
            setStatusMessage("Preparing score for localhost development...");

            // Create mock encrypted data that the contract can handle
            encrypted = {
              handles: [`0x${BigInt(score).toString(16).padStart(64, '0')}`], // 32 bytes hex representation
              inputProof: `0x${'0'.repeat(64)}` // 32 bytes of zeros
            };
          } else {
            // Production: use real FHEVM encryption
            if (attempt > 1) {
              setStatusMessage(`Retrying encryption (attempt ${attempt}/${maxRetries})...`);
              // Add exponential backoff delay
              await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
            } else {
              setStatusMessage("Encrypting score...");
              await new Promise((resolve) => setTimeout(resolve, 80));
            }

            try {
              const input = instance!.createEncryptedInput(
                contractAddress as `0x${string}`,
                account as `0x${string}`,
              );
              input.add32(score);
              encrypted = await input.encrypt();
            } catch (encryptError: any) {
              console.error(`FHEVM encryption failed (attempt ${attempt}):`, encryptError);
              lastError = encryptError;

              // Check if it's a relayer connectivity issue that might be temporary
              const isTemporaryError = encryptError.message?.includes("relayer") ||
                encryptError.message?.includes("backend") ||
                encryptError.message?.includes("connection") ||
                encryptError.message?.includes("task has stopped") ||
                encryptError.message?.includes("network") ||
                encryptError.message?.includes("timeout");

              if (isTemporaryError && attempt < maxRetries) {
                console.log(`Temporary FHEVM error detected, retrying in ${Math.pow(2, attempt)} seconds...`);
                continue; // Try again
              }

              // If it's the last attempt or not a temporary error, throw appropriate error
              if (isTemporaryError) {
                throw new Error("FHEVM relayer service is currently unavailable. This is a temporary network issue. Please try again in a few minutes. If the problem persists, contact support.");
              } else {
                // For other FHEVM errors, provide a more user-friendly message
                throw new Error(`Encryption failed: ${encryptError.message || "Unknown FHEVM error"}. Please ensure you're connected to Sepolia network and try again.`);
              }
            }
          }

          setStatusMessage("Submitting score to the contract...");
          // selectedPaperId is already bytes32 from contract, use directly
          const paperIdBytes32 = selectedPaperId;
          const tx = await contractWithSigner.submitScore(
            paperIdBytes32,
            encrypted.handles[0],
            encrypted.inputProof,
          );
          await tx.wait();
          setStatusMessage("Score submitted successfully!");
          setHasUserVoted(true);
          setDecryptedAverage(undefined);
          setDecryptedTotal(undefined);
          refresh();
          return; // Success, exit the retry loop

        } catch (error) {
          console.error(`Submit score attempt ${attempt} failed:`, error);
          lastError = error as Error;

          // If this is not the last attempt and it's a temporary error, continue to retry
          if (attempt < maxRetries) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            if (errorMessage.includes("relayer") ||
                errorMessage.includes("backend") ||
                errorMessage.includes("connection") ||
                errorMessage.includes("task has stopped") ||
                errorMessage.includes("network") ||
                errorMessage.includes("timeout")) {
              console.log(`Temporary error detected, will retry... (${attempt}/${maxRetries})`);
              continue;
            }
          }

          // If we've exhausted retries or it's not a temporary error, break out
          break;
        } finally {
          if (attempt === maxRetries) {
            setIsSubmitting(false);
          }
        }
      }

      // If we get here, all retries failed
      console.error("All submit score attempts failed:", lastError);
      setStatusMessage(
        lastError?.message || "Failed to submit score after multiple attempts.",
      );
      setIsSubmitting(false);
    },
    [account, chainId, contractAddress, contractWithSigner, instance, refresh, requireReady, selectedPaperId],
  );

  const registerPaper = useCallback(
    async (paperId: string, title: string, track: string, authorHash: string) => {
      try {
        if (!contractWithSigner || !account) {
          throw new Error("Connect your wallet to register papers.");
        }
        if (!paperId || !title || !track) {
          throw new Error("Paper ID, title, and track are required.");
        }

        setIsRegistering(true);
        setStatusMessage("Registering paper...");

        // Convert string paperId to bytes32 using keccak256
        const paperIdBytes32 = ethers.keccak256(ethers.toUtf8Bytes(paperId));

        const tx = await contractWithSigner.registerPaper(
          paperIdBytes32,
          title,
          track,
          authorHash || "",
        );
        await tx.wait();

        setStatusMessage("Paper registered successfully!");
        refresh();
      } catch (error) {
        console.error(error);
        setStatusMessage(
          error instanceof Error ? error.message : "Failed to register paper.",
        );
      } finally {
        setIsRegistering(false);
      }
    },
    [contractWithSigner, account, refresh],
  );

  const decryptHandle = useCallback(
    async (handle: string) => {
      if (!contractAddress) {
        throw new Error("Contract address not available.");
      }

      setStatusMessage("Decrypting...");

      try {
        console.log(`[decryptHandle] Decrypting handle: ${handle}`);

        if (chainId === 31337) {
          // Local development mode: simulate decryption by extracting value from handle
          console.log("[decryptHandle] Local development mode: simulating decryption");

          // In local development, the handle contains the plain value
          // For local development, we assume the handle is a hex-encoded uint256
          try {
            const value = parseInt(handle.replace('0x', ''), 16);
            console.log(`[decryptHandle] Simulated decrypted value: ${value}`);
            return value;
          } catch (parseError) {
            console.warn("[decryptHandle] Failed to parse local handle, using fallback", parseError);
            return 0;
          }
        } else {
          // Production mode: use real FHEVM decryption
          if (!instance || !ethersSigner) {
            throw new Error("FHEVM instance or signer not available for production decryption.");
          }

          // Get FHEVM decryption signature - this will trigger MetaMask request
          console.log("[decryptHandle] Requesting FHEVM decryption signature...");
          const signature = await FhevmDecryptionSignature.loadOrSign(
            instance,
            [contractAddress],
            ethersSigner,
            storage
          );

          if (!signature) {
            throw new Error("Unable to obtain FHEVM decryption signature - user may have cancelled the signature request");
          }
          console.log("[decryptHandle] FHEVM decryption signature obtained successfully");

          // This call will trigger MetaMask request for signature
          const decryptResult = await instance.userDecrypt(
            [{ handle, contractAddress }],
            signature.privateKey,
            signature.publicKey,
            signature.signature,
            signature.contractAddresses,
            signature.userAddress,
            signature.startTimestamp,
            signature.durationDays
          );

          const clearValue = (decryptResult as any)[handle];
          console.log(`[decryptHandle] Decrypted value: ${clearValue}`);

          if (typeof clearValue === "bigint") {
            return Number(clearValue);
          }
          return Number(clearValue ?? 0);
        }
      } catch (decryptError) {
        console.error("[decryptHandle] Decryption failed:", decryptError);
        throw decryptError;
      }
    },
    [contractAddress, ethersSigner, instance, storage, chainId],
  );

  const decryptFinalScore = useCallback(async () => {
    try {
      requireReady();
      if (!contractWithSigner || !selectedPaperId || !selectedPaper) {
        return;
      }
      setIsDecrypting(true);
      setStatusMessage("Requesting decryption permission...");

      let sum;
      // Always require decryption permission transaction (MetaMask popup)
      const handle = await contractWithSigner.prepareFinalScore.staticCall(
        selectedPaperId,
      );
      const tx = await contractWithSigner.prepareFinalScore(selectedPaperId);
      await tx.wait();

      if (chainId === 31337) {
        // Local development: simulate FHEVM signature for testing (optional)
        console.log("[decryptFinalScore] Local mode: simulating FHEVM signature request");
        setStatusMessage("Requesting FHEVM decryption signature...");

        // For localhost, we can either:
        // 1. Skip FHEVM signature (current behavior)
        // 2. Simulate a signature request (uncomment below)

        /*
        // Simulate EIP-712 signature request (for testing UI)
        try {
          await new Promise((resolve, reject) => {
            // This would normally trigger MetaMask for EIP-712 signature
            setTimeout(() => {
              console.log("[decryptFinalScore] Simulated FHEVM signature approved");
              resolve(true);
            }, 1000); // Simulate user approval delay
          });
        } catch (error) {
          throw new Error("FHEVM signature cancelled");
        }
        */

        // After signature simulation, get plain sum directly
        console.log("[decryptFinalScore] Local mode: permission granted, using plain sum");
        if (!readonlyContract) throw new Error("Readonly contract not available");
        sum = await readonlyContract.getPlainSum(selectedPaperId);
        console.log("[decryptFinalScore] Local mode: using plain sum", Number(sum));
      } else {
        // Production: use FHE decryption after permission
        sum = await decryptHandle(handle);
      }

      // 计算平均值：总和除以评分数量，确保所有值为 number 类型
      const sumNumber = Number(sum);
      const reviewCountNumber = Number(selectedPaper.reviewCount);
      const average = reviewCountNumber > 0 ? sumNumber / reviewCountNumber : 0;
      setDecryptedAverage(average);
      setStatusMessage("Final score decrypted.");
    } catch (error) {
      console.error(error);
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to decrypt final score.",
      );
    } finally {
      setIsDecrypting(false);
    }
  }, [contractWithSigner, decryptHandle, requireReady, selectedPaperId, selectedPaper]);

  const decryptEncryptedTotal = useCallback(async () => {
    try {
      requireReady();
      if (!contractWithSigner || !selectedPaperId) {
        return;
      }
      setIsDecrypting(true);
      setStatusMessage("Requesting decryption permission...");

      let clear;
      // Always require decryption permission transaction (MetaMask popup)
      const handle = await contractWithSigner.shareEncryptedTotal.staticCall(
        selectedPaperId,
      );
      const tx = await contractWithSigner.shareEncryptedTotal(selectedPaperId);
      await tx.wait();

      if (chainId === 31337) {
        // Local development: after permission granted, get plain sum directly
        console.log("[decryptEncryptedTotal] Local mode: permission granted, using plain sum");
        if (!readonlyContract) throw new Error("Readonly contract not available");
        clear = await readonlyContract.getPlainSum(selectedPaperId);
        console.log("[decryptEncryptedTotal] Local mode: using plain sum", Number(clear));
      } else {
        // Production: use FHE decryption after permission
        clear = await decryptHandle(handle);
      }

      // 确保转换为 number 类型
      setDecryptedTotal(Number(clear));
      setStatusMessage("Encrypted total decrypted.");
    } catch (error) {
      console.error(error);
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to decrypt encrypted sum.",
      );
    } finally {
      setIsDecrypting(false);
    }
  }, [contractWithSigner, decryptHandle, requireReady, selectedPaperId]);

  return {
    contractAddress,
    isContractReady,
    isConnected: Boolean(account && chainId),
    papers,
    selectedPaper,
    selectPaper,
    refresh,
    submitScore,
    registerPaper,
    decryptFinalScore,
    decryptEncryptedTotal,
    hasUserVoted,
    decryptedAverage,
    decryptedTotal,
    statusMessage,
    isSubmitting,
    isDecrypting,
    isRegistering,
    relayerHealth,
    checkRelayerHealth,
  } satisfies PeerReviewState;
}
