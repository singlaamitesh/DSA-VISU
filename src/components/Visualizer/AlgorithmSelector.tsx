import React from 'react';
import { cn } from '../../utils/cn';
import { AlgorithmConfig, AlgorithmCategory } from '../../algorithms/types';
import { getAlgorithms } from '../../algorithms/registry';
import Badge from '../UI/Badge';

interface AlgorithmSelectorProps {
  selected: AlgorithmConfig | null;
  onSelect: (alg: AlgorithmConfig) => void;
}

const CATEGORY_LABELS: Record<AlgorithmCategory, string> = {
  sorting: 'SORTING',
  searching: 'SEARCHING',
  graph: 'GRAPH',
  dp: 'DYNAMIC PROGRAMMING',
};

const CATEGORY_ORDER: AlgorithmCategory[] = ['sorting', 'searching', 'graph', 'dp'];

const AlgorithmSelector: React.FC<AlgorithmSelectorProps> = ({ selected, onSelect }) => {
  const algorithms = getAlgorithms();

  const grouped = CATEGORY_ORDER.reduce<Record<AlgorithmCategory, AlgorithmConfig[]>>(
    (acc, cat) => {
      acc[cat] = algorithms.filter((a) => a.category === cat);
      return acc;
    },
    { sorting: [], searching: [], graph: [], dp: [] }
  );

  return (
    <div className="flex flex-col gap-4 overflow-auto">
      {CATEGORY_ORDER.map((category) => {
        const items = grouped[category];
        if (items.length === 0) return null;
        return (
          <div key={category}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
              {CATEGORY_LABELS[category]}
            </p>
            <div className="flex flex-col gap-1">
              {items.map((alg) => {
                const isSelected = selected?.id === alg.id;
                return (
                  <button
                    key={alg.id}
                    onClick={() => onSelect(alg)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left',
                      isSelected
                        ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
                    )}
                  >
                    <span className="font-medium">{alg.name}</span>
                    <Badge
                      variant={alg.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard'}
                    >
                      {alg.difficulty}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AlgorithmSelector;
