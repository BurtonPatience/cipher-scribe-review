import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const CONTRACT_NAME = "CipherScribeReview";

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const equalsIndex = trimmed.indexOf('=');
        if (equalsIndex > 0) {
          const key = trimmed.substring(0, equalsIndex).trim();
          const value = trimmed.substring(equalsIndex + 1).trim();
          if (key && value) {
            process.env[key] = value;
          }
        }
      }
    }
    console.log('Loaded environment variables from .env.local');
  }
}

// Load environment variables before doing anything else
// loadEnvFile(); // Temporarily disabled to use deployment addresses

// Path to the Hardhat workspace root
const rel = "..";

// <root>/packages/site/components
const outdir = path.resolve("./abi");

if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir);
}

const dir = path.resolve(rel);
const dirname = path.basename(dir);

const line =
  "\n===================================================================\n";

if (!fs.existsSync(dir)) {
  console.error(
    `${line}Unable to locate ${rel}. Expecting <root>/packages/${dirname}${line}`
  );
  process.exit(1);
}

if (!fs.existsSync(outdir)) {
  console.error(`${line}Unable to locate ${outdir}.${line}`);
  process.exit(1);
}

const deploymentsDir = path.join(dir, "deployments");
// if (!fs.existsSync(deploymentsDir)) {
//   console.error(
//     `${line}Unable to locate 'deployments' directory.\n\n1. Goto '${dirname}' directory\n2. Run 'npx hardhat deploy --network ${chainName}'.${line}`
//   );
//   process.exit(1);
// }

function deployOnHardhatNode() {
  if (process.platform === "win32") {
    // Not supported on Windows
    return;
  }
  try {
    execSync(`./deploy-hardhat-node.sh`, {
      cwd: path.resolve("./scripts"),
      stdio: "inherit",
    });
  } catch (e) {
    console.error(`${line}Script execution failed: ${e}${line}`);
    process.exit(1);
  }
}

// Network configuration: chainName -> { chainId, chainName }
const NETWORK_CONFIG = {
  localhost: { chainId: 31337, chainName: "hardhat" },
  hardhat: { chainId: 31337, chainName: "hardhat" },
  anvil: { chainId: 31337, chainName: "hardhat" },
  sepolia: { chainId: 11155111, chainName: "sepolia" },
};

// Try to read contract address from environment variable
// Format: NEXT_PUBLIC_CONTRACT_ADDRESS_<CHAIN_ID>=0x...
function readAddressFromEnv(chainId) {
  const envKey = `NEXT_PUBLIC_CONTRACT_ADDRESS_${chainId}`;
  const address = process.env[envKey];
  if (address && /^0x[a-fA-F0-9]{40}$/.test(address)) {
    console.log(`Using contract address from environment for chain ${chainId}: ${address}`);
    return address;
  }
  return null;
}

function readDeployment(chainName, chainId, contractName, optional) {
  const chainDeploymentDir = path.join(deploymentsDir, chainName);

  // First, try to get address from environment variable (highest priority)
  const envAddress = readAddressFromEnv(chainId);
  if (envAddress) {
    // Try to get ABI from localhost deployment
    let abi = null;
    const localhostDeployment = path.join(deploymentsDir, "localhost", `${contractName}.json`);
    if (fs.existsSync(localhostDeployment)) {
      try {
        const localhostObj = JSON.parse(fs.readFileSync(localhostDeployment, "utf-8"));
        abi = localhostObj.abi;
      } catch (e) {
        console.warn(`Failed to read ABI from localhost deployment: ${e.message}`);
      }
    }
    console.log(`Using contract address from environment for chain ${chainId}: ${envAddress}`);
    return {
      address: envAddress,
      abi: abi || [],
      chainId: chainId,
    };
  }

  // Fallback to deployment file
  if (!fs.existsSync(chainDeploymentDir) && chainId === 31337) {
    // Try to auto-deploy the contract on hardhat node!
    deployOnHardhatNode();
  }

  let deployment = null;
  if (fs.existsSync(chainDeploymentDir)) {
    try {
      const jsonString = fs.readFileSync(
        path.join(chainDeploymentDir, `${contractName}.json`),
        "utf-8"
      );
      const obj = JSON.parse(jsonString);
      obj.chainId = chainId;
      deployment = obj;
      console.log(`Using contract address from deployment file for chain ${chainId}: ${obj.address}`);
    } catch (e) {
      console.warn(`Failed to read deployment from ${chainDeploymentDir}: ${e.message}`);
    }
  }

  if (!deployment) {
    if (!optional) {
      console.error(
        `${line}Unable to locate deployment for ${chainName} (chainId: ${chainId}).\n\nOptions:\n1. Run 'npx hardhat deploy --network ${chainName}'\n2. Set environment variable: NEXT_PUBLIC_CONTRACT_ADDRESS_${chainId}=0x...${line}`
      );
      process.exit(1);
    }
    return undefined;
  }

  return deployment;
}

