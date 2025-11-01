"use client";

import { useMemo, useState } from "react";
import { ethers } from "ethers";
import { useAccount, useWalletClient } from "wagmi";
import { Activity, Lock, ShieldCheck, Sparkles } from "lucide-react";
import clsx from "clsx";
import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { usePeerReview } from "@/hooks/usePeerReview";
import { useRainbowSigner } from "@/hooks/useRainbowSigner";

const MOCK_CHAINS: Record<number, string> = {
  31337: process.env.NEXT_PUBLIC_LOCAL_RPC ?? "http://127.0.0.1:8545",
  // Temporarily mock Sepolia until Zama relayer service is stable
  11155111: `https://sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY ?? 'b18fb7e6ca7045ac83c41157ab93f990'}`,
};

export default function Home() {
  const { address, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const signer = useRainbowSigner(walletClient);
  const { storage } = useInMemoryStorage();
  const [score, setScore] = useState(7);

  const eip1193Provider = useMemo<ethers.Eip1193Provider | undefined>(() => {
    if (!walletClient) return undefined;
    return {
      request: walletClient.request.bind(walletClient),
    } as ethers.Eip1193Provider;
  }, [walletClient]);

  const fhevm = useFhevm({
    provider: eip1193Provider,
    chainId,
    initialMockChains: MOCK_CHAINS,
    enabled: Boolean(walletClient), // Only enable FHEVM when wallet is connected
  });

  const peerReview = usePeerReview({
    instance: fhevm.instance,
    storage,
    chainId,
    account: address,
    ethersSigner: signer,
  });

  const selectedPaper = peerReview.selectedPaper;

  const heroTitle = selectedPaper
    ? selectedPaper.title
    : "No paper selected";

  const readinessMessage = !peerReview.isContractReady
    ? "Deploy the CipherScribeReview contract on this network."
    : !peerReview.isConnected
      ? "Connect a wallet to start encrypted reviewing."
      : fhevm.status !== "ready"
        ? "FHE runtime is loading secure modules..."
        : undefined;

  const safeScore = Math.max(0, Math.min(10, score));

  // States for paper registration
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [newPaperId, setNewPaperId] = useState("");
  const [newPaperTitle, setNewPaperTitle] = useState("");
  const [newPaperTrack, setNewPaperTrack] = useState("");
  const [newPaperAuthorHash, setNewPaperAuthorHash] = useState("");

  // Always show create paper button for easy access
  const shouldShowCreateButton = !showRegisterForm;

  const statCards = [
    {
      label: "Decrypted Final Score",
      value:
        peerReview.decryptedAverage !== undefined
          ? peerReview.decryptedAverage.toFixed(2)
          : "Encrypted",
      icon: Sparkles,
      accent: "from-cyan-400 to-blue-500",
    },
    {
      label: "Encrypted Sum",
      value:
        peerReview.decryptedTotal !== undefined
          ? peerReview.decryptedTotal.toString()
          : "Protected",
      icon: ShieldCheck,
      accent: "from-emerald-400 to-teal-500",
    },
    {
      label: "Total Reviews",
      value: selectedPaper ? selectedPaper.reviewCount : 0,
      icon: Activity,
      accent: "from-fuchsia-400 to-indigo-500",
    },
  ];

  return (
    <div className="flex flex-col gap-8 pb-10">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-900/60 backdrop-blur">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-cyan-200">
              Cipher Scribe · Encrypted Ops Console
            </p>
            <h1 className="mt-4 text-3xl font-semibold text-white md:text-4xl">
              {heroTitle}
            </h1>
            <p className="mt-2 text-base text-slate-200">
              Securely orchestrate FHE-backed peer review cycles. Submit scores
              as ciphertext, grant selective visibility, and decrypt aggregated
              insights on-demand.
            </p>
          </div>
          <div className="rounded-2xl border border-cyan-400/30 bg-gradient-to-r from-cyan-500/20 to-slate-900/40 px-6 py-4">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">
              Network
            </p>
            <p className="mt-2 text-lg font-medium text-white">
              {chainId ?? "—"} ·{" "}
              {peerReview.contractAddress
                ? peerReview.contractAddress.slice(0, 10) + "…"
                : "Contract unavailable"}
            </p>
            <p className="text-xs text-slate-300">
              {fhevm.status === "ready"
                ? "FHE coprocessor synced"
                : `FHE status: ${fhevm.status}`}
            </p>
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-white/5 bg-slate-900/40 px-4 py-5"
            >
              <div className="flex items-center gap-3">
                <div
                  className={clsx(
                    "rounded-xl bg-gradient-to-br p-2 text-white",
                    card.accent,
                  )}
                >
                  <card.icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-slate-300">
                  {card.label}
                </p>
              </div>
              <p className="mt-4 text-3xl font-semibold text-white">
                {card.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {readinessMessage ? (
        <section className="rounded-3xl border border-dashed border-cyan-400/40 bg-cyan-500/5 p-8 text-center text-cyan-100">
          <Lock className="mx-auto h-10 w-10 text-cyan-300" />
          <p className="mt-4 text-lg font-medium">{readinessMessage}</p>
        </section>
      ) : (
        <section className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          {/* Create New Review Button - Show when no papers exist */}
          {shouldShowCreateButton && (
            <div className="col-span-full">
              <div className="rounded-3xl border-2 border-dashed border-cyan-400/40 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20">
                  <span className="text-2xl">📝</span>
                </div>
                <h3 className="mb-2 text-xl font-semibold text-white">Start Your First Paper Review</h3>
                <p className="mb-6 text-slate-400">
                  Create an encrypted peer review session where reviewers can submit scores anonymously using FHE technology.
                </p>
                <button
                  onClick={() => setShowRegisterForm(true)}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-cyan-500/30 transition hover:scale-105 hover:shadow-cyan-500/50"
                >
                  🚀 Create New Paper Review
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-white/5 bg-slate-900/30 p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-300">
                  Papers
                </p>
                <div className="flex gap-2">
                  <button
                    className="rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30 transition"
                    onClick={() => setShowRegisterForm(!showRegisterForm)}
                  >
                    {showRegisterForm ? "❌ Cancel" : "📝 Create New Paper"}
                  </button>
                  <button
                    className="rounded-lg border border-slate-600/30 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:border-slate-500/50 hover:text-slate-300 transition"
                    onClick={() => peerReview.refresh()}
                  >
                    🔄 Refresh
                  </button>
                </div>

                {/* Always visible create button */}
                <div className="mt-2">
                  <button
                    className="w-full rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/30 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/30 transition"
                    onClick={() => setShowRegisterForm(!showRegisterForm)}
                  >
                    🚀 {showRegisterForm ? "Hide Create Form" : "Create New Review Session"}
                  </button>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {peerReview.papers.map((paper) => (
                  <button
                    key={paper.paperId}
                    onClick={() => peerReview.selectPaper(paper.paperId)}
                    className={clsx(
                      "rounded-2xl border px-4 py-3 text-left transition duration-300",
                      paper.paperId === selectedPaper?.paperId
                        ? "border-cyan-400/60 bg-cyan-500/10 shadow-lg shadow-cyan-500/20"
                        : "border-white/5 bg-slate-900/40 hover:border-cyan-300/40",
                    )}
                  >
                    <p className="text-base font-semibold text-white">
                      {paper.title}
                    </p>
                    <p className="text-sm text-slate-300">{paper.track}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {paper.reviewCount} reviews · Updated{" "}
                      {paper.updatedAt.toLocaleDateString()}
                    </p>
                  </button>
                ))}
                {peerReview.papers.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/40 p-6 text-center text-slate-400">
                    No papers registered yet.
                  </div>
                )}
              </div>

              {/* Paper Registration Form */}
              {showRegisterForm && (
                <div className="mt-6 rounded-2xl border-2 border-cyan-400/40 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 p-6 shadow-lg shadow-cyan-500/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="rounded-full bg-cyan-500/20 p-2">
                      <span className="text-lg">📝</span>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-white">Create New Paper Review</p>
                      <p className="text-sm text-slate-400">Start a new encrypted peer review session</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Paper ID <span className="text-xs text-slate-500">(unique identifier)</span>
                        </label>
                    <input
                      type="text"
                          placeholder="e.g., paper-2024-001"
                      value={newPaperId}
                      onChange={(e) => setNewPaperId(e.target.value)}
                          className="w-full rounded-lg border border-slate-600/30 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-400/60 focus:outline-none transition"
                    />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Category/Track
                        </label>
                    <input
                      type="text"
                          placeholder="e.g., Computer Science, AI/ML"
                      value={newPaperTrack}
                      onChange={(e) => setNewPaperTrack(e.target.value)}
                          className="w-full rounded-lg border border-slate-600/30 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-400/60 focus:outline-none transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Paper Title
                      </label>
                      <input
                        type="text"
                        placeholder="Enter the full title of the paper"
                        value={newPaperTitle}
                        onChange={(e) => setNewPaperTitle(e.target.value)}
                        className="w-full rounded-lg border border-slate-600/30 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-400/60 focus:outline-none transition"
                    />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Author Hash <span className="text-xs text-slate-500">(optional)</span>
                      </label>
                    <input
                      type="text"
                        placeholder="Anonymous author identifier"
                      value={newPaperAuthorHash}
                      onChange={(e) => setNewPaperAuthorHash(e.target.value)}
                        className="w-full rounded-lg border border-slate-600/30 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-400/60 focus:outline-none transition"
                    />
                    </div>

                    <div className="flex gap-3 pt-2">
                    <button
                      disabled={peerReview.isRegistering || !newPaperId || !newPaperTitle || !newPaperTrack}
                      onClick={() => {
                        peerReview.registerPaper(newPaperId, newPaperTitle, newPaperTrack, newPaperAuthorHash);
                        setNewPaperId("");
                        setNewPaperTitle("");
                        setNewPaperTrack("");
                        setNewPaperAuthorHash("");
                        setShowRegisterForm(false);
                      }}
                        className="flex-1 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30 transition hover:scale-[1.02] hover:shadow-cyan-500/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                    >
                        {peerReview.isRegistering ? "🚀 Creating Review..." : "🚀 Create Paper Review"}
                      </button>

                      <button
                        onClick={() => setShowRegisterForm(false)}
                        className="rounded-lg border border-slate-600/50 px-6 py-3 text-sm font-semibold text-slate-400 hover:border-slate-500/70 hover:text-slate-300 transition"
                      >
                        Cancel
                    </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/5 bg-slate-900/30 p-6">
              {peerReview.hasUserVoted ? (
                // User has already voted - show decryption options only
                <>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">
                    Voting Results
                  </p>
                  <div className="mt-4 space-y-4">
                    <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/20 p-4">
                      <p className="text-sm font-medium text-emerald-300 mb-2">
                        ✅ Your encrypted score has been submitted successfully
                      </p>
                      <p className="text-xs text-emerald-200/70">
                        Your vote is now part of the encrypted tally and cannot be viewed until decrypted.
                    </p>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-medium text-slate-300">
                        Decrypt Results:
                      </p>
                      <div className="grid gap-2">
                      <button
                          disabled={peerReview.isDecrypting || !fhevm.instance}
                          onClick={() => {
                            console.log("FHEVM instance:", fhevm.instance);
                            console.log("Selected paper:", selectedPaper);
                            peerReview.decryptFinalScore();
                          }}
                          className="w-full rounded-xl border border-cyan-200/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/60 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {peerReview.isDecrypting
                            ? "🔓 Decrypting Average Score..."
                            : "📊 View Final Average Score"}
                      </button>
                      <button
                          disabled={peerReview.isDecrypting || !fhevm.instance}
                          onClick={() => {
                            console.log("FHEVM instance:", fhevm.instance);
                            console.log("Selected paper:", selectedPaper);
                            peerReview.decryptEncryptedTotal();
                          }}
                          className="w-full rounded-xl border border-emerald-200/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-200/60 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                          {peerReview.isDecrypting
                            ? "🔓 Decrypting Total..."
                            : "🔢 View Encrypted Total Score"}
                      </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : selectedPaper ? (
                // User hasn't voted yet - show score submission
                <>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">
                    Submit Encrypted Score
                  </p>
                  <div className="mt-4 space-y-4">
                    <div className="rounded-xl bg-slate-800/50 border border-slate-600/30 p-4">
                      <p className="text-sm text-slate-300 mb-3">
                        Rate this paper (0-10 scale):
                      </p>
                      <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                      <span>Score: {safeScore}</span>
                      <span>0 — 10</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      step={1}
                      value={safeScore}
                      onChange={(event) => setScore(Number(event.target.value))}
                        className="w-full accent-cyan-400"
                    />
                  </div>

                  <button
                    disabled={peerReview.isSubmitting}
                    onClick={() => peerReview.submitScore(safeScore)}
                      className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-base font-semibold text-white shadow-lg shadow-cyan-500/30 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                      {peerReview.isSubmitting ? "🔐 Encrypting & Submitting..." : "🚀 Submit Encrypted Score"}
                  </button>
                  </div>
                </>
              ) : (
                // No paper selected
                <>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">
                    Paper Review
                  </p>
                  <div className="mt-4 rounded-xl bg-slate-800/30 border border-dashed border-slate-600/50 p-6 text-center">
                    <p className="text-slate-400 mb-2">
                      📄 No paper selected
                    </p>
                    <p className="text-xs text-slate-500">
                      Select a paper from the list above to start reviewing
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-white/5 bg-slate-900/30 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">
                Status
              </p>
              {peerReview.statusMessage && (
                <p className="mt-4 text-sm text-slate-300">
                  {peerReview.statusMessage}
                </p>
              )}
              {!peerReview.statusMessage && (
                <p className="mt-4 text-sm text-slate-400">
                  Ready to review papers with FHE encryption.
                </p>
              )}
            </div>

            <div className="rounded-3xl border border-white/5 bg-slate-900/30 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">
                Review Ops Feed
              </p>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-3">
                  <p className="text-base font-medium text-white">
                    Ciphertext submissions
                  </p>
                  <p className="text-sm text-slate-400">
                    Last activity {selectedPaper?.updatedAt.toLocaleTimeString() ?? "—"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-3">
                  <p className="text-base font-medium text-white">
                    Ready for committee
                  </p>
                  <p className="text-sm text-slate-400">
                    {selectedPaper
                      ? `${selectedPaper.reviewCount} encrypted reviews`
                      : "Waiting for reviewers"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
