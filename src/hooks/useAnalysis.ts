import { useState, useCallback } from 'react';
import { supabase, STORAGE_BUCKET } from '../lib/supabase';
import {
  AnalysisResult,
  AnalyzeResponse,
  VerifyResponse,
  ExportedJSON,
  Category,
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
            question_latex: analysis.question_latex,
            solution_latex: analysis.solution_latex,
            answer_latex: analysis.answer_latex,
            // Legacy fields for backwards compatibility
            diketahui: analysis.diketahui || analysis.solution_latex?.given,
            ditanya: analysis.ditanya || analysis.solution_latex?.find,
            jawaban: analysis.jawaban || analysis.solution_latex?.solution,
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
    updates: Partial<AnalysisResult>
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

  const uploadImage = async (
    type: 'question' | 'solution',
    file: File
  ): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${documentId}/${type}_${Date.now()}.${fileExt}`;
    const filePath = `images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file);

    if (uploadError) {
      setError(uploadError.message);
      return null;
    }

    const { data } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    return data.publicUrl;
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
    category: Category | null
  ): Promise<ExportedJSON | null> => {
    if (!analysis || !documentId) return null;

    const exportData: ExportedJSON = {
      id: documentId,
      question_latex: analysis.question_latex || '',
      question_image: analysis.question_image,
      question_description: analysis.question_description || '',
      category: category?.name || 'Uncategorized',
      source_origin: analysis.source_origin || 'Expert-Generated',
      solution_latex: analysis.solution_latex || { given: '', find: '', solution: '' },
      answer_latex: analysis.answer_latex || [],
    };

    // Only include solution_image if it has a value
    if (analysis.solution_image) {
      exportData.solution_image = analysis.solution_image;
    }

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
    uploadImage,
    approveAnalysis,
    rejectAnalysis,
    exportToJSON,
  };
}
