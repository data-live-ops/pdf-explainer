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

export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface GeminiCheckResult {
  typos: string[];
  errors: string[];
  suggestions: string[];
  isCorrect: boolean;
  confidence: number;
}

// New analysis format
export interface AnalysisData {
  question_latex: string;
  question_description: string;
  solution_latex: {
    given: string;
    find: string;
    solution: string;
  };
  answer_latex: string[];
}

export interface AnalysisResult {
  id: string;
  document_id: string;
  // New fields
  question_latex: string;
  question_image?: string;
  question_description: string;
  category_id?: string;
  source_origin: string;
  solution_latex: {
    given: string;
    find: string;
    solution: string;
  };
  solution_image?: string;
  answer_latex: string[];
  // Legacy fields (for backwards compatibility)
  diketahui?: string;
  ditanya?: string;
  jawaban?: string;
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
  question_latex: string;
  question_image?: string;
  question_description: string;
  category: string;
  source_origin: string;
  solution_latex: {
    given: string;
    find: string;
    solution: string;
  };
  solution_image?: string;
  answer_latex: string[];
}

export interface DocumentWithAnalysis extends Document {
  analysis_results?: AnalysisResult[];
}

export interface AnalyzeResponse {
  success: boolean;
  data?: AnalysisData;
  error?: string;
}

export interface VerifyResponse {
  success: boolean;
  data?: GeminiCheckResult;
  error?: string;
}
