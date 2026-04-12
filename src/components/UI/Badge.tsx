import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'easy' | 'medium' | 'hard' | 'sorting' | 'searching' | 'graph' | 'dp' | 'default';
  className?: string;
}

const variantStyles: Record<string, string> = {
  easy: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  hard: 'bg-red-500/20 text-red-400 border-red-500/30',
  sorting: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  searching: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  graph: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  dp: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  default: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className }) => {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border', variantStyles[variant], className)}>
      {children}
    </span>
  );
};

export default Badge;
