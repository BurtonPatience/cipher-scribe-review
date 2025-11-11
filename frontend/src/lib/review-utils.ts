// Utility functions for peer review application

import { PaperStats } from '../fhevm/types';

/**
 * Calculate average score from encrypted sum and review count
 * Note: This is a simplified calculation for display purposes
 */
export function calculateAverageScore(encryptedSum: number, reviewCount: number): number {
  if (reviewCount === 0) return 0;
  return Math.round((encryptedSum / reviewCount) * 100) / 100; // Round to 2 decimal places
}

/**
 * Format review count for display
 */
export function formatReviewCount(count: number): string {
  if (count === 0) return 'No reviews';
  if (count === 1) return '1 review';
  return `${count} reviews`;
}

/**
 * Get score distribution visualization data
 * Note: This is mock data since we can't access individual encrypted scores
 */
export function getScoreDistribution(reviewCount: number): Array<{score: number, count: number}> {
  if (reviewCount === 0) return [];

  // Mock distribution for visualization (in real app, this would be computed differently)
  const distribution = [];
  for (let score = 0; score <= 10; score++) {
    const count = Math.max(0, Math.floor(reviewCount * Math.random() * 0.3));
    if (count > 0) {
      distribution.push({ score, count });
    }
  }
  return distribution;
}

/**
 * Check if a paper has sufficient reviews for decision making
 */
export function hasSufficientReviews(reviewCount: number, minReviews: number = 3): boolean {
  return reviewCount >= minReviews;
}

/**
 * Get review status text
 */
export function getReviewStatus(reviewCount: number, minReviews: number = 3): string {
  if (reviewCount === 0) return 'Not reviewed';
  if (reviewCount < minReviews) return `Needs ${minReviews - reviewCount} more review${minReviews - reviewCount > 1 ? 's' : ''}`;
  return 'Sufficiently reviewed';
}

/**
 * Filter papers by category
 */
export function filterPapersByCategory(papers: PaperStats[], category: string): PaperStats[] {
  if (category === 'all') return papers;
  return papers.filter(paper => paper.category?.toLowerCase() === category.toLowerCase());
}

/**
 * Sort papers by different criteria
 */
export function sortPapers(papers: PaperStats[], sortBy: 'newest' | 'oldest' | 'most-reviewed' | 'least-reviewed'): PaperStats[] {
  const sorted = [...papers];

  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) => b.createdAt - a.createdAt);
    case 'oldest':
      return sorted.sort((a, b) => a.createdAt - b.createdAt);
    case 'most-reviewed':
      return sorted.sort((a, b) => b.reviewCount - a.reviewCount);
    case 'least-reviewed':
      return sorted.sort((a, b) => a.reviewCount - b.reviewCount);
    default:
      return sorted;
  }
}

/**
 * Get unique categories from papers
 */
export function getUniqueCategories(papers: PaperStats[]): string[] {
  const categories = new Set<string>();
  papers.forEach(paper => {
    if (paper.category) {
      categories.add(paper.category);
    }
  });
  return Array.from(categories).sort();
}

/**
 * Validate paper title
 */
export function validatePaperTitle(title: string): { isValid: boolean; error?: string } {
  if (!title.trim()) {
    return { isValid: false, error: 'Title is required' };
  }
  if (title.length < 10) {
    return { isValid: false, error: 'Title must be at least 10 characters' };
  }
  if (title.length > 200) {
    return { isValid: false, error: 'Title must be less than 200 characters' };
  }
  return { isValid: true };
}

/**
 * Validate review score
 */
export function validateReviewScore(score: number): { isValid: boolean; error?: string } {
  if (typeof score !== 'number' || isNaN(score)) {
    return { isValid: false, error: 'Score must be a number' };
  }
  if (score < 0 || score > 10) {
    return { isValid: false, error: 'Score must be between 0 and 10' };
  }
  return { isValid: true };
}
