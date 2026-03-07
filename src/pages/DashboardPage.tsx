import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle,
  Trash2,
  Upload,
  ImagePlus,
  Play,
  Tag,
  Layers,
} from 'lucide-react';
import { PDFUploader } from '../components/PDFUploader';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { useDocuments } from '../hooks/useDocuments';
import { DocumentWithAnalysis } from '../lib/types';

export function DashboardPage() {
  const navigate = useNavigate();
  const { documents, loading, createDocument, deleteDocument } = useDocuments();
  const [isUploading, setIsUploading] = useState(false);
  const [showUploader, setShowUploader] = useState(false);

  const handleFileSelect = async (file: File) => {
    setIsUploading(true);
    const doc = await createDocument(file);
    setIsUploading(false);
    setShowUploader(false);

    if (doc) {
      navigate(`/processing/${doc.id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      await deleteDocument(id);
    }
  };

  const handleAnalyze = (id: string) => {
    navigate(`/processing/${id}`);
  };

  // Group documents by status
  const pendingDocs = documents.filter(
    (d) => d.status === 'uploaded' || d.status === 'processing'
  );
  const analyzedDocs = documents.filter(
    (d) => d.status === 'analyzed' || d.status === 'verified' || d.status === 'exported'
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CoLearn PDF Explainer</h1>
              <p className="text-gray-600 text-sm mt-1">
                Analyze math, physics, and chemistry problems
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => navigate('/categories')}>
                <Tag size={16} className="mr-2" />
                Categories
              </Button>
              <Button variant="outline" onClick={() => navigate('/combiner')}>
                <Layers size={16} className="mr-2" />
                Combine JSON
              </Button>
              <Button variant="outline" onClick={() => navigate('/create-pdf')}>
                <ImagePlus size={16} className="mr-2" />
                Create PDF
              </Button>
              <Button onClick={() => setShowUploader(!showUploader)}>
                <Upload size={16} className="mr-2" />
                Upload PDF
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Upload Section */}
        {showUploader && (
          <div className="mb-8">
            <PDFUploader onFileSelect={handleFileSelect} isUploading={isUploading} />
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="text-blue-600" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {documents.length}
                  </p>
                  <p className="text-sm text-gray-500">Total Documents</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="text-yellow-600" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {pendingDocs.length}
                  </p>
                  <p className="text-sm text-gray-500">Pending Analysis</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="text-green-600" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {analyzedDocs.length}
                  </p>
                  <p className="text-sm text-gray-500">Analyzed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : documents.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <FileText className="mx-auto text-gray-300 mb-4" size={64} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No documents yet
              </h3>
              <p className="text-gray-500 mb-6">
                Upload a PDF or create one from images to get started
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate('/create-pdf')}>
                  <ImagePlus size={16} className="mr-2" />
                  Create from Images
                </Button>
                <Button onClick={() => setShowUploader(true)}>
                  <Upload size={16} className="mr-2" />
                  Upload PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Pending Analysis */}
            {pendingDocs.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Pending Analysis
                </h2>
                <div className="space-y-3">
                  {pendingDocs.map((doc) => (
                    <DocumentRow
                      key={doc.id}
                      document={doc}
                      onDelete={() => handleDelete(doc.id)}
                      onAnalyze={() => handleAnalyze(doc.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Analyzed Documents */}
            {analyzedDocs.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Analyzed Documents
                </h2>
                <div className="space-y-3">
                  {analyzedDocs.map((doc) => (
                    <DocumentRow
                      key={doc.id}
                      document={doc}
                      onDelete={() => handleDelete(doc.id)}
                      onView={() => navigate(`/verification/${doc.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

interface DocumentRowProps {
  document: DocumentWithAnalysis;
  onDelete: () => void;
  onAnalyze?: () => void;
  onView?: () => void;
}

function DocumentRow({ document, onDelete, onAnalyze, onView }: DocumentRowProps) {
  const getStatusBadge = () => {
    switch (document.status) {
      case 'uploaded':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
            Uploaded
          </span>
        );
      case 'processing':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
            Processing
          </span>
        );
      case 'analyzed':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
            Analyzed
          </span>
        );
      case 'verified':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            Verified
          </span>
        );
      case 'exported':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
            Exported
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-red-50 rounded-lg">
            <FileText className="text-red-600" size={24} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">
              {document.filename}
            </p>
            <p className="text-sm text-gray-500">
              {new Date(document.created_at).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          {getStatusBadge()}

          <div className="flex items-center gap-2">
            {document.status === 'uploaded' && onAnalyze && (
              <Button size="sm" onClick={onAnalyze}>
                <Play size={14} className="mr-1" />
                Analyze
              </Button>
            )}
            {(document.status === 'analyzed' ||
              document.status === 'verified' ||
              document.status === 'exported') &&
              onView && (
                <Button size="sm" variant="outline" onClick={onView}>
                  View
                </Button>
              )}
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 size={16} className="text-red-500" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
