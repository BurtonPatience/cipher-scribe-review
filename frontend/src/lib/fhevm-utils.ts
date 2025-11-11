// Utility functions for FHEVM operations in peer review application

import { FHEEncryptedVote, PaperData, FHEOperationResult } from '../fhevm/types';

/**
 * Validate FHE encrypted data
 */
export function validateEncryptedData(data: FHEEncryptedVote): boolean {
  return (
    data &&
    Array.isArray(data.handles) &&
    data.handles.length > 0 &&
    typeof data.inputProof === 'string' &&
    data.inputProof.length > 0
  );
}

/**
 * Calculate time remaining for paper review deadline
 */
export function getTimeRemaining(deadline: number): {
  days: number;
  hours: number;
  minutes: number;
  isExpired: boolean;
} {
  const now = Math.floor(Date.now() / 1000);
  const remaining = deadline - now;

  if (remaining <= 0) {
    return { days: 0, hours: 0, minutes: 0, isExpired: true };
  }

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);

  return { days, hours, minutes, isExpired: false };
}

/**
 * Format paper data for display
 */
export function formatPaperForDisplay(paper: any): PaperData {
  return {
    id: paper.id || '',
    title: paper.title || '',
    track: paper.track || '',
    category: paper.category || 'General',
    authorHash: paper.authorHash || '',
    reviewCount: Number(paper.reviewCount || 0),
    createdAt: Number(paper.createdAt || 0),
    updatedAt: Number(paper.updatedAt || 0),
    exists: Boolean(paper.exists)
  };
}

/**
 * Generate mock FHE operation result for testing
 */
export function createMockFHEResult(
  success: boolean = true,
  executionTime: number = 150
): FHEOperationResult {
  return {
    success,
    encryptedData: success ? {
      handles: ['mock-handle-1', 'mock-handle-2'],
      inputProof: 'mock-proof-data'
    } : undefined,
    decryptedData: success ? Math.floor(Math.random() * 11) : undefined, // 0-10 score
    gasUsed: success ? BigInt(Math.floor(Math.random() * 100000) + 50000) : undefined,
    executionTime
  };
}

/**
 * Check if user can review a paper
 */
export function canReviewPaper(
  paper: PaperData,
  userAddress?: string,
  isApprovedReviewer?: boolean
): { canReview: boolean; reason?: string } {
  if (!paper.exists) {
    return { canReview: false, reason: 'Paper does not exist' };
  }

  if (!userAddress) {
    return { canReview: false, reason: 'User not connected' };
  }

  if (!isApprovedReviewer) {
    return { canReview: false, reason: 'Not an approved reviewer' };
  }

  // Additional checks can be added here (conflicts of interest, etc.)

  return { canReview: true };
}

/**
 * Calculate review participation percentage
 */
export function calculateParticipationRate(
  totalReviews: number,
  totalPossibleReviewers: number
): number {
  if (totalPossibleReviewers === 0) return 0;
  return Math.round((totalReviews / totalPossibleReviewers) * 100);
}

/**
 * Format gas usage for display
 */
export function formatGasUsage(gasUsed: bigint): string {
  const gas = Number(gasUsed);
  if (gas >= 1000000) {
    return `${(gas / 1000000).toFixed(2)}M gas`;
  } else if (gas >= 1000) {
    return `${(gas / 1000).toFixed(1)}K gas`;
  }
  return `${gas} gas`;
}

/**
 * Estimate gas cost in ETH (rough calculation)
 */
export function estimateGasCost(gasUsed: bigint, gasPrice: bigint = BigInt(20000000000)): string {
  const costWei = gasUsed * gasPrice;
  const costEth = Number(costWei) / 1e18;
  return `${costEth.toFixed(6)} ETH`;
}

/**
 * Generate paper ID from title and author
 */
export function generatePaperId(title: string, authorHash: string): string {
  const combined = title + authorHash + Date.now().toString();
  return btoa(combined).replace(/[^a-zA-Z0-9]/g, '').substr(0, 32);
}

/**
 * Validate paper submission data
 */
export function validatePaperSubmission(data: {
  title: string;
  track: string;
  category: string;
  authorHash: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.title || data.title.length < 10) {
    errors.push('Title must be at least 10 characters');
  }

  if (!data.track || data.track.length < 3) {
    errors.push('Track must be at least 3 characters');
  }

  if (!data.category) {
    errors.push('Category is required');
  }

  if (!data.authorHash || data.authorHash.length !== 66) {
    errors.push('Invalid author hash format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
