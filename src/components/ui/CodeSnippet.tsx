"use client";

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { formatCodeSnippet } from "@/lib/quiz";

interface CodeSnippetProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeSnippet({ 
  code, 
  language = "javascript",
  className = "" 
}: CodeSnippetProps) {
  // Ensure we replace \n literals with actual newlines
  const formattedCode = formatCodeSnippet(code);

  return (
    <div className={`rounded-lg overflow-hidden text-sm ${className}`}>
      <SyntaxHighlighter
        language={language}
        style={atomDark}
        customStyle={{
          margin: 0,
          padding: '1.5rem',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          lineHeight: '1.5',
          backgroundColor: '#111827', // Tailwind gray-900 match
        }}
        wrapLines={true}
        wrapLongLines={true}
      >
        {formattedCode}
      </SyntaxHighlighter>
    </div>
  );
}
