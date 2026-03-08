import { useState, useMemo } from 'react';
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
  GripVertical,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { useDocuments } from '../hooks/useDocuments';
import { useCategories } from '../hooks/useCategories';
import { DocumentWithAnalysis, ExportedJSON } from '../lib/types';

export function CombinerPage() {
  const navigate = useNavigate();
  const { documents, loading } = useDocuments();
  const { categories } = useCategories();
  // Use array instead of Set to maintain order
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Filter verified/exported docs
  const eligibleDocs = documents.filter(
    (d) => d.status === 'verified' || d.status === 'exported'
  );

  // Create a map for quick lookup
  const docsMap = useMemo(() => {
    const map = new Map<string, DocumentWithAnalysis>();
    eligibleDocs.forEach((doc) => map.set(doc.id, doc));
    return map;
  }, [eligibleDocs]);

  // Generate export data for each selected document in order
  const combinedData = useMemo(() => {
    return selectedIds
      .map((id) => {
        const doc = docsMap.get(id);
        if (!doc) return null;

        const analysis = doc.analysis_results?.[0];
        if (!analysis) return null;

        // Use final_json if available (exported docs), otherwise generate it
        if (analysis.final_json) {
          return analysis.final_json;
        }

        // Generate export data on-the-fly for verified docs
        const category = categories.find((c) => c.id === analysis.category_id);
        const exportData: ExportedJSON = {
          id: doc.id,
          question_latex: analysis.question_latex || '',
          question_image: analysis.question_image,
          question_description: analysis.question_description || '',
          category: category?.name || 'Uncategorized',
          source_origin: analysis.source_origin || 'Expert-Generated',
          solution_latex: analysis.solution_latex || { given: '', find: '', solution: '' },
          solution_image: analysis.solution_image,
          answer_latex: analysis.answer_latex || [],
        };

        return exportData;
      })
      .filter(Boolean) as ExportedJSON[];
  }, [selectedIds, docsMap, categories]);

  const jsonString = JSON.stringify(combinedData, null, 2);

  const handleToggle = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.length === eligibleDocs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(eligibleDocs.map((d) => d.id));
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    setSelectedIds((prev) => {
      const newOrder = [...prev];
      const draggedIndex = newOrder.indexOf(draggedId);
      const targetIndex = newOrder.indexOf(targetId);

      if (draggedIndex === -1 || targetIndex === -1) return prev;

      // Remove dragged item and insert at target position
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedId);

      return newOrder;
    });

    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
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

  const allSelected = eligibleDocs.length > 0 && selectedIds.length === eligibleDocs.length;

  // Separate selected (ordered) and unselected docs
  const selectedDocs = selectedIds
    .map((id) => docsMap.get(id))
    .filter(Boolean) as DocumentWithAnalysis[];
  const unselectedDocs = eligibleDocs.filter((d) => !selectedIds.includes(d.id));

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
                    Selected: {selectedIds.length} documents
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
                {/* Selected Documents (Draggable) */}
                {selectedDocs.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Selected (drag to reorder):
                    </p>
                    <div className="space-y-2">
                      {selectedDocs.map((doc, index) => (
                        <DocumentItem
                          key={doc.id}
                          document={doc}
                          selected={true}
                          index={index + 1}
                          onToggle={() => handleToggle(doc.id)}
                          draggable={true}
                          isDragging={draggedId === doc.id}
                          onDragStart={(e) => handleDragStart(e, doc.id)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, doc.id)}
                          onDragEnd={handleDragEnd}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Unselected Documents */}
                {unselectedDocs.length > 0 && (
                  <div>
                    {selectedDocs.length > 0 && (
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Available:
                      </p>
                    )}
                    <div className="space-y-2">
                      {unselectedDocs.map((doc) => (
                        <DocumentItem
                          key={doc.id}
                          document={doc}
                          selected={false}
                          onToggle={() => handleToggle(doc.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Export Section */}
            {selectedIds.length > 0 && (
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
                      <dd className="text-gray-900">{selectedIds.length}</dd>
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
  index?: number;
  onToggle: () => void;
  draggable?: boolean;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
}

function DocumentItem({
  document,
  selected,
  index,
  onToggle,
  draggable = false,
  isDragging = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: DocumentItemProps) {
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
      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
        selected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      } ${isDragging ? 'opacity-50 scale-[0.98]' : ''} ${
        draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      }`}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      {/* Drag Handle */}
      {draggable && (
        <div className="text-gray-400 hover:text-gray-600">
          <GripVertical size={18} />
        </div>
      )}

      {/* Index Badge */}
      {selected && index !== undefined && (
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-medium flex items-center justify-center">
          {index}
        </div>
      )}

      {/* Checkbox */}
      <div
        className="text-blue-600 cursor-pointer flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        {selected ? <CheckSquare size={20} /> : <Square size={20} />}
      </div>

      {/* Document Info */}
      <div className="flex-1 min-w-0" onClick={onToggle}>
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
