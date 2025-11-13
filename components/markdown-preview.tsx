'use client';

import { useEffect, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import mermaid from 'mermaid';
import 'highlight.js/styles/github.css';

interface MarkdownPreviewProps {
  content: string;
}

// Initialize Mermaid
if (typeof window !== 'undefined') {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
  });
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const [debouncedContent, setDebouncedContent] = useState(content);

  // Debounce content updates by 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedContent(content);
    }, 500);

    return () => clearTimeout(timer);
  }, [content]);

  // Render Mermaid diagrams after content updates
  useEffect(() => {
    const renderMermaid = async () => {
      const mermaidElements = document.querySelectorAll('.mermaid-diagram');
      
      for (const element of Array.from(mermaidElements)) {
        const code = element.textContent || '';
        if (code.trim()) {
          try {
            const { svg } = await mermaid.render(
              `mermaid-${Math.random().toString(36).substr(2, 9)}`,
              code
            );
            element.innerHTML = svg;
          } catch (error) {
            console.error('Mermaid rendering error:', error);
            element.innerHTML = `<pre class="text-red-600">Error rendering diagram: ${error}</pre>`;
          }
        }
      }
    };

    renderMermaid();
  }, [debouncedContent]);

  const components = useMemo(
    () => ({
      code({ node, inline, className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || '');
        const language = match ? match[1] : '';

        // Handle Mermaid diagrams
        if (language === 'mermaid' && !inline) {
          return (
            <div className="mermaid-diagram my-4">
              {String(children).replace(/\n$/, '')}
            </div>
          );
        }

        // Regular code blocks with syntax highlighting
        if (!inline && match) {
          return (
            <pre className={className}>
              <code className={className} {...props}>
                {children}
              </code>
            </pre>
          );
        }

        // Inline code
        return (
          <code className="px-1 py-0.5 bg-gray-100 rounded text-sm font-mono" {...props}>
            {children}
          </code>
        );
      },
      // Style other markdown elements
      h1: ({ children }: any) => (
        <h1 className="text-3xl font-bold mt-6 mb-4">{children}</h1>
      ),
      h2: ({ children }: any) => (
        <h2 className="text-2xl font-bold mt-5 mb-3">{children}</h2>
      ),
      h3: ({ children }: any) => (
        <h3 className="text-xl font-bold mt-4 mb-2">{children}</h3>
      ),
      h4: ({ children }: any) => (
        <h4 className="text-lg font-semibold mt-3 mb-2">{children}</h4>
      ),
      p: ({ children }: any) => <p className="mb-4 leading-7">{children}</p>,
      ul: ({ children }: any) => (
        <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>
      ),
      ol: ({ children }: any) => (
        <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>
      ),
      li: ({ children }: any) => <li className="ml-4">{children}</li>,
      blockquote: ({ children }: any) => (
        <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4 text-gray-700">
          {children}
        </blockquote>
      ),
      table: ({ children }: any) => (
        <div className="overflow-x-auto my-4">
          <table className="min-w-full border-collapse border border-gray-300">
            {children}
          </table>
        </div>
      ),
      thead: ({ children }: any) => (
        <thead className="bg-gray-100">{children}</thead>
      ),
      th: ({ children }: any) => (
        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
          {children}
        </th>
      ),
      td: ({ children }: any) => (
        <td className="border border-gray-300 px-4 py-2">{children}</td>
      ),
      a: ({ children, href }: any) => (
        <a
          href={href}
          className="text-blue-600 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      ),
      hr: () => <hr className="my-6 border-gray-300" />,
    }),
    []
  );

  return (
    <div className="prose prose-sm max-w-none p-6">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {debouncedContent}
      </ReactMarkdown>
    </div>
  );
}
