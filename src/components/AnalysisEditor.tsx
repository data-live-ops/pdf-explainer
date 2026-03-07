import { useState, useRef } from 'react';
import { Edit2, Save, X, Eye, Upload, Trash2, Plus } from 'lucide-react';
import { Button } from './ui/Button';
import { TextArea, Input } from './ui/Input';
import { Card, CardContent, CardHeader } from './ui/Card';
import { LatexRenderer } from './LatexRenderer';
import { Category, AnalysisResult } from '../lib/types';

interface AnalysisEditorProps {
  analysis: AnalysisResult;
  categories: Category[];
  onSave: (data: Partial<AnalysisResult>) => Promise<void>;
  onImageUpload: (type: 'question' | 'solution', file: File) => Promise<string | null>;
  isSaving?: boolean;
}

export function AnalysisEditor({
  analysis,
  categories,
  onSave,
  onImageUpload,
  isSaving = false,
}: AnalysisEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    question_latex: analysis.question_latex || '',
    question_image: analysis.question_image || '',
    question_description: analysis.question_description || '',
    category_id: analysis.category_id || '',
    solution_latex: analysis.solution_latex || { given: '', find: '', solution: '' },
    solution_image: analysis.solution_image || '',
    answer_latex: analysis.answer_latex || [''],
  });
  const [uploadingQuestion, setUploadingQuestion] = useState(false);
  const [uploadingSolution, setUploadingSolution] = useState(false);

  const questionImageRef = useRef<HTMLInputElement>(null);
  const solutionImageRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    await onSave({
      question_latex: editData.question_latex,
      question_image: editData.question_image || undefined,
      question_description: editData.question_description,
      category_id: editData.category_id || undefined,
      solution_latex: editData.solution_latex,
      solution_image: editData.solution_image || undefined,
      answer_latex: editData.answer_latex.filter((a) => a.trim() !== ''),
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      question_latex: analysis.question_latex || '',
      question_image: analysis.question_image || '',
      question_description: analysis.question_description || '',
      category_id: analysis.category_id || '',
      solution_latex: analysis.solution_latex || { given: '', find: '', solution: '' },
      solution_image: analysis.solution_image || '',
      answer_latex: analysis.answer_latex || [''],
    });
    setIsEditing(false);
  };

  const handleImageUpload = async (type: 'question' | 'solution', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'question') {
      setUploadingQuestion(true);
    } else {
      setUploadingSolution(true);
    }

    const url = await onImageUpload(type, file);

    if (url) {
      if (type === 'question') {
        setEditData({ ...editData, question_image: url });
      } else {
        setEditData({ ...editData, solution_image: url });
      }
    }

    if (type === 'question') {
      setUploadingQuestion(false);
    } else {
      setUploadingSolution(false);
    }
  };

  const addAnswer = () => {
    setEditData({
      ...editData,
      answer_latex: [...editData.answer_latex, ''],
    });
  };

  const removeAnswer = (index: number) => {
    const newAnswers = editData.answer_latex.filter((_, i) => i !== index);
    setEditData({ ...editData, answer_latex: newAnswers.length ? newAnswers : [''] });
  };

  const updateAnswer = (index: number, value: string) => {
    const newAnswers = [...editData.answer_latex];
    newAnswers[index] = value;
    setEditData({ ...editData, answer_latex: newAnswers });
  };

  const getCategoryName = (id?: string) => {
    if (!id) return 'Not selected';
    const cat = categories.find((c) => c.id === id);
    return cat?.name || 'Unknown';
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
        <CardContent className="space-y-6">
          {/* Question Section */}
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900">Question</h3>

            <TextArea
              label="Question (LaTeX)"
              value={editData.question_latex}
              onChange={(e) => setEditData({ ...editData, question_latex: e.target.value })}
              rows={4}
              placeholder="Enter the question with LaTeX formatting..."
            />

            <TextArea
              label="Question Description"
              value={editData.question_description}
              onChange={(e) => setEditData({ ...editData, question_description: e.target.value })}
              rows={3}
              placeholder="AI-generated description of the question..."
            />

            {/* Question Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Image (optional)
              </label>
              <input
                ref={questionImageRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload('question', e)}
                className="hidden"
              />
              {editData.question_image ? (
                <div className="relative inline-block">
                  <img
                    src={editData.question_image}
                    alt="Question"
                    className="max-w-xs rounded border"
                  />
                  <button
                    onClick={() => setEditData({ ...editData, question_image: '' })}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => questionImageRef.current?.click()}
                  isLoading={uploadingQuestion}
                >
                  <Upload size={14} className="mr-2" />
                  Upload Image
                </Button>
              )}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={editData.category_id}
              onChange={(e) => setEditData({ ...editData, category_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a category...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Solution Section */}
          <div className="space-y-4 p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-900">Solution</h3>

            <TextArea
              label="Given"
              value={editData.solution_latex.given}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  solution_latex: { ...editData.solution_latex, given: e.target.value },
                })
              }
              rows={3}
              placeholder="Known information..."
            />

            <TextArea
              label="Find"
              value={editData.solution_latex.find}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  solution_latex: { ...editData.solution_latex, find: e.target.value },
                })
              }
              rows={2}
              placeholder="What needs to be found..."
            />

            <TextArea
              label="Solution Steps"
              value={editData.solution_latex.solution}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  solution_latex: { ...editData.solution_latex, solution: e.target.value },
                })
              }
              rows={8}
              placeholder="Step-by-step solution with LaTeX..."
            />

            {/* Solution Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Solution Image (optional)
              </label>
              <input
                ref={solutionImageRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload('solution', e)}
                className="hidden"
              />
              {editData.solution_image ? (
                <div className="relative inline-block">
                  <img
                    src={editData.solution_image}
                    alt="Solution"
                    className="max-w-xs rounded border"
                  />
                  <button
                    onClick={() => setEditData({ ...editData, solution_image: '' })}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => solutionImageRef.current?.click()}
                  isLoading={uploadingSolution}
                >
                  <Upload size={14} className="mr-2" />
                  Upload Image
                </Button>
              )}
            </div>
          </div>

          {/* Answers Section */}
          <div className="space-y-4 p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-yellow-900">Answers</h3>
              <Button variant="ghost" size="sm" onClick={addAnswer}>
                <Plus size={14} className="mr-1" />
                Add Answer
              </Button>
            </div>

            {editData.answer_latex.map((answer, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1">
                  <Input
                    value={answer}
                    onChange={(e) => updateAnswer(index, e.target.value)}
                    placeholder={`Answer ${String.fromCharCode(97 + index)}) ...`}
                  />
                </div>
                {editData.answer_latex.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAnswer(index)}
                  >
                    <Trash2 size={14} className="text-red-500" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-500">
            Tip: Use $...$ for inline math and $$...$$ for display math (LaTeX)
          </p>
        </CardContent>
      </Card>
    );
  }

  // View Mode
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
        {/* Question */}
        <Section title="Question" color="blue">
          <RenderContent content={analysis.question_latex} />
          {analysis.question_image && (
            <img
              src={analysis.question_image}
              alt="Question attachment"
              className="mt-3 max-w-md rounded border"
            />
          )}
        </Section>

        {/* Description */}
        <Section title="Description" color="gray">
          <p className="text-gray-700">{analysis.question_description || 'No description'}</p>
        </Section>

        {/* Category */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500">Category:</span>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
            {getCategoryName(analysis.category_id)}
          </span>
        </div>

        {/* Solution */}
        <Section title="Given" color="green">
          <RenderContent content={analysis.solution_latex?.given || ''} />
        </Section>

        <Section title="Find" color="green">
          <RenderContent content={analysis.solution_latex?.find || ''} />
        </Section>

        <Section title="Solution" color="green">
          <RenderContent content={analysis.solution_latex?.solution || ''} />
          {analysis.solution_image && (
            <img
              src={analysis.solution_image}
              alt="Solution attachment"
              className="mt-3 max-w-md rounded border"
            />
          )}
        </Section>

        {/* Answers */}
        <Section title="Answers" color="yellow">
          {analysis.answer_latex && analysis.answer_latex.length > 0 ? (
            <ul className="space-y-2">
              {analysis.answer_latex.map((answer, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="font-medium text-yellow-700">
                    {String.fromCharCode(97 + index)})
                  </span>
                  <LatexRenderer content={answer} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No answers provided</p>
          )}
        </Section>
      </CardContent>
    </Card>
  );
}

function Section({
  title,
  color,
  children,
}: {
  title: string;
  color: 'blue' | 'green' | 'yellow' | 'gray';
  children: React.ReactNode;
}) {
  const bgColors = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    yellow: 'bg-yellow-50',
    gray: 'bg-gray-50',
  };
  const textColors = {
    blue: 'text-blue-700',
    green: 'text-green-700',
    yellow: 'text-yellow-700',
    gray: 'text-gray-700',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-semibold uppercase tracking-wide ${textColors[color]}`}>
          {title}
        </h3>
      </div>
      <div className={`p-4 rounded-lg border ${bgColors[color]}`}>
        {children}
      </div>
    </div>
  );
}

function RenderContent({ content }: { content: string }) {
  const [showRaw, setShowRaw] = useState(false);

  if (!content) {
    return <p className="text-gray-500 italic">Not provided</p>;
  }

  return (
    <div>
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <Eye size={12} />
          {showRaw ? 'Show Rendered' : 'Show Raw'}
        </button>
      </div>
      {showRaw ? (
        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-white p-2 rounded">
          {content}
        </pre>
      ) : (
        <LatexRenderer content={content} />
      )}
    </div>
  );
}
