import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, FileText } from 'lucide-react';
import { AnalysisEditor } from '../components/AnalysisEditor';
import { VerificationPanel } from '../components/VerificationPanel';
import { JSONExporter } from '../components/JSONExporter';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { useDocument } from '../hooks/useDocuments';
import { useAnalysis } from '../hooks/useAnalysis';
import { useCategories } from '../hooks/useCategories';
import { ExportedJSON, AnalysisResult } from '../lib/types';

export function VerificationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { document, loading: docLoading } = useDocument(id);
  const {
    analysis,
    loading: analysisLoading,
    fetchAnalysis,
    verifyAnalysis,
    updateAnalysis,
    uploadImage,
    approveAnalysis,
    rejectAnalysis,
    exportToJSON,
  } = useAnalysis(id);
  const { categories } = useCategories();

  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [exportData, setExportData] = useState<ExportedJSON | null>(null);

  useEffect(() => {
    if (id) {
      fetchAnalysis();
    }
  }, [id, fetchAnalysis]);

  useEffect(() => {
    // Generate export data when analysis is verified
    if (analysis && document && analysis.verification_status === 'verified') {
      const category = categories.find((c) => c.id === analysis.category_id);
      const data: ExportedJSON = {
        id: document.id,
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
        data.solution_image = analysis.solution_image;
      }
      setExportData(data);
    }
  }, [analysis, document, categories]);

  const handleVerify = async () => {
    setIsVerifying(true);
    await verifyAnalysis();
    setIsVerifying(false);
  };

  const handleSave = async (data: Partial<AnalysisResult>) => {
    setIsSaving(true);
    await updateAnalysis(data);
    setIsSaving(false);
  };

  const handleImageUpload = async (
    type: 'question' | 'solution',
    file: File
  ): Promise<string | null> => {
    return await uploadImage(type, file);
  };

  const handleApprove = async () => {
    await approveAnalysis();
  };

  const handleReject = async () => {
    const notes = prompt('Reason for rejection (optional):');
    await rejectAnalysis(notes || undefined);
  };

  const handleExport = async () => {
    if (!document || !analysis) return;
    const category = categories.find((c) => c.id === analysis.category_id);
    await exportToJSON(category || null);
  };

  if (docLoading || analysisLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
              <p className="text-gray-900 font-medium">Document not found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate('/')}
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Button variant="ghost" className="mb-6" onClick={() => navigate('/')}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Dashboard
          </Button>

          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-900 font-medium">No analysis found</p>
              <p className="text-gray-500 text-sm mt-2">
                This document hasn't been analyzed yet.
              </p>
              <Button
                className="mt-4"
                onClick={() => navigate(`/processing/${id}`)}
              >
                Start Analysis
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/')}>
          <ArrowLeft size={16} className="mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{document.filename}</h1>
          <p className="text-gray-500 text-sm mt-1">
            Created {new Date(document.created_at).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        <div className="space-y-6">
          {/* Analysis Editor */}
          <AnalysisEditor
            analysis={analysis}
            categories={categories}
            onSave={handleSave}
            onImageUpload={handleImageUpload}
            isSaving={isSaving}
          />

          {/* Verification Panel */}
          <VerificationPanel
            result={analysis.gemini_check}
            onVerify={handleVerify}
            onApprove={handleApprove}
            onReject={handleReject}
            isVerifying={isVerifying}
            verificationStatus={analysis.verification_status}
          />

          {/* JSON Export - Only show when verified */}
          {analysis.verification_status === 'verified' && exportData && (
            <JSONExporter data={exportData} onExport={handleExport} />
          )}

          {/* Show existing export if available */}
          {analysis.final_json && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="py-4">
                <p className="text-green-700 font-medium">
                  This analysis has been exported previously.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
