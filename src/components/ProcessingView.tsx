import { CheckCircle, Circle, Loader2 } from 'lucide-react';
import { Card, CardContent } from './ui/Card';

type ProcessingStep = {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  description?: string;
};

interface ProcessingViewProps {
  steps: ProcessingStep[];
  currentStepIndex: number;
}

export function ProcessingView({ steps, currentStepIndex }: ProcessingViewProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
          Analyzing PDF
        </h2>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`
                flex items-start gap-4 p-4 rounded-lg transition-colors
                ${index === currentStepIndex ? 'bg-blue-50' : 'bg-gray-50'}
              `}
            >
              <div className="flex-shrink-0 mt-0.5">
                {step.status === 'completed' ? (
                  <CheckCircle className="text-green-600" size={24} />
                ) : step.status === 'processing' ? (
                  <Loader2 className="text-blue-600 animate-spin" size={24} />
                ) : step.status === 'error' ? (
                  <Circle className="text-red-600" size={24} />
                ) : (
                  <Circle className="text-gray-300" size={24} />
                )}
              </div>
              <div className="flex-1">
                <p className={`
                  font-medium
                  ${step.status === 'completed' ? 'text-green-700' : ''}
                  ${step.status === 'processing' ? 'text-blue-700' : ''}
                  ${step.status === 'error' ? 'text-red-700' : ''}
                  ${step.status === 'pending' ? 'text-gray-500' : ''}
                `}>
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-sm text-gray-500 mt-1">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function useProcessingSteps() {
  const initialSteps: ProcessingStep[] = [
    {
      id: 'upload',
      label: 'Uploading PDF',
      status: 'pending',
      description: 'Uploading file to storage',
    },
    {
      id: 'convert',
      label: 'Converting to Images',
      status: 'pending',
      description: 'Converting PDF pages to images',
    },
    {
      id: 'analyze',
      label: 'Analyzing with Claude',
      status: 'pending',
      description: 'AI is analyzing the content',
    },
    {
      id: 'save',
      label: 'Saving Results',
      status: 'pending',
      description: 'Storing analysis results',
    },
  ];

  return initialSteps;
}
