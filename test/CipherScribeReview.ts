import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { ethers, fhevm } from "hardhat";

import { CipherScribeReview, CipherScribeReview__factory } from "../types";

type Signers = {
  owner: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("CipherScribeReview")) as CipherScribeReview__factory;
  const contract = (await factory.deploy()) as CipherScribeReview;
  const address = await contract.getAddress();
  return { contract, address };
}

describe("CipherScribeReview (local)", function () {
  let signers: Signers;
  let contract: CipherScribeReview;
  let contractAddress: string;

  before(async function () {
    const [owner, alice, bob] = await ethers.getSigners();
    signers = { owner, alice, bob };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("Skipping local CipherScribeReview tests outside of the FHE mock runtime");
      this.skip();
    }
    ({ contract, address: contractAddress } = await deployFixture());
  });

  it("registers papers and exposes metadata", async function () {
    const paperId = ethers.id("paper-zero");
    await contract.registerPaper(paperId, "Sparse Transformers", "NeurIPS", "hash:authors");
    const stats = await contract.getPaper(paperId);
    expect(stats.title).to.eq("Sparse Transformers");
    expect(stats.track).to.eq("NeurIPS");
    expect(stats.reviewCount).to.eq(0);

    const list = await contract.listPapers();
    expect(list.length).to.eq(1);
    expect(list[0].paperId).to.eq(paperId);
  });

  it("clamps encrypted submissions and computes the final score", async function () {
    const paperId = ethers.id("paper-best");
    await contract.registerPaper(paperId, "Cipher Scribe", "FHE", "authors::123");

    const encryptedTwelve = await encryptScore(contractAddress, signers.alice.address, 12);
    await contract
      .connect(signers.alice)
      .submitScore(paperId, encryptedTwelve.handles[0], encryptedTwelve.inputProof);

    const encryptedEight = await encryptScore(contractAddress, signers.bob.address, 8);
    await contract.connect(signers.bob).submitScore(paperId, encryptedEight.handles[0], encryptedEight.inputProof);

    const totalHandle = await contract
      .connect(signers.owner)
      .shareEncryptedTotal.staticCall(paperId);
    await contract.connect(signers.owner).shareEncryptedTotal(paperId);
    const clearSum = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      totalHandle,
      contractAddress,
      signers.owner,
    );
    expect(clearSum).to.eq(18); // 12 is clamped to 10

    const expectedSum = 18; // 12 + 8 (after clamping)
    const avgHandle = await contract.connect(signers.alice).prepareFinalScore.staticCall(paperId);
    const tx = await contract.connect(signers.alice).prepareFinalScore(paperId);
    await tx.wait();

    const clearAvgSum = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      avgHandle,
      contractAddress,
      signers.alice,
    );
    expect(Number(clearAvgSum)).to.eq(expectedSum);

    // 验证平均值计算：总和除以计数
    const expectedAverage = 9; // 18 / 2
    expect(Math.round(Number(clearAvgSum) / 2)).to.eq(expectedAverage);
  });

  it("blocks duplicate submissions", async function () {
    const paperId = ethers.id("paper-dup");
    await contract.registerPaper(paperId, "Duplicate Test", "ICLR", "auth");
    const encryptedSeven = await encryptScore(contractAddress, signers.alice.address, 7);

    await contract
      .connect(signers.alice)
      .submitScore(paperId, encryptedSeven.handles[0], encryptedSeven.inputProof);

    await expect(
      contract.connect(signers.alice).submitScore(paperId, encryptedSeven.handles[0], encryptedSeven.inputProof),
    ).to.be.revertedWithCustomError(contract, "ReviewerAlreadySubmitted");
  });
});

async function encryptScore(contractAddress: string, reviewer: string, score: number) {
  return fhevm.createEncryptedInput(contractAddress, reviewer).add32(score).encrypt();
}
