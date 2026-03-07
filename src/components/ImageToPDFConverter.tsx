import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  Image as ImageIcon,
  X,
  GripVertical,
  ArrowUp,
  ArrowDown,
  FileDown,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader } from './ui/Card';

interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

interface ImageToPDFConverterProps {
  onPDFCreated: (pdfBlob: Blob, filename: string) => void;
  isConverting?: boolean;
}

export function ImageToPDFConverter({
  onPDFCreated,
  isConverting = false,
}: ImageToPDFConverterProps) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [pdfName, setPdfName] = useState('converted-document');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages = acceptedFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'],
    },
    disabled: isConverting,
  });

  const removeImage = (id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) {
        URL.revokeObjectURL(img.preview);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= images.length) return;

    const newImages = [...images];
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    setImages(newImages);
  };

  const clearAll = () => {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    dragNode.current = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);

    // Add dragging class after a small delay for visual feedback
    setTimeout(() => {
      if (dragNode.current) {
        dragNode.current.style.opacity = '0.5';
      }
    }, 0);
  };

  const handleDragEnter = (index: number) => {
    if (draggedIndex === null) return;
    if (index !== draggedIndex) {
      setDragOverIndex(index);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newImages = [...images];
    const draggedItem = newImages[draggedIndex];

    // Remove from old position
    newImages.splice(draggedIndex, 1);
    // Insert at new position
    newImages.splice(dropIndex, 0, draggedItem);

    setImages(newImages);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    if (dragNode.current) {
      dragNode.current.style.opacity = '1';
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragNode.current = null;
  };

  const convertToPDF = async () => {
    if (images.length === 0) return;

    // Dynamic import jspdf
    const { jsPDF } = await import('jspdf');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
    });

    for (let i = 0; i < images.length; i++) {
      const img = images[i];

      // Load image
      const imgData = await loadImageAsDataURL(img.file);
      const dimensions = await getImageDimensions(img.preview);

      // Calculate dimensions to fit page
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;

      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;

      let width = dimensions.width;
      let height = dimensions.height;

      // Scale to fit
      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = height * ratio;
      }
      if (height > maxHeight) {
        const ratio = maxHeight / height;
        height = maxHeight;
        width = width * ratio;
      }

      // Center on page
      const x = (pageWidth - width) / 2;
      const y = (pageHeight - height) / 2;

      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, 'JPEG', x, y, width, height);
    }

    const pdfBlob = pdf.output('blob');
    onPDFCreated(pdfBlob, `${pdfName}.pdf`);
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-gray-900">
          Create PDF from Images
        </h2>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-8
            transition-colors duration-200 cursor-pointer
            ${isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
            }
            ${isConverting ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3">
            <div className={`
              p-3 rounded-full
              ${isDragActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}
            `}>
              <Upload size={24} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                {isDragActive
                  ? 'Drop images here'
                  : 'Drag & drop images here'
                }
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, JPEG, WebP, GIF
              </p>
            </div>
          </div>
        </div>

        {/* Image List */}
        {images.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">
                {images.length} image{images.length > 1 ? 's' : ''} selected
                <span className="text-gray-400 font-normal ml-2">
                  (drag to reorder)
                </span>
              </p>
              <Button variant="ghost" size="sm" onClick={clearAll}>
                Clear All
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {images.map((img, index) => (
                <div
                  key={img.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg
                    transition-all duration-200 cursor-grab active:cursor-grabbing
                    ${dragOverIndex === index
                      ? 'bg-blue-100 border-2 border-blue-400 border-dashed'
                      : 'bg-gray-50 border-2 border-transparent'
                    }
                    ${draggedIndex === index ? 'opacity-50' : ''}
                  `}
                >
                  <GripVertical className="text-gray-400 cursor-grab" size={20} />
                  <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden bg-white border">
                    <img
                      src={img.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {img.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Page {index + 1}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveImage(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      title="Move up"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      onClick={() => moveImage(index, 'down')}
                      disabled={index === images.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      title="Move down"
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      onClick={() => removeImage(img.id)}
                      className="p-1 text-red-400 hover:text-red-600"
                      title="Remove"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PDF Name & Convert Button */}
        {images.length > 0 && (
          <div className="flex gap-3 pt-4 border-t">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                PDF Filename
              </label>
              <input
                type="text"
                value={pdfName}
                onChange={(e) => setPdfName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="document-name"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={convertToPDF} isLoading={isConverting}>
                <FileDown size={16} className="mr-2" />
                Create PDF
              </Button>
            </div>
          </div>
        )}

        {images.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <ImageIcon size={48} className="mx-auto mb-2" />
            <p className="text-sm">No images added yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function loadImageAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.src = src;
  });
}
