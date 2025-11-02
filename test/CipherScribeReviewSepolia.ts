import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, deployments, fhevm } from "hardhat";

import { CipherScribeReview } from "../types";

describe("CipherScribeReviewSepolia", function () {
  let signer: HardhatEthersSigner;
  let contract: CipherScribeReview;

  before(async function () {
    if (fhevm.isMock) {
      this.skip();
    }

    const deployment = await deployments.get("CipherScribeReview");
    contract = await ethers.getContractAt("CipherScribeReview", deployment.address);
    [signer] = await ethers.getSigners();
  });

  it("fetches paper metadata on Sepolia", async function () {
    this.timeout(60_000);
    const papers = await contract.listPapers();
    expect(papers).to.be.an("array");
    console.log(`Found ${papers.length} papers on Sepolia.`);
    if (papers.length > 0) {
      console.log(`First paper title: ${papers[0].title}`);
    }
  });
});
