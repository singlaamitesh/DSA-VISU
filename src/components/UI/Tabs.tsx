import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface Tab { id: string; label: string; icon?: React.ReactNode; count?: number; }

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className }) => {
  return (
    <div className={cn('inline-flex gap-1 p-1 surface-2 rounded-xl', className)}>
      {tabs.map((tab) => (
        <button key={tab.id} onClick={() => onChange(tab.id)}
          className={cn(
            'relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200',
            activeTab === tab.id ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'
          )}>
          {activeTab === tab.id && (
            <motion.div layoutId="activeTab"
              className="absolute inset-0 bg-surface-3 border border-white/10 rounded-lg shadow-card"
              transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }} />
          )}
          <span className="relative z-10 flex items-center gap-2">
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className="bg-accent-cyan/10 text-accent-cyan text-xs font-mono px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
};

export default Tabs;
