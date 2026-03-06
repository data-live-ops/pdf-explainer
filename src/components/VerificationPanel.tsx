import { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Lightbulb,
  Bug,
  Type,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader } from './ui/Card';
import { GeminiCheckResult } from '../lib/types';

interface VerificationPanelProps {
  result: GeminiCheckResult | null;
  onVerify: () => void;
  onApprove: () => void;
  onReject: () => void;
  isVerifying?: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected';
}

export function VerificationPanel({
  result,
  onVerify,
  onApprove,
  onReject,
  isVerifying = false,
  verificationStatus,
}: VerificationPanelProps) {
  const [showDetails, setShowDetails] = useState(true);

  if (!result && verificationStatus === 'pending') {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Verification</h2>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-gray-100 rounded-full">
              <AlertTriangle className="text-gray-400" size={32} />
            </div>
            <p className="text-gray-600">
              Run AI verification to check for errors and get suggestions
            </p>
            <Button onClick={onVerify} isLoading={isVerifying}>
              <RefreshCw size={16} className="mr-2" />
              Verify with Gemini
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Verification</h2>
          {verificationStatus === 'verified' && (
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
              Approved
            </span>
          )}
          {verificationStatus === 'rejected' && (
            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
              Rejected
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </Button>
      </CardHeader>
      <CardContent>
        {result && (
          <div className="space-y-4">
            {/* Overall Status */}
            <div className={`
              p-4 rounded-lg flex items-center gap-3
              ${result.isCorrect ? 'bg-green-50' : 'bg-yellow-50'}
            `}>
              {result.isCorrect ? (
                <CheckCircle className="text-green-600" size={24} />
              ) : (
                <AlertTriangle className="text-yellow-600" size={24} />
              )}
              <div>
                <p className={`font-medium ${result.isCorrect ? 'text-green-700' : 'text-yellow-700'}`}>
                  {result.isCorrect
                    ? 'Analysis appears correct'
                    : 'Some issues detected'
                  }
                </p>
                <p className="text-sm text-gray-600">
                  Confidence: {(result.confidence * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            {showDetails && (
              <>
                {/* Typos */}
                {result.typos.length > 0 && (
                  <IssueList
                    icon={<Type className="text-blue-600" size={20} />}
                    title="Typos Found"
                    items={result.typos}
                    color="blue"
                  />
                )}

                {/* Errors */}
                {result.errors.length > 0 && (
                  <IssueList
                    icon={<Bug className="text-red-600" size={20} />}
                    title="Errors Detected"
                    items={result.errors}
                    color="red"
                  />
                )}

                {/* Suggestions */}
                {result.suggestions.length > 0 && (
                  <IssueList
                    icon={<Lightbulb className="text-yellow-600" size={20} />}
                    title="Suggestions"
                    items={result.suggestions}
                    color="yellow"
                  />
                )}

                {result.typos.length === 0 &&
                  result.errors.length === 0 &&
                  result.suggestions.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No issues or suggestions found
                  </p>
                )}
              </>
            )}

            {/* Actions */}
            {verificationStatus === 'pending' && (
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onVerify}
                  isLoading={isVerifying}
                >
                  <RefreshCw size={16} className="mr-2" />
                  Re-verify
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={onReject}
                >
                  <XCircle size={16} className="mr-2" />
                  Reject
                </Button>
                <Button
                  className="flex-1"
                  onClick={onApprove}
                >
                  <CheckCircle size={16} className="mr-2" />
                  Approve
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface IssueListProps {
  icon: React.ReactNode;
  title: string;
  items: string[];
  color: 'blue' | 'red' | 'yellow';
}

function IssueList({ icon, title, items, color }: IssueListProps) {
  const bgColors = {
    blue: 'bg-blue-50',
    red: 'bg-red-50',
    yellow: 'bg-yellow-50',
  };

  const textColors = {
    blue: 'text-blue-700',
    red: 'text-red-700',
    yellow: 'text-yellow-700',
  };

  return (
    <div className={`p-4 rounded-lg ${bgColors[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h4 className={`font-medium ${textColors[color]}`}>{title}</h4>
      </div>
      <ul className="space-y-1">
        {items.map((item, index) => (
          <li key={index} className="text-sm text-gray-700 pl-7">
            • {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
