// Data export utilities for peer review application

import { PaperStats, ReviewStatistics } from '../fhevm/types';

export interface ExportOptions {
  format: 'json' | 'csv';
  includePrivateData: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * Export papers data in specified format
 */
export function exportPapersData(
  papers: PaperStats[],
  options: ExportOptions
): void {
  const { format, includePrivateData, dateRange } = options;

  // Filter by date range if specified
  let filteredPapers = papers;
  if (dateRange) {
    const startTime = dateRange.start.getTime() / 1000;
    const endTime = dateRange.end.getTime() / 1000;
    filteredPapers = papers.filter(
      paper => paper.createdAt >= startTime && paper.createdAt <= endTime
    );
  }

  // Remove sensitive data if not included
  const exportData = filteredPapers.map(paper => {
    const { authorHash, ...publicData } = paper;
    return includePrivateData ? paper : publicData;
  });

  if (format === 'json') {
    exportAsJSON(exportData, 'papers-data.json');
  } else if (format === 'csv') {
    exportAsCSV(exportData, 'papers-data.csv');
  }
}

/**
 * Export review statistics
 */
export function exportReviewStatistics(
  statistics: ReviewStatistics,
  options: ExportOptions
): void {
  const exportData = {
    ...statistics,
    exportDate: new Date().toISOString(),
    period: options.dateRange ? {
      start: options.dateRange.start.toISOString(),
      end: options.dateRange.end.toISOString()
    } : 'all-time'
  };

  if (options.format === 'json') {
    exportAsJSON(exportData, 'review-statistics.json');
  } else if (options.format === 'csv') {
    // Convert to CSV format
    const csvData = [
      ['Metric', 'Value'],
      ['Total Papers', statistics.totalPapers.toString()],
      ['Total Reviews', statistics.totalReviews.toString()],
      ['Active Reviewers', statistics.activeReviewers.toString()],
      ['Export Date', exportData.exportDate]
    ];
    exportAsCSV(csvData, 'review-statistics.csv');
  }
}

/**
 * Export reviewer performance data
 */
export function exportReviewerPerformance(
  reviewers: Array<{
    address: string;
    reputation: number;
    reviewCount: number;
    averageScore?: number;
  }>,
  options: ExportOptions
): void {
  const exportData = reviewers.map(reviewer => ({
    ...reviewer,
    // Anonymize addresses if private data not included
    address: options.includePrivateData
      ? reviewer.address
      : `${reviewer.address.slice(0, 6)}...${reviewer.address.slice(-4)}`
  }));

  if (options.format === 'json') {
    exportAsJSON(exportData, 'reviewer-performance.json');
  } else if (options.format === 'csv') {
    const csvData = [
      ['Address', 'Reputation', 'Review Count', 'Average Score'],
      ...exportData.map(r => [
        r.address,
        r.reputation.toString(),
        r.reviewCount.toString(),
        r.averageScore?.toString() || 'N/A'
      ])
    ];
    exportAsCSV(csvData, 'reviewer-performance.csv');
  }
}

/**
 * Export data as JSON file
 */
function exportAsJSON(data: any, filename: string): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  downloadBlob(blob, filename);
}

/**
 * Export data as CSV file
 */
function exportAsCSV(data: any[][], filename: string): void {
  const csvContent = data
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  downloadBlob(blob, filename);
}

/**
 * Download blob as file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate comprehensive report
 */
export function generateComprehensiveReport(
  papers: PaperStats[],
  statistics: ReviewStatistics,
  reviewers: Array<any>
): void {
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalPapers: statistics.totalPapers,
      totalReviews: statistics.totalReviews,
      averageReviewsPerPaper: statistics.totalPapers > 0
        ? (statistics.totalReviews / statistics.totalPapers).toFixed(2)
        : 0,
      activeReviewers: statistics.activeReviewers
    },
    papers: papers.map(paper => ({
      id: paper.paperId,
      title: paper.title,
      category: paper.category,
      reviewCount: paper.reviewCount,
      createdAt: new Date(paper.createdAt * 1000).toISOString()
    })),
    reviewers: reviewers.map(reviewer => ({
      address: `${reviewer.address.slice(0, 6)}...${reviewer.address.slice(-4)}`,
      reputation: reviewer.reputation,
      reviewCount: reviewer.reviewCount
    }))
  };

  exportAsJSON(report, `comprehensive-report-${new Date().toISOString().split('T')[0]}.json`);
}
