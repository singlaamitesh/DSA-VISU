import React, { useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import { cn } from '../../utils/cn';

interface CodeBlockProps { code: string; language?: string; highlightLine?: number; className?: string; }

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'javascript', highlightLine, className }) => {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) Prism.highlightElement(codeRef.current);
  }, [code, language]);

  const lines = code.split('\n');

  return (
    <div className={cn('rounded-lg overflow-hidden text-sm', className)}>
      <pre className="bg-slate-900/80 p-4 overflow-x-auto scrollbar-thin">
        <code ref={codeRef} className={`language-${language}`}>
          {lines.map((line, i) => (
            <div key={i} className={cn('px-2 -mx-2', highlightLine === i + 1 && 'bg-blue-500/20 border-l-2 border-blue-400')}>
              <span className="inline-block w-8 text-slate-600 select-none text-right mr-4">{i + 1}</span>
              {line || ' '}{'\n'}
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
};

export default CodeBlock;
