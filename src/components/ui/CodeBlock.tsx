"use client";

import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import jsx from "react-syntax-highlighter/dist/esm/languages/prism/jsx";
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";

SyntaxHighlighter.registerLanguage("javascript", javascript);
SyntaxHighlighter.registerLanguage("js", javascript);
SyntaxHighlighter.registerLanguage("jsx", jsx);
SyntaxHighlighter.registerLanguage("tsx", tsx);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("ts", typescript);
SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("bash", bash);

// Colours come from CSS variables, so the same theme works in light and dark.
const theme: Record<string, React.CSSProperties> = {
  'code[class*="language-"]': { color: "var(--code-fg)", fontFamily: "var(--font-mono)" },
  'pre[class*="language-"]': { color: "var(--code-fg)", fontFamily: "var(--font-mono)" },
  comment: { color: "var(--code-comment)", fontStyle: "italic" },
  prolog: { color: "var(--code-comment)" },
  punctuation: { color: "var(--code-punct)" },
  keyword: { color: "var(--code-keyword)" },
  operator: { color: "var(--code-punct)" },
  boolean: { color: "var(--code-number)" },
  number: { color: "var(--code-number)" },
  string: { color: "var(--code-string)" },
  "template-string": { color: "var(--code-string)" },
  char: { color: "var(--code-string)" },
  regex: { color: "var(--code-prop)" },
  function: { color: "var(--code-function)" },
  "class-name": { color: "var(--code-prop)" },
  builtin: { color: "var(--code-prop)" },
  property: { color: "var(--code-prop)" },
  "property-access": { color: "var(--code-fg)" },
  tag: { color: "var(--code-keyword)" },
  "attr-name": { color: "var(--code-prop)" },
  "attr-value": { color: "var(--code-string)" },
  constant: { color: "var(--code-number)" },
};

export function CodeBlock({
  code,
  language = "javascript",
  className = "",
  showLineNumbers = true,
}: {
  code: string;
  language?: string;
  className?: string;
  showLineNumbers?: boolean;
}) {
  return (
    <div className={`overflow-hidden rounded-xl border border-line bg-code ${className}`}>
      <SyntaxHighlighter
        language={language}
        style={theme}
        showLineNumbers={showLineNumbers && code.split("\n").length > 3}
        lineNumberStyle={{ color: "var(--faint)", minWidth: "2.2em", paddingRight: "1em", opacity: 0.6 }}
        customStyle={{ margin: 0, padding: "1rem 1.1rem", background: "transparent", fontSize: "13.5px", lineHeight: 1.65 }}
        codeTagProps={{ style: { fontFamily: "var(--font-mono)" } }}
      >
        {code.replace(/\s+$/, "")}
      </SyntaxHighlighter>
    </div>
  );
}
