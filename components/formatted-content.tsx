'use client';

import { useMemo } from 'react';
import DOMPurify from 'dompurify';

interface FormattedContentProps {
  content: string;
  className?: string;
}

export function FormattedContent({ content, className = '' }: FormattedContentProps) {
  const sanitizedContent = useMemo(() => {
    // Configure DOMPurify to allow specific tags and attributes
    const config = {
      ALLOWED_TAGS: [
        'p',
        'br',
        'strong',
        'em',
        'u',
        'a',
        'ul',
        'ol',
        'li',
        'code',
        'pre',
        'span',
        'blockquote',
      ],
      ALLOWED_ATTR: ['href', 'class', 'data-type', 'data-id'],
      ALLOWED_CLASSES: {
        span: ['mention'],
        pre: ['bg-muted', 'p-4', 'rounded-md', 'font-mono', 'text-sm', 'overflow-x-auto'],
        code: ['language-*'],
        a: ['text-primary', 'underline', 'hover:text-primary/80'],
      },
    };

    return DOMPurify.sanitize(content, config);
  }, [content]);

  // Check if content is HTML or plain text
  const isHtml = content.includes('<') && content.includes('>');

  if (!isHtml) {
    // Render plain text with line breaks
    return (
      <div className={`prose prose-sm max-w-none ${className}`}>
        <p className="whitespace-pre-wrap text-sm">{content}</p>
      </div>
    );
  }

  return (
    <div
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}
