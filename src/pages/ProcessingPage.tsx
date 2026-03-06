import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { ProcessingView, useProcessingSteps } from '../components/ProcessingView';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { useDocument } from '../hooks/useDocuments';
import { useAnalysis } from '../hooks/useAnalysis';
import { supabase, getPublicUrl } from '../lib/supabase';
import { convertPDFToImages, dataUrlToBase64 } from '../lib/pdf-to-images';

type StepStatus = 'pending' | 'processing' | 'completed' | 'error';

export function ProcessingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { document, loading: docLoading } = useDocument(id);
  const { analyzeDocument } = useAnalysis(id);

  const initialSteps = useProcessingSteps();
  const [steps, setSteps] = useState(initialSteps);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const updateStep = useCallback((index: number, status: StepStatus, description?: string) => {
    setSteps((prev) =>
      prev.map((step, i) =>
        i === index
          ? { ...step, status, description: description || step.description }
          : step
      )
    );
    if (status === 'completed' && index < initialSteps.length - 1) {
      setCurrentStep(index + 1);
    }
  }, [initialSteps.length]);

  const startProcessing = useCallback(async () => {
    if (!document || isProcessing) return;

    // Check if already processed
    if (document.status !== 'uploaded') {
      navigate(`/verification/${id}`);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Step 1: Upload (already done, mark complete)
      updateStep(0, 'completed', 'File uploaded successfully');

      // Step 2: Convert PDF to images
      updateStep(1, 'processing', 'Converting PDF pages...');

      // Get PDF file from storage
      const publicUrl = await getPublicUrl(document.storage_path);
      const response = await fetch(publicUrl);
      const blob = await response.blob();
      const file = new File([blob], document.filename, { type: 'application/pdf' });

      const images = await convertPDFToImages(file);
      const base64Images = images.map((img) => dataUrlToBase64(img.dataUrl));

      updateStep(1, 'completed', `Converted ${images.length} page(s)`);

      // Update document status
      await supabase
        .from('documents')
        .update({ status: 'processing' })
        .eq('id', id);

      // Step 3: Analyze with Claude
      updateStep(2, 'processing', 'AI is analyzing the content...');

      const result = await analyzeDocument(base64Images);

      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      updateStep(2, 'completed', 'Analysis complete');

      // Step 4: Save results
      updateStep(3, 'processing', 'Saving results...');

      await supabase
        .from('documents')
        .update({ status: 'analyzed' })
        .eq('id', id);

      updateStep(3, 'completed', 'Results saved');

      // Navigate to verification page
      setTimeout(() => {
        navigate(`/verification/${id}`);
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      updateStep(currentStep, 'error', message);
    } finally {
      setIsProcessing(false);
    }
  }, [document, id, navigate, analyzeDocument, updateStep, isProcessing, currentStep]);

  useEffect(() => {
    if (document && !isProcessing && steps[0].status === 'pending') {
      startProcessing();
    }
  }, [document, isProcessing, steps, startProcessing]);

  if (docLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ProcessingView steps={steps} currentStepIndex={0} />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
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
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Home
        </Button>

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">{document.filename}</h1>
        </div>

        <ProcessingView steps={steps} currentStepIndex={currentStep} />

        {error && (
          <Card className="mt-6 border-red-200 bg-red-50">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                <div>
                  <p className="font-medium text-red-800">Processing Error</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSteps(initialSteps);
                    setCurrentStep(0);
                    setError(null);
                    startProcessing();
                  }}
                >
                  Retry
                </Button>
                <Button variant="ghost" onClick={() => navigate('/')}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
