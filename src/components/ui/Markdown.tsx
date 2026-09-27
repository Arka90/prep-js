"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "@/components/ui/CodeBlock";

export function Markdown({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div className={`prose-app text-[15px] ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: ({ children }) => <>{children}</>,
          code: ({ className: cls, children: content }) => {
            const match = /language-(\w+)/.exec(cls ?? "");
            const text = String(content ?? "");
            if (!match && !text.includes("\n")) return <code>{content}</code>;
            return <CodeBlock code={text} language={match?.[1] ?? "javascript"} className="my-3" showLineNumbers={false} />;
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
