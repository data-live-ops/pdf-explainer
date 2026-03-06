import { useState } from 'react';
import { Edit2, Eye, Save, X } from 'lucide-react';
import { Button } from './ui/Button';
import { TextArea } from './ui/Input';
import { Card, CardContent, CardHeader } from './ui/Card';
import { LatexRenderer } from './LatexRenderer';

interface ResultEditorProps {
  diketahui: string;
  ditanya: string;
  jawaban: string;
  onSave: (data: { diketahui: string; ditanya: string; jawaban: string }) => void;
  isSaving?: boolean;
}

export function ResultEditor({
  diketahui,
  ditanya,
  jawaban,
  onSave,
  isSaving = false,
}: ResultEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    diketahui,
    ditanya,
    jawaban,
  });

  const handleSave = () => {
    onSave(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({ diketahui, ditanya, jawaban });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Edit Analysis</h2>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X size={16} className="mr-1" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} isLoading={isSaving}>
              <Save size={16} className="mr-1" />
              Save
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <TextArea
            label="Given"
            value={editData.diketahui}
            onChange={(e) => setEditData({ ...editData, diketahui: e.target.value })}
            rows={4}
          />
          <TextArea
            label="Find"
            value={editData.ditanya}
            onChange={(e) => setEditData({ ...editData, ditanya: e.target.value })}
            rows={3}
          />
          <TextArea
            label="Solution"
            value={editData.jawaban}
            onChange={(e) => setEditData({ ...editData, jawaban: e.target.value })}
            rows={10}
          />
          <p className="text-sm text-gray-500">
            Tip: Use $...$ for inline math and $$...$$ for display math (LaTeX)
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Analysis Result</h2>
        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
          <Edit2 size={16} className="mr-1" />
          Edit
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <Section title="Given" content={diketahui} />
        <Section title="Find" content={ditanya} />
        <Section title="Solution" content={jawaban} />
      </CardContent>
    </Card>
  );
}

function Section({ title, content }: { title: string; content: string }) {
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          {title}
        </h3>
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <Eye size={14} />
          {showRaw ? 'Show Rendered' : 'Show Raw'}
        </button>
      </div>
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 overflow-x-auto">
        {showRaw ? (
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
            {content}
          </pre>
        ) : (
          <LatexRenderer content={content} />
        )}
      </div>
    </div>
  );
}
