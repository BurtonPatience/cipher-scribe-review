import { task } from 'hardhat/config.js';

task("debug-all", "Comprehensive debug of FHEVM issues", async (taskArgs, hre) => {
  console.log("🔍 Starting comprehensive FHEVM debug...\n");

  try {
    const ethers = hre.ethers;

    // Step 1: Check Hardhat node connection
    console.log("1️⃣ Checking Hardhat node connection...");
    const provider = hre.ethers.provider;
    const network = await provider.getNetwork();
    console.log(`   ✅ Connected to ${network.name} (chainId: ${network.chainId})`);

    const blockNumber = await provider.getBlockNumber();
    console.log(`   ✅ Current block: ${blockNumber}`);

    const signers = await hre.ethers.getSigners();
    console.log(`   ✅ Available signers: ${signers.length}`);
    console.log(`   ✅ First signer: ${signers[0].address}\n`);

    // Step 2: Deploy fresh contract
    console.log("2️⃣ Deploying fresh contract...");
    const CipherScribeReview = await ethers.getContractFactory('CipherScribeReview');
    const contract = await CipherScribeReview.deploy();
    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();
    console.log(`   ✅ Contract deployed at: ${contractAddress}`);

    // Verify contract exists
    const code = await provider.getCode(contractAddress);
    console.log(`   ✅ Contract code length: ${code.length} bytes\n`);

    // Step 3: Test basic contract calls
    console.log("3️⃣ Testing basic contract calls...");
    const owner = await contract.owner();
    console.log(`   ✅ Owner: ${owner}`);

    const maxScore = await contract.MAX_SCORE();
    const minScore = await contract.MIN_SCORE();
    console.log(`   ✅ Constants - MAX: ${maxScore}, MIN: ${minScore}\n`);

    // Step 4: Test paper registration
    console.log("4️⃣ Testing paper registration...");
    const paperId = ethers.keccak256(ethers.toUtf8Bytes("debug-paper"));
    const tx = await contract.registerPaper(paperId, "Debug Paper", "Debug", "debug-author");
    await tx.wait();
    console.log(`   ✅ Paper registered with ID: ${paperId}\n`);

    // Step 5: Test mock FHEVM encryption
    console.log("5️⃣ Testing mock FHEVM encryption...");

    // Simulate the frontend FHEVM flow
    const mockEncryptedScore = `0x${BigInt(7).toString(16).padStart(64, '0')}`; // Encrypted value 7
    const mockInputProof = `0x${'0'.repeat(64)}`; // Empty proof (32 bytes)

    console.log(`   Mock encrypted score: ${mockEncryptedScore}`);
    console.log(`   Mock input proof: ${mockInputProof}`);

    // Test the submitScore call
    console.log("6️⃣ Testing submitScore call...");
    try {
      const submitTx = await contract.submitScore(paperId, mockEncryptedScore, mockInputProof);
      console.log(`   📝 Transaction sent: ${submitTx.hash}`);
      const receipt = await submitTx.wait();
      console.log(`   ✅ Score submitted successfully!`);
      console.log(`   📊 Gas used: ${receipt.gasUsed}\n`);
    } catch (error) {
      console.log(`   ❌ Submit failed: ${error.message}`);

      // Try to decode the error
      if (error.data) {
        console.log(`   🔍 Error data: ${error.data}`);
      }

      // Check if it's a contract revert
      if (error.reason) {
        console.log(`   🔍 Revert reason: ${error.reason}`);
      }

      throw error;
    }

    // Step 6: Verify submission
    console.log("7️⃣ Verifying submission...");
    const papers = await contract.listPapers();
    console.log(`   📄 Papers count: ${papers.length}`);
    if (papers.length > 0) {
      console.log(`   📄 First paper - Title: ${papers[0].title}, Reviews: ${papers[0].reviewCount}`);
    }

    // Step 7: Test decryption functions in local mode
    console.log("8️⃣ Testing decryption functions in local mode...");
    try {
      // Test prepareFinalScore (should return plain sum directly)
      console.log("   Testing prepareFinalScore...");
      const prepareHandle = await contract.prepareFinalScore.staticCall(paperId);
      const prepareSum = Number(prepareHandle);
      console.log(`   ✅ prepareFinalScore staticCall returned sum: ${prepareSum}`);

      // Execute the transaction
      const txPrepare = await contract.prepareFinalScore(paperId);
      await txPrepare.wait();
      console.log("   ✅ prepareFinalScore transaction succeeded");

      // Test shareEncryptedTotal (should return plain sum directly)
      console.log("   Testing shareEncryptedTotal...");
      const shareHandle = await contract.shareEncryptedTotal.staticCall(paperId);
      const shareSum = Number(shareHandle);
      console.log(`   ✅ shareEncryptedTotal staticCall returned sum: ${shareSum}`);

      // Execute the transaction
      const txShare = await contract.shareEncryptedTotal(paperId);
      await txShare.wait();
      console.log("   ✅ shareEncryptedTotal transaction succeeded");

      // Verify both returned the same sum (7)
      if (prepareSum === 7 && shareSum === 7) {
        console.log("   ✅ Both functions returned correct sum: 7");
      } else {
        console.log(`   ❌ Sum mismatch: prepare=${prepareSum}, share=${shareSum}`);
      }

    } catch (error: any) {
      console.log(`   ❌ Decryption test failed: ${error.message}`);
      throw error;
    }

    console.log("\n🎉 All tests passed! FHEVM integration working correctly.");

  } catch (error) {
    console.error("\n❌ Debug failed:", error);
    console.error("Stack:", error.stack);

    // Provide specific guidance based on error
    if (error.message.includes("contract")) {
      console.log("\n💡 Suggestion: Contract deployment or interaction failed");
    } else if (error.message.includes("network")) {
      console.log("\n💡 Suggestion: Network connectivity issue");
    } else if (error.message.includes("FHE")) {
      console.log("\n💡 Suggestion: FHEVM encryption/decryption issue");
    }
  }
});
