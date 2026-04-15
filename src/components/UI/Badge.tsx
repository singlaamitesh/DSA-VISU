import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'easy' | 'medium' | 'hard' | 'sorting' | 'searching' | 'graph' | 'dp' | 'default' | 'cyan' | 'amber';
  size?: 'sm' | 'md';
  className?: string;
}

const variantStyles: Record<string, string> = {
  easy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  hard: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  sorting: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  searching: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  graph: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  dp: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  default: 'bg-white/5 text-text-secondary border-white/10',
  cyan: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20',
  amber: 'bg-accent-amber/10 text-accent-amber border-accent-amber/20',
};

const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', size = 'sm', className }) => {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full border font-mono font-medium tracking-wide uppercase',
      size === 'sm' ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-xs',
      variantStyles[variant],
      className
    )}>
      {children}
    </span>
  );
};

export default Badge;
