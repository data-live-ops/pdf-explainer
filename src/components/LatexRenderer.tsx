import { useEffect, useRef } from 'react';
import katex from 'katex';

interface LatexRendererProps {
  content: string;
  className?: string;
}

export function LatexRenderer({ content, className = '' }: LatexRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const element = containerRef.current;
    element.innerHTML = '';

    // Process the content to render LaTeX
    const processedContent = renderLatexContent(content);
    element.innerHTML = processedContent;
  }, [content]);

  return (
    <div
      ref={containerRef}
      className={`latex-content prose prose-sm max-w-none ${className}`}
    />
  );
}

function renderLatexContent(content: string): string {
  // Handle display math ($$...$$)
  let result = content.replace(/\$\$([\s\S]*?)\$\$/g, (_, latex) => {
    try {
      return katex.renderToString(latex.trim(), {
        displayMode: true,
        throwOnError: false,
        trust: true,
      });
    } catch {
      return `<span class="text-red-500">[LaTeX Error: ${latex}]</span>`;
    }
  });

  // Handle inline math ($...$)
  result = result.replace(/\$([^$\n]+?)\$/g, (_, latex) => {
    try {
      return katex.renderToString(latex.trim(), {
        displayMode: false,
        throwOnError: false,
        trust: true,
      });
    } catch {
      return `<span class="text-red-500">[LaTeX Error: ${latex}]</span>`;
    }
  });

  // Convert newlines to <br> for proper formatting
  result = result.replace(/\n/g, '<br>');

  return result;
}

interface LatexPreviewProps {
  content: string;
  label: string;
}

export function LatexPreview({ content, label }: LatexPreviewProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        {label}
      </h3>
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <LatexRenderer content={content} />
      </div>
    </div>
  );
}
