import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { AnimationStep } from '../../algorithms/types';

interface SortingBarsProps {
  step: AnimationStep | null;
  maxValue?: number;
}

const getBarColor = (
  index: number,
  step: AnimationStep | null,
): string => {
  if (!step) return 'bg-blue-500';
  const { type, indices } = step;
  if (!indices.includes(index)) {
    if (type === 'done') return 'bg-green-500';
    return 'bg-blue-500';
  }
  switch (type) {
    case 'compare':
      return 'bg-yellow-400';
    case 'swap':
      return 'bg-red-400';
    case 'highlight':
      return 'bg-purple-400';
    case 'done':
      return 'bg-green-500';
    default:
      return 'bg-blue-500';
  }
};

const SortingBars: React.FC<SortingBarsProps> = ({ step, maxValue = 100 }) => {
  const data = step?.data as number[] | null;
  const values = data && Array.isArray(data) ? data : [];

  if (values.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
        No data to display
      </div>
    );
  }

  return (
    <div className="flex items-end gap-1 h-64 w-full px-2">
      {values.map((value, index) => {
        const heightPercent = (value / maxValue) * 100;
        const colorClass = getBarColor(index, step);

        return (
          <motion.div
            key={index}
            layout
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn('relative flex-1 rounded-t group cursor-pointer', colorClass)}
            style={{ height: `${heightPercent}%` }}
          >
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-white bg-slate-800 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
              {value}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};

export default SortingBars;
