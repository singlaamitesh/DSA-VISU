import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { AnimationStep } from '../../algorithms/types';

interface SearchHighlighterProps {
  step: AnimationStep | null;
}

const SearchHighlighter: React.FC<SearchHighlighterProps> = ({ step }) => {
  const data = step?.data as number[] | null;
  const values = data && Array.isArray(data) ? data : [];

  if (values.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
        No data to display
      </div>
    );
  }

  const activeIndex = step?.indices[0] ?? -1;
  const stepType = step?.type;
  const metadata = step?.metadata as Record<string, number> | undefined;
  const low = metadata?.low ?? 0;
  const high = metadata?.high ?? values.length - 1;

  const getCellStyle = (index: number) => {
    const isActive = index === activeIndex;
    const isFound = isActive && stepType === 'highlight';
    const isEliminated = (metadata?.low !== undefined || metadata?.high !== undefined)
      && (index < low || index > high);

    if (isFound) return 'bg-green-500/30 border-green-500 text-green-300';
    if (isActive) return 'bg-yellow-500/30 border-yellow-500 text-yellow-300';
    if (isEliminated) return 'opacity-40 bg-slate-700 border-slate-600 text-slate-500';
    return 'bg-slate-700 border-slate-600 text-slate-300';
  };

  return (
    <div className="flex flex-wrap gap-2 p-2 max-h-64 overflow-auto">
      {values.map((value, index) => {
        const isActive = index === activeIndex;
        const cellClass = getCellStyle(index);

        return (
          <motion.div
            key={index}
            animate={{ scale: isActive ? 1.1 : 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={cn(
              'w-14 h-14 flex flex-col items-center justify-center rounded-lg border text-xs font-medium',
              cellClass
            )}
          >
            <span className="font-bold text-sm">{value}</span>
            <span className="text-[10px] opacity-60">{index}</span>
          </motion.div>
        );
      })}
    </div>
  );
};

export default SearchHighlighter;
