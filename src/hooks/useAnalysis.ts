import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  AnalysisResult,
  AnalyzeResponse,
  VerifyResponse,
  GeminiCheckResult,
  ExportedJSON,
} from '../lib/types';

export function useAnalysis(documentId: string | undefined) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = useCallback(async () => {
    if (!documentId) return;

    const { data, error: fetchError } = await supabase
      .from('analysis_results')
      .select('*')
      .eq('document_id', documentId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      setError(fetchError.message);
      return;
    }

    setAnalysis(data);
  }, [documentId]);

  const analyzeDocument = async (
    imageBase64: string[]
  ): Promise<AnalyzeResponse> => {
    if (!documentId) {
      return { success: false, error: 'No document ID' };
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'analyze-pdf',
        {
          body: { documentId, images: imageBase64 },
        }
      );

      if (fnError) {
        throw fnError;
      }

      await fetchAnalysis();
      setLoading(false);
      return { success: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setError(message);
      setLoading(false);
      return { success: false, error: message };
    }
  };

  const verifyAnalysis = async (): Promise<VerifyResponse> => {
    if (!analysis) {
      return { success: false, error: 'No analysis to verify' };
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'verify-correctness',
        {
          body: {
            analysisId: analysis.id,
            diketahui: analysis.diketahui,
            ditanya: analysis.ditanya,
            jawaban: analysis.jawaban,
          },
        }
      );

      if (fnError) {
        throw fnError;
      }

      await fetchAnalysis();
      setLoading(false);
      return { success: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      setError(message);
      setLoading(false);
      return { success: false, error: message };
    }
  };

  const updateAnalysis = async (
    updates: Partial<Pick<AnalysisResult, 'diketahui' | 'ditanya' | 'jawaban'>>
  ): Promise<boolean> => {
    if (!analysis) return false;

    setLoading(true);
    const { error: updateError } = await supabase
      .from('analysis_results')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', analysis.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return false;
    }

    await fetchAnalysis();
    setLoading(false);
    return true;
  };

  const approveAnalysis = async (): Promise<boolean> => {
    if (!analysis) return false;

    setLoading(true);
    const { error: updateError } = await supabase
      .from('analysis_results')
      .update({
        verification_status: 'verified',
        updated_at: new Date().toISOString(),
      })
      .eq('id', analysis.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return false;
    }

    // Update document status
    await supabase
      .from('documents')
      .update({ status: 'verified', updated_at: new Date().toISOString() })
      .eq('id', documentId);

    await fetchAnalysis();
    setLoading(false);
    return true;
  };

  const rejectAnalysis = async (notes?: string): Promise<boolean> => {
    if (!analysis) return false;

    setLoading(true);
    const { error: updateError } = await supabase
      .from('analysis_results')
      .update({
        verification_status: 'rejected',
        verification_notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', analysis.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return false;
    }

    await fetchAnalysis();
    setLoading(false);
    return true;
  };

  const exportToJSON = async (
    filename: string,
    geminiCheck: GeminiCheckResult | null
  ): Promise<ExportedJSON | null> => {
    if (!analysis || !documentId) return null;

    const exportData: ExportedJSON = {
      id: documentId,
      filename,
      subject: detectSubject(analysis),
      analysis: {
        given: analysis.diketahui,
        find: analysis.ditanya,
        solution: analysis.jawaban,
      },
      verification: {
        isVerified: analysis.verification_status === 'verified',
        checkedBy: 'gemini',
        confidence: geminiCheck?.confidence || 0,
      },
      metadata: {
        createdAt: analysis.created_at,
        exportedAt: new Date().toISOString(),
      },
    };

    // Save to database
    setLoading(true);
    const { error: updateError } = await supabase
      .from('analysis_results')
      .update({
        final_json: exportData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', analysis.id);

    // Update document status
    await supabase
      .from('documents')
      .update({ status: 'exported', updated_at: new Date().toISOString() })
      .eq('id', documentId);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return null;
    }

    await fetchAnalysis();
    setLoading(false);
    return exportData;
  };

  return {
    analysis,
    loading,
    error,
    fetchAnalysis,
    analyzeDocument,
    verifyAnalysis,
    updateAnalysis,
    approveAnalysis,
    rejectAnalysis,
    exportToJSON,
  };
}

function detectSubject(analysis: AnalysisResult): string {
  const content =
    `${analysis.diketahui} ${analysis.ditanya} ${analysis.jawaban}`.toLowerCase();

  if (
    content.includes('equation') ||
    content.includes('integral') ||
    content.includes('derivative') ||
    content.includes('limit') ||
    content.includes('x^2') ||
    content.includes('\\frac') ||
    content.includes('algebra') ||
    content.includes('calculus')
  ) {
    return 'mathematics';
  }

  if (
    content.includes('force') ||
    content.includes('mass') ||
    content.includes('velocity') ||
    content.includes('energy') ||
    content.includes('newton') ||
    content.includes('joule') ||
    content.includes('acceleration') ||
    content.includes('momentum')
  ) {
    return 'physics';
  }

  if (
    content.includes('mol') ||
    content.includes('reaction') ||
    content.includes('solution') ||
    content.includes('atom') ||
    content.includes('molecule') ||
    content.includes('chemical') ||
    content.includes('element') ||
    content.includes('compound')
  ) {
    return 'chemistry';
  }

  return 'unknown';
}
