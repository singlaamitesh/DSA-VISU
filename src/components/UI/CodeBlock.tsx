import React, { useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import { cn } from '../../utils/cn';

interface CodeBlockProps { code: string; language?: string; highlightLine?: number; className?: string; title?: string; }

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'javascript', highlightLine, className, title }) => {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) Prism.highlightElement(codeRef.current);
  }, [code, language]);

  const lines = code.split('\n');

  return (
    <div className={cn('terminal overflow-hidden', className)}>
      <div className="terminal-header">
        <div className="terminal-dot bg-accent-rose/80" />
        <div className="terminal-dot bg-accent-amber/80" />
        <div className="terminal-dot bg-emerald-500/80" />
        {title && <span className="ml-3 text-xs text-text-muted font-mono">{title}</span>}
      </div>
      <pre className="p-4 overflow-x-auto scrollbar-thin text-sm leading-6">
        <code ref={codeRef} className={`language-${language}`}>
          {lines.map((line, i) => (
            <div key={i} className={cn(
              'px-3 -mx-3 rounded-sm transition-colors duration-200',
              highlightLine === i + 1 && 'bg-accent-cyan/10 border-l-2 border-accent-cyan'
            )}>
              <span className="inline-block w-8 text-text-muted/40 select-none text-right mr-4 font-mono text-xs">
                {i + 1}
              </span>
              {line || ' '}{'\n'}
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
};

export default CodeBlock;
