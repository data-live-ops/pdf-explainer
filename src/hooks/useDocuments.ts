import { useState, useEffect, useCallback } from 'react';
import { supabase, uploadPDF, STORAGE_BUCKET } from '../lib/supabase';
import { Document, DocumentWithAnalysis } from '../lib/types';

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentWithAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('documents')
      .select(`
        *,
        analysis_results (*)
      `)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setDocuments(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const createDocument = async (file: File): Promise<Document | null> => {
    // Upload file to storage
    const { path, error: uploadError } = await uploadPDF(file);
    if (uploadError) {
      setError(uploadError.message);
      return null;
    }

    // Create document record
    const { data, error: insertError } = await supabase
      .from('documents')
      .insert({
        filename: file.name,
        storage_path: path,
        status: 'uploaded',
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      return null;
    }

    await fetchDocuments();
    return data;
  };

  const updateDocumentStatus = async (
    id: string,
    status: Document['status']
  ): Promise<boolean> => {
    const { error: updateError } = await supabase
      .from('documents')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) {
      setError(updateError.message);
      return false;
    }

    await fetchDocuments();
    return true;
  };

  const deleteDocument = async (id: string): Promise<boolean> => {
    // Get document to find storage path
    const doc = documents.find((d) => d.id === id);
    if (doc) {
      // Delete from storage
      await supabase.storage.from(STORAGE_BUCKET).remove([doc.storage_path]);
    }

    // Delete document (cascade will delete analysis_results)
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (deleteError) {
      setError(deleteError.message);
      return false;
    }

    await fetchDocuments();
    return true;
  };

  return {
    documents,
    loading,
    error,
    createDocument,
    updateDocumentStatus,
    deleteDocument,
    refreshDocuments: fetchDocuments,
  };
}

export function useDocument(id: string | undefined) {
  const [document, setDocument] = useState<DocumentWithAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocument = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('documents')
      .select(`
        *,
        analysis_results (*)
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setDocument(data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  return {
    document,
    loading,
    error,
    refreshDocument: fetchDocument,
  };
}
