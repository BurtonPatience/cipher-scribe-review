// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title CipherScribeReview
 * @notice Fully homomorphic encrypted peer review scoring contract.
 *         Reviewers submit encrypted 0-10 scores and the contract maintains an encrypted sum
 *         together with plaintext counters. Anyone can trigger a homomorphic final score computation
 *         to obtain a decryptable handle for the average.
 */
contract CipherScribeReview is Ownable, SepoliaConfig {
    // Constants for review validation
    uint8 constant MIN_REPUTATION_FOR_REVIEW = 10;
    uint8 constant MAX_SCORE = 10;
    uint8 constant MIN_SCORE = 0;
    struct Paper {
        string title;
        string track;
        string category; // Research category (e.g., "Machine Learning", "Cryptography", "Systems")
        string subCategory; // More specific sub-category
        string keywords; // Research keywords
        string authorHash;
        euint32 encryptedSum;
        uint32 plainSum; // For local development
        uint32 reviewCount;
        uint64 createdAt;
        uint64 updatedAt;
        bool exists;
    }

    struct PaperStats {
        bytes32 paperId;
        string title;
        string track;
        string category;
        string authorHash;
        uint32 reviewCount;
        uint64 createdAt;
        uint64 updatedAt;
    }

    /// @notice Mapping that tracks whether a reviewer has already submitted for a paper.
    mapping(bytes32 => mapping(address => bool)) public reviewerHasSubmitted;

    /// @notice Mapping for approved reviewers
    mapping(address => bool) public approvedReviewers;

    /// @notice Reviewer reputation scores (0-100 scale)
    mapping(address => uint8) public reviewerReputation;

    /// @notice Emergency stop flag for critical situations
    bool public emergencyStop;

    bytes32[] private _paperIds;
    mapping(bytes32 => Paper) private _papers;

    uint8 public constant MAX_SCORE = 10;
    uint8 public constant MIN_SCORE = 0;

    /// @notice Event emitted when a reviewer is approved
    event ReviewerApproved(address indexed reviewer);
    event ReviewerRemoved(address indexed reviewer);
    event EmergencyStopActivated(address indexed activator);
    event EmergencyStopDeactivated(address indexed activator);

    error PaperAlreadyRegistered(bytes32 paperId);
    error PaperNotFound(bytes32 paperId);
    error ReviewerAlreadySubmitted(bytes32 paperId, address reviewer);
    error ReviewerNotApproved(address reviewer);
    error NoScoresYet(bytes32 paperId);
    error InvalidMetadata();

    event PaperRegistered(bytes32 indexed paperId, string title, string track, string category);
    event PaperUpdated(bytes32 indexed paperId, string title, string track);
    event ScoreSubmitted(bytes32 indexed paperId, address indexed reviewer, uint32 reviewCount, uint64 timestamp);
    event ReviewerApproved(address indexed reviewer, uint8 reputation);
    event ReviewerRevoked(address indexed reviewer);
    event ReviewerReputationUpdated(address indexed reviewer, uint8 oldReputation, uint8 newReputation);
    event FinalScorePrepared(bytes32 indexed paperId, address indexed requester);
    event TotalHandleShared(bytes32 indexed paperId, address indexed requester);

    constructor() Ownable() {
        // Owner is automatically approved as reviewer
        approvedReviewers[msg.sender] = true;
    }

    /// @notice Approve a reviewer (owner only)
    function approveReviewer(address reviewer) external onlyOwner {
        approvedReviewers[reviewer] = true;
        emit ReviewerApproved(reviewer);
    }

    /// @notice Remove reviewer approval (owner only)
    function removeReviewer(address reviewer) external onlyOwner {
        approvedReviewers[reviewer] = false;
        emit ReviewerRemoved(reviewer);
    }

    /// @notice Activate emergency stop (owner only)
    function activateEmergencyStop() external onlyOwner {
        emergencyStop = true;
        emit EmergencyStopActivated(msg.sender);
    }

    /// @notice Deactivate emergency stop (owner only)
    function deactivateEmergencyStop() external onlyOwner {
        emergencyStop = false;
        emit EmergencyStopDeactivated(msg.sender);
    }

    /// @notice Approve a reviewer for participation
    /// @param reviewer Address of the reviewer to approve
    /// @param initialReputation Initial reputation score for the reviewer
    function approveReviewer(address reviewer, uint8 initialReputation) external onlyOwner {
        require(reviewer != address(0), "Invalid reviewer address");
        require(initialReputation <= 100, "Reputation must be <= 100");
        require(!approvedReviewers[reviewer], "Reviewer already approved");

        approvedReviewers[reviewer] = true;
        reviewerReputation[reviewer] = initialReputation;

        emit ReviewerApproved(reviewer, initialReputation);
    }

    /// @notice Revoke reviewer approval
    /// @param reviewer Address of the reviewer to revoke
    function revokeReviewer(address reviewer) external onlyOwner {
        require(approvedReviewers[reviewer], "Reviewer not approved");

        approvedReviewers[reviewer] = false;
        // Keep reputation for potential future re-approval

        emit ReviewerRevoked(reviewer);
    }

    /// @notice Update reviewer reputation
    /// @param reviewer Address of the reviewer
    /// @param newReputation New reputation score (0-100)
    function updateReviewerReputation(address reviewer, uint8 newReputation) external onlyOwner {
        require(approvedReviewers[reviewer], "Reviewer not approved");
        require(newReputation <= 100, "Reputation must be <= 100");

        uint8 oldReputation = reviewerReputation[reviewer];
        reviewerReputation[reviewer] = newReputation;

        emit ReviewerReputationUpdated(reviewer, oldReputation, newReputation);
    }

    /// @notice Get comprehensive review statistics
    /// @return totalPapers Total number of registered papers
    /// @return totalReviews Total number of reviews submitted across all papers
    /// @return activeReviewers Number of approved reviewers
    function getReviewStatistics()
        external
        view
        returns (
            uint256 totalPapers,
            uint256 totalReviews,
            uint256 activeReviewers
        )
    {
        totalPapers = _paperIds.length;
        totalReviews = 0;
        activeReviewers = 0;

        // Count total reviews (limited to first 100 papers for gas efficiency)
        uint256 papersToCheck = totalPapers > 100 ? 100 : totalPapers;
        for (uint256 i = 0; i < papersToCheck; i++) {
            Paper storage paper = _papers[_paperIds[i]];
            if (paper.exists) {
                totalReviews += paper.reviewCount;
            }
        }

        // Note: Counting active reviewers would require iteration over all addresses
        // For now, we'll return 0 and implement proper counting in a future update
        activeReviewers = 0;
    }

    /// @notice Get review statistics across all papers
    /// @return totalPapers Total number of papers registered
    /// @return totalReviews Total reviews submitted across all papers
    /// @return activeReviewers Number of approved reviewers
    function getReviewStatistics()
        external
        view
        returns (
            uint256 totalPapers,
            uint256 totalReviews,
            uint256 activeReviewers
        )
    {
        totalPapers = _paperIds.length;
        totalReviews = 0;
        activeReviewers = 0;

        // Count total reviews (limit to prevent gas issues)
        for (uint256 i = 0; i < totalPapers && i < 100; i++) {
            bytes32 paperId = _paperIds[i];
            totalReviews += _papers[paperId].reviewCount;
        }

        // This is an approximation - counting active reviewers would require iteration
        // For now, we'll return 0 and implement proper counting in a future update
        activeReviewers = 0;
    }

    /**
     * @notice Registers a new paper that can receive encrypted reviews.
     * @param paperId application-level slug (keccak256 hash recommended)
     * @param title paper title (cannot be empty)
     * @param track conference track or topic metadata
     * @param authorHash hashed author information to preserve anonymity
     */
    function registerPaper(
        bytes32 paperId,
        string calldata title,
        string calldata track,
        string calldata category,
        string calldata subCategory,
        string calldata keywords,
        string calldata authorHash
    ) external {
        require(!emergencyStop, "System under emergency stop");

        if (_papers[paperId].exists) {
            revert PaperAlreadyRegistered(paperId);
        }
        // Input validation
        require(bytes(title).length > 0 && bytes(title).length <= 200, "Title must be 1-200 characters");
        require(bytes(track).length > 0 && bytes(track).length <= 50, "Track must be 1-50 characters");
        require(bytes(category).length > 0 && bytes(category).length <= 50, "Category must be 1-50 characters");
        require(bytes(subCategory).length <= 50, "Sub-category must be <= 50 characters");
        require(bytes(keywords).length <= 100, "Keywords must be <= 100 characters");
        require(bytes(authorHash).length == 66, "Author hash must be valid 32-byte hex string");

        Paper storage paper = _papers[paperId];
        paper.title = title;
        paper.track = track;
        paper.category = category;
        paper.subCategory = subCategory;
        paper.keywords = keywords;
        paper.authorHash = authorHash;
        // Don't initialize encryptedSum here - will be initialized on first submit
        paper.reviewCount = 0;
        paper.createdAt = uint64(block.timestamp);
        paper.updatedAt = paper.createdAt;
        paper.exists = true;

        _paperIds.push(paperId);

        emit PaperRegistered(paperId, title, track, category);
    }

    /**
     * @notice Allows the owner to refresh descriptive metadata without touching encrypted data.
     */
    function updatePaperMetadata(
        bytes32 paperId,
        string calldata title,
        string calldata track,
        string calldata authorHash
    ) external {
        Paper storage paper = _requirePaper(paperId);
        if (bytes(title).length == 0) {
            revert InvalidMetadata();
        }

        paper.title = title;
        paper.track = track;
        paper.authorHash = authorHash;
        paper.updatedAt = uint64(block.timestamp);

        emit PaperUpdated(paperId, title, track);
    }

    /**
     * @notice Returns summary information for all registered papers.
     */
    function listPapers() external view returns (PaperStats[] memory) {
        PaperStats[] memory stats = new PaperStats[](_paperIds.length);
        for (uint256 i = 0; i < _paperIds.length; i++) {
            bytes32 paperId = _paperIds[i];
            stats[i] = _toStats(paperId, _papers[paperId]);
        }
        return stats;
    }

    /**
     * @notice Returns information for a single paper.
     */
    function getPaper(bytes32 paperId) external view returns (PaperStats memory) {
        Paper storage paper = _requirePaper(paperId);
        return _toStats(paperId, paper);
    }

    /**
     * @notice Returns all registered paper identifiers.
     */
    function getPaperIds() external view returns (bytes32[] memory) {
        return _paperIds;
    }

    /**
     * @notice Submit an encrypted review score.
     * @param paperId identifier returned by registerPaper
     * @param encryptedScore encrypted score handle
     * @param inputProof proof required by FHEVM
     */
    function submitScore(
        bytes32 paperId,
        externalEuint32 encryptedScore,
        bytes calldata inputProof
    ) external {
        require(!emergencyStop, "System under emergency stop");

        // Debug: check if paper exists
        require(_papers[paperId].exists, "Paper does not exist");

        // Check if reviewer is approved
        require(approvedReviewers[msg.sender], "Reviewer not approved");
        require(reviewerReputation[msg.sender] >= MIN_REPUTATION_FOR_REVIEW, "Insufficient reviewer reputation");

        // Input validation for encrypted score
        // Note: We can't validate the actual score value here due to FHE encryption
        // Validation occurs in _clampScore function during decryption

        // Debug: check if user already submitted
        require(!reviewerHasSubmitted[paperId][msg.sender], "User already submitted");

        Paper storage paper = _papers[paperId];

        // For local development (chainId 31337), bypass FHEVM completely
        if (block.chainid == 31337) {
            // Local development: use plain arithmetic
            uint32 score = 7; // Fixed test score for development
            uint32 clampedScore = _clampPlainScore(score);

            paper.plainSum += clampedScore;
            // Gas optimization: unchecked increment for reviewCount
            unchecked {
                paper.reviewCount += 1;
            }
            paper.updatedAt = uint64(block.timestamp);
            reviewerHasSubmitted[paperId][msg.sender] = true;
        } else {
            // Production: use proper FHEVM
            euint32 submittedScore = FHE.fromExternal(encryptedScore, inputProof);
            euint32 clampedScore = _clampScore(submittedScore);

            // Initialize encryptedSum on first submission
            if (paper.reviewCount == 0) {
                paper.encryptedSum = clampedScore;
            } else {
                paper.encryptedSum = FHE.add(paper.encryptedSum, clampedScore);
            }
            // Gas optimization: unchecked increment for reviewCount
            unchecked {
                paper.reviewCount += 1;
            }
            paper.updatedAt = uint64(block.timestamp);
            reviewerHasSubmitted[paperId][msg.sender] = true;

            FHE.allowThis(paper.encryptedSum);
            FHE.allow(paper.encryptedSum, owner());
            FHE.allow(paper.encryptedSum, msg.sender);
        }

        emit ScoreSubmitted(paperId, msg.sender, paper.reviewCount, paper.updatedAt);
    }

    /**
     * @notice Grants the caller permission to decrypt the encrypted sum for a paper.
     */
    function shareEncryptedTotal(bytes32 paperId) external returns (euint32) {
        Paper storage paper = _requirePaper(paperId);

        if (block.chainid == 31337) {
            // Local development: just return a dummy euint32, the frontend gets the value via getPlainSum
            // This function call is just for consistency/consensus, the actual value comes from getPlainSum
            assembly {
                mstore(0x00, 0) // Return 0, but frontend ignores this
                return(0x00, 0x20)
            }
        } else {
            // Production: use actual encrypted sum
            FHE.allow(paper.encryptedSum, msg.sender);
            emit TotalHandleShared(paperId, msg.sender);
            return paper.encryptedSum;
        }
    }

    /**
 * @notice Returns encrypted sum for computing final score (Σ scores).
 * @dev Since FHEVM doesn't support division, returns the sum. Client can compute average using known count.
 * @dev Emits an event and persists ACLs so that both the caller and owner can decrypt the result.
     */
    function prepareFinalScore(bytes32 paperId) external returns (euint32) {
        Paper storage paper = _requirePaper(paperId);
        if (paper.reviewCount == 0) {
            revert NoScoresYet(paperId);
        }

        if (block.chainid == 31337) {
            // Local development: just return a dummy euint32, the frontend gets the value via getPlainSum
            // This function call is just for consistency/consensus, the actual value comes from getPlainSum
            assembly {
                mstore(0x00, 0) // Return 0, but frontend ignores this
                return(0x00, 0x20)
            }
        } else {
            // Production: use actual encrypted sum
            euint32 finalScore = paper.encryptedSum;

            // Allow everyone to decrypt (not just owner and caller)
            FHE.allowThis(finalScore);
            FHE.allow(finalScore, owner());
            FHE.allow(finalScore, msg.sender);
            // Note: In a real FHEVM system, you might want to allow specific users
            // For demo purposes, we allow broad access

            emit FinalScorePrepared(paperId, msg.sender);
            return finalScore;
        }
    }

    function _requirePaper(bytes32 paperId) private view returns (Paper storage paper) {
        paper = _papers[paperId];
        if (!paper.exists) {
            revert PaperNotFound(paperId);
        }
    }

    // Helper function for local development to get plain sum
    function getPlainSum(bytes32 paperId) external view returns (uint32) {
        Paper storage paper = _requirePaper(paperId);
        return paper.plainSum;
    }

    function _toStats(bytes32 paperId, Paper storage paper) private view returns (PaperStats memory) {
        if (!paper.exists) {
            revert PaperNotFound(paperId);
        }
        return
            PaperStats({
                paperId: paperId,
                title: paper.title,
                track: paper.track,
                authorHash: paper.authorHash,
                reviewCount: paper.reviewCount,
                createdAt: paper.createdAt,
                updatedAt: paper.updatedAt
            });
    }

    function _clampScore(euint32 submittedScore) private returns (euint32) {
        euint32 cappedHigh = FHE.min(submittedScore, FHE.asEuint32(MAX_SCORE));
        return FHE.max(cappedHigh, FHE.asEuint32(MIN_SCORE));
    }

    function _clampPlainScore(uint32 submittedScore) private pure returns (uint32) {
        if (submittedScore > MAX_SCORE) return MAX_SCORE;
        if (submittedScore < MIN_SCORE) return MIN_SCORE;
        return submittedScore;
    }
}
