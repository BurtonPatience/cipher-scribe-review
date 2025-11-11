# Cipher Scribe Frontend

This Next.js app is the RainbowKit-powered dashboard for the `CipherScribeReview` contract.  
It mirrors a NeurIPS/ICLR review board: reviewers connect their wallet with RainbowKit, submit encrypted scores, and decrypt aggregated insights once authorized.

## Feature Highlights

- **RainbowKit + Wagmi + Viem** for wallet orchestration (WalletConnect v2 ready)
- **FHEVM SDK** binding that signs `userDecrypt` requests with cached decryption signatures
- **Tailwind UI** that mirrors the [`cipher-scribe-review`](https://github.com/BurtonPatience/cipher-scribe-review) layout
- Dynamic status feed showing encrypted submission health, ACL events, and decrypted metrics

## Requirements

| Tool              | Version |
| ----------------- | ------- |
| Node.js           | 20+     |
| npm               | 9+      |
| WalletConnect PID | create one at [cloud.walletconnect.com](https://cloud.walletconnect.com/) |

## .env.local

```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<your_wc_project_id>
NEXT_PUBLIC_LOCAL_RPC=http://127.0.0.1:8545

# Optional: Override contract addresses dynamically
# Format: NEXT_PUBLIC_CONTRACT_ADDRESS_<CHAIN_ID>=0x...
NEXT_PUBLIC_CONTRACT_ADDRESS_31337=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_CONTRACT_ADDRESS_11155111=0x214664770c723B1694F43E1F26613fdbA957D6F4

# Base Account SDK Configuration (if using Base network)
NEXT_PUBLIC_BASE_ACCOUNT_ENABLED=false
```

The RPC URL can point to any JSON-RPC endpoint that serves the `CipherScribeReview` deployment (Hardhat node by default).

**Contract Address Configuration:**
- By default, contract addresses are auto-generated from `../deployments/**` via `npm run genabi`
- You can override addresses at build time using `NEXT_PUBLIC_CONTRACT_ADDRESS_<CHAIN_ID>` environment variables
- The frontend will prioritize environment variables over generated addresses

**Network Configuration Warning:**
- The app will display network status and prevent operations on unsupported networks
- If contract is not deployed on current network, you'll see a configuration guide
- Always ensure your wallet is connected to the correct network (Sepolia for production data)

**Cross-Origin Policy Configuration:**
- COOP (Cross-Origin-Opener-Policy) is not set to allow Base Account SDK compatibility
- COEP (Cross-Origin-Embedder-Policy) is set to 'require-corp' for FHEVM SharedArrayBuffer support
- If you encounter Base Account SDK issues, ensure COOP is not set to 'same-origin'

## Install & Run

```bash
cd frontend
npm install
npm run dev
# visit http://localhost:3000
```

The dashboard automatically reads ABI/addresses from `../deployments/**`.  
Run `npm run genabi` whenever you redeploy the contract.

## Contract Sync Helpers

```bash
# rebuild ABI + address book from the Hardhat deployments folder
npm run genabi

# clean Next cache
npm run clean
```

## Architecture Notes

- `app/page.tsx` orchestrates wagmi hooks, the FHEVM instance, and the UI state.
- `hooks/usePeerReview.tsx` encapsulates all encrypted submissions, `staticCall` helpers, and `userDecrypt` flows.
- `hooks/useRainbowSigner.ts` converts a Wagmi `walletClient` into an `ethers.JsonRpcSigner` for `FhevmDecryptionSignature`.
- Branding assets live in `public/cipher-scribe-logo.svg` and `app/icon.svg`.

## Recommended Workflow

1. Start the Hardhat node and deploy `CipherScribeReview`.
2. `npm run genabi` to sync ABI → `frontend/abi/`.
3. `npm run dev` to boot the dashboard.
4. Connect with RainbowKit using the Hardhat account (WalletConnect or injected wallet).
5. Submit encrypted scores, call “Decrypt final average”, and inspect the updated cards.

## Docs

- [RainbowKit Docs](https://www.rainbowkit.com/docs/introduction)
- [Wagmi React Hooks](https://wagmi.sh/react/getting-started)
- [Viem Docs](https://viem.sh/)
- [FHEVM SDK](https://docs.zama.ai/fhevm)

## License

BSD-3-Clause-Clear — see `LICENSE`.
