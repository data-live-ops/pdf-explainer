import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from './ui/Button';

interface PDFUploaderProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
}

export function PDFUploader({ onFileSelect, isUploading = false }: PDFUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  const handleClear = () => {
    setSelectedFile(null);
  };

  const handleUpload = () => {
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-12
          transition-colors duration-200 cursor-pointer
          ${isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className={`
            p-4 rounded-full
            ${isDragActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}
          `}>
            <Upload size={32} />
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-gray-700">
              {isDragActive
                ? 'Drop the PDF here'
                : 'Drag & drop a PDF file here'
              }
            </p>
            <p className="text-sm text-gray-500 mt-1">
              or click to browse your files
            </p>
          </div>
          <p className="text-xs text-gray-400">
            Supports: PDF files (math, physics, chemistry problems)
          </p>
        </div>
      </div>

      {selectedFile && (
        <div className="mt-6 bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <FileText className="text-red-600" size={24} />
              </div>
              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={handleClear}
              disabled={isUploading}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleUpload}
              isLoading={isUploading}
              disabled={isUploading}
            >
              {isUploading ? 'Processing...' : 'Analyze PDF'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
