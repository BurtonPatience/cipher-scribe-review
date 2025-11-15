# Cipher Scribe · Encrypted Peer Review

## 🌐 Live Demo & Video

- **🚀 Live Application**: [https://cipher-scribe-eosin.vercel.app/](https://cipher-scribe-eosin.vercel.app/)
- **📹 Demo Video**: [https://github.com/BurtonPatience/cipher-scribe-review/blob/main/cipher.mp4](https://github.com/BurtonPatience/cipher-scribe-review/blob/main/cipher.mp4)

Cipher Scribe is an end-to-end FHEVM showcase that mirrors a NeurIPS-style peer review committee.
Reviewers submit 0–10 scores as ciphertext, the contract aggregates them homomorphically, and authorized addresses can decrypt the final score on demand through the front-end dashboard.

## Enhanced Features

- **Reviewer Management**: Admin-controlled reviewer approval system with access controls
- **Paper Categorization**: Research domain classification for better organization
- **Emergency Controls**: Admin-managed emergency stop functionality for critical situations
- **Analytics Dashboard**: Platform-wide review statistics and participation metrics
- **Gas Optimization**: Efficient FHE operations with optimized contract deployment
- **Input Validation**: Comprehensive validation for paper submissions and review scores

## Stack Overview

| Layer     | Tech                                                  |
| --------- | ----------------------------------------------------- |
| Contracts | Hardhat + `@fhevm/solidity` (Fully Homomorphic ops)   |
| Testing   | Hardhat, TypeScript, `@fhevm/hardhat-plugin` mocks    |
| Tasks     | Hardhat Deploy Tasks (`task:list-papers`, `task:submit-score`, etc.) |
| Frontend  | Next.js 15, Tailwind, RainbowKit, Wagmi, Viem         |
| Wallet    | RainbowKit Connect (WalletConnect v2) + FHEVM decrypt flow |
| Security  | Reviewer reputation, approval workflow, emergency controls |
| Analytics | Real-time statistics, performance monitoring, gas optimization |

## 1. Backend Quick Start

   ```bash
# install deps
   npm install

# compile + typechain
npm run compile

# run unit tests (uses the FHE mock runtime)
npm run test
   ```

### Environment variables

   ```bash
   npx hardhat vars set MNEMONIC
   npx hardhat vars set INFURA_API_KEY
npx hardhat vars set ETHERSCAN_API_KEY   # optional
   ```

### Deploy

   ```bash
# local hardhat node (enables encrypted mock runtime)
npx hardhat node

# deploy to the local node
npx hardhat deploy --network localhost

# deploy to Sepolia once ready
npx hardhat deploy --network sepolia
```

### Custom Hardhat tasks

   ```bash
# show deployed address
npx hardhat task:address

# list currently registered papers
npx hardhat task:list-papers

# register and review
npx hardhat task:register-paper --slug "paper-1" --title "Cipher Proofs" --track "FHE"
npx hardhat task:submit-score --slug "paper-1" --score 8

# decrypt final score
npx hardhat task:final-score --slug "paper-1"
# or request the encrypted sum
npx hardhat task:share-total --slug "paper-1"
```

## 2. Frontend Quick Start

```
frontend/
├── app/ (Next.js App Router, RainbowKit layout, hero dashboard)
├── hooks/usePeerReview.tsx (FHE-aware contract hook)
└── public/cipher-scribe-logo.svg (brand assets)
```

Install and run:

   ```bash
cd frontend
npm install
npm run dev
```

### Frontend env vars

Create `frontend/.env.local`:

```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<wc_project_id>
NEXT_PUBLIC_LOCAL_RPC=http://127.0.0.1:8545
```

> The RainbowKit connect button appears in the top-right corner.  
> Once connected, the dashboard lets reviewers submit encrypted scores, trigger homomorphic averages, and decrypt results with the on-chain ACL.

## 3. Project Structure

```
cipher-scribe/
├── contracts/CipherScribeReview.sol   # encrypted peer review logic
├── deploy/deploy.ts                   # hardhat-deploy script
├── tasks/CipherScribeReview.ts        # CLI helpers (register, submit, decrypt)
├── test/CipherScribeReview*.ts        # local + Sepolia tests
├── frontend/                          # RainbowKit dashboard (Next.js)
└── README.md                          # this file
```

## 4. Scripts

| Script              | Description                         |
| ------------------- | ----------------------------------- |
| `npm run compile`   | Compile contracts + typechain       |
| `npm run test`      | Run Hardhat test suite              |
| `npm run coverage`  | Solidity coverage (mock runtime)    |
| `npm run lint`      | Solhint + ESLint + Prettier         |
| `npm run clean`     | Remove artifacts/cache/typechain    |

Frontend scripts (`cd frontend`):

| Script          | Description                             |
| --------------- | --------------------------------------- |
| `npm run dev`   | Next.js dev server + RainbowKit UI      |
| `npm run build` | Production build                        |
| `npm run genabi`| Sync ABI/addresses from Hardhat deploys |

## 5. Docs & Help

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [RainbowKit Docs](https://www.rainbowkit.com/docs/introduction)
- [Wagmi + Viem Guides](https://wagmi.sh/react/getting-started)
- [Zama Discord](https://discord.gg/zama)

---

Built for encrypted reviewer workflows 🔐✨
