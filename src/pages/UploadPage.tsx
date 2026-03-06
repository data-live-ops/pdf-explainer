import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, CheckCircle, Download, Trash2 } from 'lucide-react';
import { PDFUploader } from '../components/PDFUploader';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { useDocuments } from '../hooks/useDocuments';
import { DocumentWithAnalysis } from '../lib/types';

export function UploadPage() {
  const navigate = useNavigate();
  const { documents, loading, createDocument, deleteDocument } = useDocuments();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (file: File) => {
    setIsUploading(true);
    const doc = await createDocument(file);
    setIsUploading(false);

    if (doc) {
      navigate(`/processing/${doc.id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      await deleteDocument(id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">PDF Explainer</h1>
          <p className="text-gray-600 mt-2">
            Convert math, physics, and chemistry problems into structured explanations
          </p>
        </header>

        <PDFUploader onFileSelect={handleFileSelect} isUploading={isUploading} />

        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Documents
          </h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : documents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500">No documents yet. Upload a PDF to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onDelete={() => handleDelete(doc.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface DocumentCardProps {
  document: DocumentWithAnalysis;
  onDelete: () => void;
}

function DocumentCard({ document, onDelete }: DocumentCardProps) {
  const navigate = useNavigate();

  const getStatusIcon = () => {
    switch (document.status) {
      case 'verified':
      case 'exported':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'processing':
      case 'analyzed':
        return <Clock className="text-blue-600" size={20} />;
      default:
        return <FileText className="text-gray-400" size={20} />;
    }
  };

  const getStatusText = () => {
    switch (document.status) {
      case 'uploaded':
        return 'Uploaded';
      case 'processing':
        return 'Processing';
      case 'analyzed':
        return 'Analyzed';
      case 'verified':
        return 'Verified';
      case 'exported':
        return 'Exported';
      default:
        return document.status;
    }
  };

  const handleClick = () => {
    if (document.status === 'uploaded') {
      navigate(`/processing/${document.id}`);
    } else {
      navigate(`/verification/${document.id}`);
    }
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <FileText className="text-red-600" size={24} />
            </div>
            <div>
              <p className="font-medium text-gray-900">{document.filename}</p>
              <p className="text-sm text-gray-500">
                {new Date(document.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="text-sm text-gray-600">{getStatusText()}</span>
            </div>
            {document.status === 'exported' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/verification/${document.id}`);
                }}
              >
                <Download size={16} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
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
