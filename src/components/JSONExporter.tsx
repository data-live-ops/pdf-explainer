import { useState } from 'react';
import { Download, Copy, Check, FileJson } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader } from './ui/Card';
import { ExportedJSON } from '../lib/types';

interface JSONExporterProps {
  data: ExportedJSON;
  onExport?: () => void;
}

export function JSONExporter({ data, onExport }: JSONExporterProps) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const jsonString = JSON.stringify(data, null, 2);

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
    a.download = `${data.id}_analysis.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onExport?.();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <FileJson className="text-blue-600" size={20} />
          <h2 className="text-lg font-semibold text-gray-900">Export JSON</h2>
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
          <h4 className="text-sm font-medium text-gray-700 mb-2">Export Summary</h4>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-gray-500">Category:</dt>
            <dd className="text-gray-900">{data.category}</dd>
            <dt className="text-gray-500">Source:</dt>
            <dd className="text-gray-900">{data.source_origin}</dd>
            <dt className="text-gray-500">Answers:</dt>
            <dd className="text-gray-900">{data.answer_latex?.length || 0}</dd>
          </dl>
        </div>
      </CardContent>
    </Card>
  );
}