// Auto-detect all deployed networks
function getAllDeployments() {
  const deployments = {};
  
  if (!fs.existsSync(deploymentsDir)) {
    return deployments;
  }

  const networkDirs = fs.readdirSync(deploymentsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const networkDir of networkDirs) {
    const contractFile = path.join(deploymentsDir, networkDir, `${CONTRACT_NAME}.json`);
    if (fs.existsSync(contractFile)) {
      try {
        const obj = JSON.parse(fs.readFileSync(contractFile, "utf-8"));
        // Try to find chainId from network config
        const config = NETWORK_CONFIG[networkDir];
        if (config) {
          obj.chainId = config.chainId;
          deployments[config.chainId] = {
            deployment: obj,
            chainName: config.chainName,
            networkDir: networkDir,
          };
}
      } catch (e) {
        console.warn(`Failed to read deployment from ${contractFile}: ${e.message}`);
      }
    }
  }

  return deployments;
}

// Get all deployments (auto-detected + configured networks)
const allDeployments = getAllDeployments();

// Ensure we have at least localhost deployment
const deployLocalhost = readDeployment("localhost", 31337, CONTRACT_NAME, false /* optional */);

// Get Sepolia deployment (optional)
let deploySepolia = allDeployments[11155111]?.deployment ||
  readDeployment("sepolia", 11155111, CONTRACT_NAME, true /* optional */);
if (!deploySepolia) {
  deploySepolia = { abi: deployLocalhost.abi, address: "0x0000000000000000000000000000000000000000" };
}

// Validate ABI consistency across networks
const allDeploymentsList = [deployLocalhost, deploySepolia].filter(Boolean);
if (allDeploymentsList.length > 1) {
  const firstABI = JSON.stringify(allDeploymentsList[0].abi);
  for (let i = 1; i < allDeploymentsList.length; i++) {
    if (JSON.stringify(allDeploymentsList[i].abi) !== firstABI) {
      console.warn(
        `${line}Warning: ABI differs across networks. This may cause issues.${line}`
      );
    }
  }
}


// Build addresses object dynamically from all deployments
const addressesEntries = [];
const knownNetworks = {
  31337: { chainName: "hardhat", deployment: deployLocalhost },
  11155111: { chainName: "sepolia", deployment: deploySepolia },
};

// Add all detected deployments
for (const [chainId, info] of Object.entries(allDeployments)) {
  if (!knownNetworks[chainId]) {
    knownNetworks[chainId] = {
      chainName: info.chainName,
      deployment: info.deployment,
    };
  }
}

// Generate addresses object
for (const [chainId, info] of Object.entries(knownNetworks)) {
  if (info.deployment && info.deployment.address) {
    addressesEntries.push(
      `  "${chainId}": { address: "${info.deployment.address}", chainId: ${chainId}, chainName: "${info.chainName}" }`
    );
  }
}

const tsCode = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
  To override contract addresses, set environment variables:
  - NEXT_PUBLIC_CONTRACT_ADDRESS_<CHAIN_ID>=0x...
*/
export const ${CONTRACT_NAME}ABI = ${JSON.stringify({ abi: deployLocalhost.abi }, null, 2)} as const;
\n`;
const tsAddresses = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
  To override contract addresses, set environment variables:
  - NEXT_PUBLIC_CONTRACT_ADDRESS_<CHAIN_ID>=0x...
*/
export const ${CONTRACT_NAME}Addresses = { 
${addressesEntries.join(",\n")}
};
`;

console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}ABI.ts`)}`);
console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}Addresses.ts`)}`);
console.log(tsAddresses);

fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}ABI.ts`), tsCode, "utf-8");
fs.writeFileSync(
  path.join(outdir, `${CONTRACT_NAME}Addresses.ts`),
  tsAddresses,
  "utf-8"
);
