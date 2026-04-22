import React, { useMemo } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import { cn } from '../../utils/cn';

interface CodeBlockProps {
  code: string;
  language?: string;
  highlightLine?: number;
  className?: string;
  title?: string;
}

type Token = string | { type: string; content: Token | Token[] };

function renderToken(token: Token, key: React.Key): React.ReactNode {
  if (typeof token === 'string') return token;
  const { type, content } = token;
  const className = `token ${type}`;
  if (Array.isArray(content)) {
    return (
      <span key={key} className={className}>
        {content.map((t, i) => renderToken(t, i))}
      </span>
    );
  }
  return (
    <span key={key} className={className}>
      {renderToken(content, 0)}
    </span>
  );
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  code, language = 'javascript', highlightLine, className, title,
}) => {
  // Tokenize per line so React controls every node; no DOM mutation from Prism.
  const tokenizedLines = useMemo(() => {
    const grammar = Prism.languages[language] || Prism.languages.javascript;
    return code.split('\n').map((line) =>
      Prism.tokenize(line, grammar) as Token[]
    );
  }, [code, language]);

  return (
    <div className={cn('terminal overflow-hidden', className)}>
      <div className="terminal-header">
        <div className="terminal-dot bg-accent-rose/80" />
        <div className="terminal-dot bg-accent-amber/80" />
        <div className="terminal-dot bg-emerald-500/80" />
        {title && <span className="ml-3 text-xs text-text-muted font-mono">{title}</span>}
      </div>
      <pre className={`p-4 overflow-x-auto scrollbar-thin text-sm leading-6 language-${language}`}>
        <code className={`language-${language}`}>
          {tokenizedLines.map((tokens, i) => (
            <div
              key={i}
              className={cn(
                'flex px-3 -mx-3 rounded-sm transition-colors duration-200',
                highlightLine === i + 1 && 'bg-accent-cyan/10 border-l-2 border-accent-cyan'
              )}
            >
              <span className="inline-block w-8 text-text-muted/40 select-none text-right mr-4 font-mono text-xs shrink-0">
                {i + 1}
              </span>
              <span className="flex-1 whitespace-pre">
                {tokens.length === 0
                  ? ' '
                  : tokens.map((token, j) => renderToken(token, j))}
              </span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
};

export default CodeBlock;
