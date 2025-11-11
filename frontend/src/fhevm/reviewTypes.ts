// Enhanced types for peer review application

export interface ReviewScore {
  encryptedValue: string;
  inputProof: string;
  timestamp: number;
}

export interface PaperSubmission {
  paperId: string;
  title: string;
  track: string;
  category: string;
  authorHash: string;
}

export interface ReviewerProfile {
  address: string;
  isApproved: boolean;
  reviewCount: number;
  averageScore: number;
  lastReviewDate: number;
}

export interface ReviewStatistics {
  totalPapers: number;
  totalReviews: number;
  activeReviewers: number;
  averageReviewsPerPaper: number;
  completionRate: number;
}

export interface FHEOperationResult {
  success: boolean;
  encryptedData?: ReviewScore;
  decryptedData?: number;
  gasUsed?: bigint;
  executionTime: number;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ContractInteractionState {
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  transactionHash?: string;
  gasEstimate?: bigint;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Form validation types
export interface PaperFormData {
  title: string;
  track: string;
  category: string;
  authorHash: string;
}

export interface ScoreFormData {
  paperId: string;
  score: number;
  comment?: string;
}

// UI state types
export interface UiState {
  selectedPaper: PaperSubmission | null;
  reviewFilter: 'all' | 'my-reviews' | 'pending' | 'completed';
  sortOrder: 'newest' | 'oldest' | 'most-reviewed' | 'least-reviewed';
  categoryFilter: string;
  searchQuery: string;
}

// Event types
export interface ReviewEvent {
  type: 'paper-submitted' | 'score-submitted' | 'reviewer-approved' | 'emergency-stop';
  paperId?: string;
  reviewer?: string;
  timestamp: number;
  transactionHash: string;
}

// Configuration types
export interface AppConfig {
  contractAddress: string;
  supportedChains: number[];
  minReviewers: number;
  maxScore: number;
  reviewDeadlineDays: number;
  fheSecurityBits: number;
}
