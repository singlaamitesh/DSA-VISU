import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { AnimationStep, DPTableData } from '../../algorithms/types';

interface DPGridProps {
  step: AnimationStep | null;
}

const DPGrid: React.FC<DPGridProps> = ({ step }) => {
  const data = step?.data as DPTableData | null;

  if (!data || !data.table || data.table.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
        No DP table data to display
      </div>
    );
  }

  const { table, rows, cols, highlightCell } = data;

  return (
    <div className="overflow-auto max-h-72">
      <table className="border-collapse text-xs">
        <thead>
          <tr>
            <th className="w-12 h-10 bg-slate-800/50" />
            {cols.map((col, ci) => (
              <th
                key={ci}
                className="w-12 h-10 text-center text-slate-400 font-medium bg-slate-800/50 border border-slate-700/50 px-1"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.map((row, ri) => (
            <tr key={ri}>
              <td className="w-12 h-10 text-center text-slate-400 font-medium bg-slate-800/50 border border-slate-700/50 px-1">
                {rows[ri] ?? ri}
              </td>
              {row.map((cell, ci) => {
                const isHighlighted =
                  highlightCell?.[0] === ri && highlightCell?.[1] === ci;
                const isFilled = cell !== 0 && cell !== undefined;

                return (
                  <td key={ci} className="border border-slate-700/50 p-0">
                    <motion.div
                      className={cn(
                        'w-12 h-10 flex items-center justify-center font-mono font-medium',
                        isHighlighted
                          ? 'bg-blue-500/30 text-blue-300'
                          : isFilled
                          ? 'bg-slate-700/50 text-white'
                          : 'text-slate-500'
                      )}
                      animate={
                        isHighlighted
                          ? { scale: [1, 1.08, 1] }
                          : { scale: 1 }
                      }
                      transition={
                        isHighlighted
                          ? { duration: 0.6, repeat: Infinity, repeatType: 'loop' }
                          : { duration: 0.2 }
                      }
                    >
                      {cell ?? ''}
                    </motion.div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DPGrid;
