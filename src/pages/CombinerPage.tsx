import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  Copy,
  Check,
  FileJson,
  Layers,
  ArrowLeft,
  Square,
  CheckSquare,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { useDocuments } from '../hooks/useDocuments';
import { DocumentWithAnalysis } from '../lib/types';

export function CombinerPage() {
  const navigate = useNavigate();
  const { documents, loading } = useDocuments();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Filter verified/exported docs
  const eligibleDocs = documents.filter(
    (d) => d.status === 'verified' || d.status === 'exported'
  );

  // Get final_json from selected docs
  const combinedData = eligibleDocs
    .filter((d) => selectedIds.has(d.id))
    .map((d) => d.analysis_results?.[0]?.final_json)
    .filter(Boolean);

  const jsonString = JSON.stringify(combinedData, null, 2);

  const handleToggle = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === eligibleDocs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(eligibleDocs.map((d) => d.id)));
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `combined_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const allSelected = eligibleDocs.length > 0 && selectedIds.size === eligibleDocs.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                <ArrowLeft size={16} className="mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Combine JSON</h1>
                <p className="text-gray-600 text-sm mt-1">
                  Merge multiple documents into a single JSON file
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : eligibleDocs.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Layers className="mx-auto text-gray-300 mb-4" size={64} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No eligible documents
              </h3>
              <p className="text-gray-500 mb-6">
                Only verified or exported documents can be combined.
                <br />
                Complete verification on some documents first.
              </p>
              <Button onClick={() => navigate('/')}>
                <ArrowLeft size={16} className="mr-2" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Selection Controls */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="text-blue-600" size={20} />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Select Documents
                  </h2>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Selected: {selectedIds.size} documents
                  </span>
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    {allSelected ? (
                      <>
                        <Square size={14} className="mr-2" />
                        Deselect All
                      </>
                    ) : (
                      <>
                        <CheckSquare size={14} className="mr-2" />
                        Select All
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {eligibleDocs.map((doc) => (
                    <DocumentItem
                      key={doc.id}
                      document={doc}
                      selected={selectedIds.has(doc.id)}
                      onToggle={() => handleToggle(doc.id)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Export Section */}
            {selectedIds.size > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileJson className="text-blue-600" size={20} />
                    <h2 className="text-lg font-semibold text-gray-900">
                      Combined JSON
                    </h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                  </Button>
                </CardHeader>
                <CardContent>
                  {showPreview && (
                    <div className="mb-4 max-h-96 overflow-auto bg-gray-900 rounded-lg p-4">
                      <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                        {jsonString}
                      </pre>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={handleCopy}>
                      {copied ? (
                        <>
                          <Check size={16} className="mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={16} className="mr-2" />
                          Copy to Clipboard
                        </>
                      )}
                    </Button>
                    <Button className="flex-1" onClick={handleDownload}>
                      <Download size={16} className="mr-2" />
                      Download JSON
                    </Button>
                  </div>

                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Export Summary
                    </h4>
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <dt className="text-gray-500">Documents:</dt>
                      <dd className="text-gray-900">{selectedIds.size}</dd>
                      <dt className="text-gray-500">Total Items:</dt>
                      <dd className="text-gray-900">{combinedData.length}</dd>
                    </dl>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

interface DocumentItemProps {
  document: DocumentWithAnalysis;
  selected: boolean;
  onToggle: () => void;
}

function DocumentItem({ document, selected, onToggle }: DocumentItemProps) {
  const getStatusBadge = () => {
    if (document.status === 'verified') {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
          Verified
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
        Exported
      </span>
    );
  };

  return (
    <div
      className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-colors ${
        selected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
      onClick={onToggle}
    >
      <div className="text-blue-600">
        {selected ? <CheckSquare size={20} /> : <Square size={20} />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{document.filename}</p>
        <p className="text-sm text-gray-500">
          {new Date(document.created_at).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      </div>

      {getStatusBadge()}
    </div>
  );
}
