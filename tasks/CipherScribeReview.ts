import { task } from "hardhat/config.js";
import type { TaskArguments } from "hardhat/types.js";
import { FhevmType } from "@fhevm/hardhat-plugin";

const CONTRACT_NAME = "CipherScribeReview";

function resolvePaperId(taskArguments: TaskArguments, ethersLib: typeof import("ethers")): string {
  if (taskArguments.id) {
    return taskArguments.id;
  }
  if (taskArguments.slug) {
    return ethersLib.id(taskArguments.slug);
  }
  throw new Error("Provide either --slug or --id");
}

task("task:address", `Prints the ${CONTRACT_NAME} address`).setAction(async (_, hre) => {
  const deployment = await hre.deployments.get(CONTRACT_NAME);
  console.log(`${CONTRACT_NAME} address is ${deployment.address}`);
});

task("task:list-papers", "Lists registered papers and review counts")
  .addOptionalParam("address", "Custom contract address")
  .setAction(async (args, hre) => {
    const target =
      args.address !== undefined ? { address: args.address } : await hre.deployments.get(CONTRACT_NAME);
    const contract = await hre.ethers.getContractAt(CONTRACT_NAME, target.address);
    const papers = await contract.listPapers();
    if (!papers.length) {
      console.log("No papers registered yet.");
      return;
    }
    papers.forEach((paper: any, index: number) => {
      console.log(`\n#${index + 1}`);
      console.log(`  id          : ${paper.paperId}`);
      console.log(`  title       : ${paper.title}`);
      console.log(`  track       : ${paper.track}`);
      console.log(`  author hash : ${paper.authorHash}`);
      console.log(`  reviews     : ${paper.reviewCount}`);
      console.log(`  created     : ${new Date(Number(paper.createdAt) * 1000).toISOString()}`);
      console.log(`  updated     : ${new Date(Number(paper.updatedAt) * 1000).toISOString()}`);
    });
  });

task("task:register-paper", "Registers a paper (owner only)")
  .addParam("slug", "Unique slug used to derive the paper id")
  .addParam("title", "Paper title")
  .addOptionalParam("track", "Conference track metadata", "")
  .addOptionalParam("author", "Hashed author identifier", "")
  .addOptionalParam("address", "Custom contract address")
  .setAction(async (args, hre) => {
    const target =
      args.address !== undefined ? { address: args.address } : await hre.deployments.get(CONTRACT_NAME);
    const paperId = hre.ethers.id(args.slug);
    const contract = await hre.ethers.getContractAt(CONTRACT_NAME, target.address);
    const [signer] = await hre.ethers.getSigners();
    const tx = await contract
      .connect(signer)
      .registerPaper(paperId, args.title, args.track, args.author);
    console.log(`Registering paper ${args.title} (${paperId}) ... tx=${tx.hash}`);
    await tx.wait();
    console.log("Paper registered ✅");
  });

task("task:submit-score", "Encrypts and submits a review score")
  .addParam("score", "Score in [0,10]")
  .addOptionalParam("slug", "Slug used at registration")
  .addOptionalParam("id", "bytes32 paper id (overrides slug)")
  .addOptionalParam("address", "Custom contract address")
  .setAction(async (args, hre) => {
    const value = Number(args.score);
    if (!Number.isFinite(value)) {
      throw new Error("--score must be a number");
    }
    await hre.fhevm.initializeCLIApi();
    const target =
      args.address !== undefined ? { address: args.address } : await hre.deployments.get(CONTRACT_NAME);
    const paperId = resolvePaperId(args, hre.ethers);
    const contract = await hre.ethers.getContractAt(CONTRACT_NAME, target.address);
    const [signer] = await hre.ethers.getSigners();
    const encrypted = await hre.fhevm
      .createEncryptedInput(target.address, signer.address)
      .add32(value)
      .encrypt();
    const tx = await contract
      .connect(signer)
      .submitScore(paperId, encrypted.handles[0], encrypted.inputProof);
    console.log(`Submitting score=${value} for paper=${paperId} ... tx=${tx.hash}`);
    await tx.wait();
    console.log("Score submitted ✅");
  });

task("task:final-score", "Computes and decrypts the final score for a paper")
  .addOptionalParam("slug", "Slug used at registration")
  .addOptionalParam("id", "bytes32 paper id (overrides slug)")
  .addOptionalParam("address", "Custom contract address")
  .setAction(async (args, hre) => {
    await hre.fhevm.initializeCLIApi();
    const target =
      args.address !== undefined ? { address: args.address } : await hre.deployments.get(CONTRACT_NAME);
    const paperId = resolvePaperId(args, hre.ethers);
    const contract = await hre.ethers.getContractAt(CONTRACT_NAME, target.address);
    const [signer] = await hre.ethers.getSigners();

    const handle = await contract.connect(signer).prepareFinalScore.staticCall(paperId);
    const tx = await contract.connect(signer).prepareFinalScore(paperId);
    console.log(`prepareFinalScore tx=${tx.hash}...`);
    await tx.wait();

    const clearScore = await hre.fhevm.userDecryptEuint(
      FhevmType.euint32,
      handle,
      target.address,
      signer,
    );
    console.log(`Encrypted handle: ${handle}`);
    console.log(`Decrypted final score: ${Number(clearScore)}`);
  });

task("task:share-total", "Grants yourself access to the encrypted sum and decrypts it")
  .addOptionalParam("slug", "Slug used at registration")
  .addOptionalParam("id", "bytes32 paper id (overrides slug)")
  .addOptionalParam("address", "Custom contract address")
  .setAction(async (args, hre) => {
    await hre.fhevm.initializeCLIApi();
    const target =
      args.address !== undefined ? { address: args.address } : await hre.deployments.get(CONTRACT_NAME);
    const paperId = resolvePaperId(args, hre.ethers);
    const contract = await hre.ethers.getContractAt(CONTRACT_NAME, target.address);
    const [signer] = await hre.ethers.getSigners();
    const handle = await contract.connect(signer).shareEncryptedTotal.staticCall(paperId);
    const tx = await contract.connect(signer).shareEncryptedTotal(paperId);
    console.log(`shareEncryptedTotal tx=${tx.hash}...`);
    await tx.wait();

    const clearTotal = await hre.fhevm.userDecryptEuint(
      FhevmType.euint32,
      handle,
      target.address,
      signer,
    );
    console.log(`Encrypted sum handle: ${handle}`);
    console.log(`Decrypted sum: ${Number(clearTotal)}`);
  });
