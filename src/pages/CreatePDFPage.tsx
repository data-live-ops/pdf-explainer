import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, CheckCircle } from 'lucide-react';
import { ImageToPDFConverter } from '../components/ImageToPDFConverter';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { useDocuments } from '../hooks/useDocuments';

export function CreatePDFPage() {
  const navigate = useNavigate();
  const { createDocument } = useDocuments();
  const [isConverting, setIsConverting] = useState(false);
  const [createdPDF, setCreatedPDF] = useState<{
    blob: Blob;
    filename: string;
  } | null>(null);
  const [uploadedDocId, setUploadedDocId] = useState<string | null>(null);

  const handlePDFCreated = (pdfBlob: Blob, filename: string) => {
    setCreatedPDF({ blob: pdfBlob, filename });
  };

  const handleDownload = () => {
    if (!createdPDF) return;

    const url = URL.createObjectURL(createdPDF.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = createdPDF.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUploadAndAnalyze = async () => {
    if (!createdPDF) return;

    setIsConverting(true);
    const file = new File([createdPDF.blob], createdPDF.filename, {
      type: 'application/pdf',
    });

    const doc = await createDocument(file);
    setIsConverting(false);

    if (doc) {
      setUploadedDocId(doc.id);
    }
  };

  const handleStartAnalysis = () => {
    if (uploadedDocId) {
      navigate(`/processing/${uploadedDocId}`);
    }
  };

  const handleReset = () => {
    setCreatedPDF(null);
    setUploadedDocId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/')}>
          <ArrowLeft size={16} className="mr-2" />
          Back to Dashboard
        </Button>

        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create PDF from Images</h1>
          <p className="text-gray-600 mt-1">
            Upload multiple images and convert them into a single PDF document
          </p>
        </header>

        {!createdPDF ? (
          <ImageToPDFConverter
            onPDFCreated={handlePDFCreated}
            isConverting={isConverting}
          />
        ) : !uploadedDocId ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                  <CheckCircle className="text-green-600" size={32} />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  PDF Created Successfully!
                </h2>
                <p className="text-gray-600 mb-6">
                  {createdPDF.filename}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button variant="outline" onClick={handleDownload}>
                    Download PDF
                  </Button>
                  <Button onClick={handleUploadAndAnalyze} isLoading={isConverting}>
                    <Upload size={16} className="mr-2" />
                    Upload & Analyze
                  </Button>
                </div>
                <button
                  onClick={handleReset}
                  className="mt-4 text-sm text-gray-500 hover:text-gray-700"
                >
                  Create another PDF
                </button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                  <Upload className="text-blue-600" size={32} />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  PDF Uploaded!
                </h2>
                <p className="text-gray-600 mb-6">
                  Your PDF is ready for analysis
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button variant="outline" onClick={() => navigate('/')}>
                    Go to Dashboard
                  </Button>
                  <Button onClick={handleStartAnalysis}>
                    Start Analysis
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
