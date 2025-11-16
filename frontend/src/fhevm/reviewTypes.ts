// Enhanced FHEVM types for peer review application

export interface FHEEncryptedReview {
  handles: string[];
  inputProof: string;
}

export interface PaperData {
  id: string;
  title: string;
  track: string;
  category: string;
  subCategory: string;
  keywords: string;
  authorHash: string;
  reviewCount: number;
  createdAt: number;
  updatedAt: number;
  exists: boolean;
}

export interface ReviewStatistics {
  totalPapers: number;
  totalReviews: number;
  activeReviewers: number;
}

export interface ReviewerProfile {
  address: string;
  reputation: number;
  isApproved: boolean;
  totalReviews: number;
}

export interface FHEReviewError extends Error {
  code?: number;
  reason?: string;
  fheError?: boolean;
}

export interface ReviewSubmissionResult {
  success: boolean;
  txHash?: string;
  paperId?: string;
  gasUsed?: bigint;
  error?: string;
}

export interface PaperSubmissionData {
  title: string;
  track: string;
  category: string;
  subCategory: string;
  keywords: string;
  authorHash: string;
}

// Application state types
export interface AppConfig {
  contractAddress: string;
  walletConnectProjectId: string;
  supportedChains: number[];
  fhevmEnabled: boolean;
}

export interface UIState {
  isLoading: boolean;
  isConnected: boolean;
  currentPaper: PaperData | null;
  reviewerProfile: ReviewerProfile;
}

// Form validation types
export interface PaperFormData {
  title: string;
  track: string;
  category: string;
  subCategory: string;
  keywords: string;
  authorHash: string;
}

export interface PaperValidation {
  isValid: boolean;
  errors: {
    title?: string;
    track?: string;
    category?: string;
    subCategory?: string;
    keywords?: string;
    authorHash?: string;
  };
}

// API response types
export interface ContractCallResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  gasEstimate?: bigint;
}

export interface FHEOperationResult {
  success: boolean;
  encryptedData?: FHEEncryptedReview;
  decryptedData?: number;
  gasUsed?: bigint;
  executionTime: number;
}

// Review workflow types
export interface ReviewWorkflowStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

export interface ReviewProcess {
  paperId: string;
  currentStep: number;
  steps: ReviewWorkflowStep[];
  canSubmit: boolean;
  estimatedGas: bigint;
}