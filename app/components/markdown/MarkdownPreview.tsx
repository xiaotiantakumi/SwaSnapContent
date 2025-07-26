import { memo } from 'react';

import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

/**
 * Memoized markdown preview component that renders markdown content
 * Uses react-markdown with security-first approach and performance optimization
 */
export const MarkdownPreview = memo(
  ({ content, className = '' }: MarkdownPreviewProps) => {
    return (
      <div
        className={`prose prose-slate max-w-none dark:prose-invert ${className}`}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  },
);

MarkdownPreview.displayName = 'MarkdownPreview';