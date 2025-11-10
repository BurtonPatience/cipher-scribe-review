import { ethers } from "hardhat";
import { CipherScribeReview } from "../types/contracts/CipherScribeReview";

async function main() {
  console.log("🔍 Verifying Cipher Scribe deployment...\n");

  // Get deployed contract
  const contractAddress = process.env.CIPHER_SCRIBE_ADDRESS;
  if (!contractAddress) {
    throw new Error("CIPHER_SCRIBE_ADDRESS environment variable not set");
  }

  const cipherScribe = await ethers.getContractAt("CipherScribeReview", contractAddress) as CipherScribeReview;

  console.log(`📋 Contract Address: ${contractAddress}`);
  console.log(`🌐 Network: ${(await ethers.provider.getNetwork()).name}\n`);

  // Test basic functionality
  console.log("🧪 Testing basic contract functionality...\n");

  // Check owner
  const owner = await cipherScribe.owner();
  console.log(`👑 Owner Address: ${owner}`);

  // Check paper count
  const paperIds = await cipherScribe.getAllPaperIds();
  console.log(`📊 Total Papers: ${paperIds.length}`);

  // Test paper registration
  console.log("\n📝 Testing paper registration...");
  try {
    const paperId = ethers.keccak256(ethers.toUtf8Bytes("test-paper-" + Date.now()));
    const tx = await cipherScribe.registerPaper(
      paperId,
      "Test Paper for Deployment Verification",
      "Main Conference",
      "Machine Learning",
      ethers.keccak256(ethers.toUtf8Bytes("author@example.com"))
    );
    await tx.wait();
    console.log("✅ Paper registration successful");

    const updatedPaperIds = await cipherScribe.getAllPaperIds();
    console.log(`📊 New Paper Count: ${updatedPaperIds.length}`);
  } catch (error) {
    console.log(`❌ Paper registration failed: ${error}`);
  }

  // Test reviewer approval
  console.log("\n👥 Testing reviewer management...");
  try {
    const [signer] = await ethers.getSigners();
    const testReviewer = ethers.Wallet.createRandom().address;

    const tx = await cipherScribe.approveReviewer(testReviewer);
    await tx.wait();
    console.log("✅ Reviewer approval successful");

    const isApproved = await cipherScribe.approvedReviewers(testReviewer);
    console.log(`🔍 Reviewer approved status: ${isApproved}`);
  } catch (error) {
    console.log(`❌ Reviewer management failed: ${error}`);
  }

  console.log("\n🎉 Deployment verification completed!");
  console.log("\n📝 Next steps:");
  console.log("1. Update frontend with contract address");
  console.log("2. Test encrypted score submission");
  console.log("3. Verify FHE operations on target network");
  console.log("4. Set up reviewer approval workflow");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment verification failed:", error);
    process.exit(1);
  });
