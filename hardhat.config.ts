import "@fhevm/hardhat-plugin";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import type { HardhatUserConfig } from "hardhat/config.js";
import { vars } from "hardhat/config.js";
import "solidity-coverage";

import "./tasks/accounts.ts";
import "./tasks/CipherScribeReview.ts";
import "./tasks/test-simple.ts";
import "./tasks/debug-all.ts";

// Run 'npx hardhat vars setup' to see the list of variables that need to be set

const MNEMONIC: string = vars.get("MNEMONIC", "test test test test test test test test test test test junk");
const INFURA_API_KEY: string = vars.get("INFURA_API_KEY", "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz");

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  namedAccounts: {
    deployer: 0,
  },
  etherscan: {
    apiKey: {
      sepolia: vars.get("ETHERSCAN_API_KEY", ""),
    },
  },
  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS ? true : false,
    excludeContracts: [],
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic: MNEMONIC,
      },
      chainId: 31337,
    },
    localhost: {
      accounts: {
        mnemonic: MNEMONIC,
        path: "m/44'/60'/0'/0/",
        count: 10,
      },
      chainId: 31337,
      url: "http://127.0.0.1:8545",
    },
    sepolia: {
      accounts: ["0x058952ecdb2662e608acc0e50fa5a720d559611140582663e2b36c0c425c21d3"],
      chainId: 11155111,
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      gasPrice: 20000000000, // 20 gwei for FHE operations
    },
    // Additional networks for broader deployment support
    mainnet: {
      accounts: ["0x058952ecdb2662e608acc0e50fa5a720d559611140582663e2b36c0c425c21d3"],
      chainId: 1,
      url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
    },
    polygon: {
      accounts: ["0x058952ecdb2662e608acc0e50fa5a720d559611140582663e2b36c0c425c21d3"],
      chainId: 137,
      url: "https://polygon-rpc.com",
      gasPrice: 40000000000, // 40 gwei for Polygon
    },
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
  solidity: {
    version: "0.8.24",
    settings: {
      metadata: {
        // Not including the metadata hash
        // https://github.com/paulrberg/hardhat-template/issues/31
        bytecodeHash: "none",
      },
      // Enhanced optimizer settings for FHE operations
      optimizer: {
        enabled: true,
        runs: 1000, // Increased for better FHE operation optimization
        details: {
          yul: true,
          yulDetails: {
            stackAllocation: true,
          },
        },
      },
      evmVersion: "cancun",
      viaIR: true, // Enable IR-based compilation for better optimization
    },
  },
  typechain: {
    outDir: "types",
    target: "ethers-v6",
  },
};

export default config;
