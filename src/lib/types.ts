export type DocumentStatus =
  | 'uploaded'
  | 'processing'
  | 'analyzed'
  | 'verified'
  | 'exported';

export type VerificationStatus =
  | 'pending'
  | 'verified'
  | 'rejected';

export interface Document {
  id: string;
  filename: string;
  storage_path: string;
  status: DocumentStatus;
  created_at: string;
  updated_at: string;
}

export interface GeminiCheckResult {
  typos: string[];
  errors: string[];
  suggestions: string[];
  isCorrect: boolean;
  confidence: number;
}

export interface AnalysisResult {
  id: string;
  document_id: string;
  diketahui: string;
  ditanya: string;
  jawaban: string;
  raw_response: Record<string, unknown>;
  verification_status: VerificationStatus;
  verification_notes: string | null;
  gemini_check: GeminiCheckResult | null;
  final_json: ExportedJSON | null;
  created_at: string;
  updated_at: string;
}

export interface ExportedJSON {
  id: string;
  filename: string;
  subject: string;
  analysis: {
    given: string;
    find: string;
    solution: string;
  };
  verification: {
    isVerified: boolean;
    checkedBy: string;
    confidence: number;
  };
  metadata: {
    createdAt: string;
    exportedAt: string;
  };
}

export interface DocumentWithAnalysis extends Document {
  analysis_results?: AnalysisResult[];
}

export interface AnalyzeResponse {
  success: boolean;
  data?: {
    diketahui: string;
    ditanya: string;
    jawaban: string;
  };
  error?: string;
}

export interface VerifyResponse {
  success: boolean;
  data?: GeminiCheckResult;
  error?: string;
}
