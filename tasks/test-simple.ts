import { task } from 'hardhat/config.js';

task("test-simple", "Test simple contract calls", async (taskArgs, hre) => {
  try {
    const ethers = hre.ethers;

    // Use Hardhat's built-in environment
    const signers = await hre.ethers.getSigners();
    const signer = signers[0];
    const provider = hre.ethers.provider;

    const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

    // Get contract instance
    const CipherScribeReview = await ethers.getContractFactory('CipherScribeReview');
    const contract = CipherScribeReview.attach(contractAddress).connect(signer);

    console.log('Testing simple contract calls...');

    // First check if contract exists
    const code = await provider.getCode(contractAddress);
    console.log('Contract code length:', code.length);
    if (code === '0x') {
      console.log('❌ No contract found at address');
      return;
    } else {
      console.log('✅ Contract found at address');
    }

    // Test 1: Get owner
    const owner = await contract.owner();
    console.log('✅ Owner:', owner);

    // Test 2: Register a test paper first
    console.log('📝 Registering test paper...');
    const testPaperId = 'test-paper-001';
    const paperIdBytes32 = ethers.keccak256(ethers.toUtf8Bytes(testPaperId));
    const tx = await contract.registerPaper(paperIdBytes32, "Test Paper for Development", "Testing", "test-author-hash");
    await tx.wait();
    console.log('✅ Test paper registered with ID:', testPaperId);

    // Test 2: Get constants
    const maxScore = await contract.MAX_SCORE();
    const minScore = await contract.MIN_SCORE();
    console.log('✅ Constants - MAX:', Number(maxScore), 'MIN:', Number(minScore));

    // Test 3: List papers
    const paperIds = await contract.getPaperIds();
    console.log('✅ Paper count:', paperIds.length);

    if (paperIds.length === 0) {
      console.log('No papers registered yet. Let\'s register one...');

      // Register a paper
      const paperId = ethers.keccak256(ethers.toUtf8Bytes("test-paper"));
      const tx = await contract.registerPaper(paperId, "Test Paper", "Testing", "test-author");
      await tx.wait();
      console.log('✅ Paper registered');
    }

    // Test 4: Try to submit a score with mock data
    const paperId = ethers.keccak256(ethers.toUtf8Bytes("test-paper"));

    // Mock FHEVM data - simplified
    const mockEncryptedScore = `0x${(5).toString(16).padStart(64, '0')}`; // Encrypted value 5
    const mockInputProof = `0x${'0'.repeat(64)}`; // Empty proof

    console.log('Attempting to submit score with mock data...');

    try {
      const tx = await contract.submitScore(paperId, mockEncryptedScore, mockInputProof);
      await tx.wait();
      console.log('✅ Score submitted successfully!');
    } catch (error) {
      console.log('❌ Submit failed:', error.message);

      // Try with different mock data
      console.log('Trying with different mock data...');
      const altMockScore = `0x${Buffer.from('encrypted_5').toString('hex').padEnd(64, '0')}`;
      const altMockProof = `0x${Buffer.from('proof_data').toString('hex').padEnd(64, '0')}`;

      try {
        const tx2 = await contract.submitScore(paperId, altMockScore, altMockProof);
        await tx2.wait();
        console.log('✅ Alternative mock data worked!');
      } catch (error2) {
        console.log('❌ Alternative also failed:', error2.message);
      }
    }

    // Test 5: Try to prepare final score and test decryption simulation
    console.log('Testing final score preparation and decryption simulation...');
    try {
      // Call prepareFinalScore (this should work in local mode)
      const handle = await contract.prepareFinalScore.staticCall(paperId);
      console.log('✅ prepareFinalScore static call succeeded, handle:', handle);

      // Execute the transaction
      const tx3 = await contract.prepareFinalScore(paperId);
      await tx3.wait();
      console.log('✅ prepareFinalScore transaction succeeded');

      // Simulate decryption (for local development)
      // In local mode, handle should be a mock encrypted value
      console.log('Simulating decryption for handle:', handle);
      // The handle in local mode is created by FHE.asEuint32(plainSum)
      // For testing, we assume it contains the plain value

    } catch (error3) {
      console.log('❌ prepareFinalScore failed:', error3.message);
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
});
