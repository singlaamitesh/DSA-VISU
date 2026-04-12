import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface Tab { id: string; label: string; icon?: React.ReactNode; }

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className }) => {
  return (
    <div className={cn('flex gap-1 p-1 glass rounded-lg', className)}>
      {tabs.map((tab) => (
        <button key={tab.id} onClick={() => onChange(tab.id)}
          className={cn('relative flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
            activeTab === tab.id ? 'text-white' : 'text-slate-400 hover:text-white')}>
          {activeTab === tab.id && (
            <motion.div layoutId="activeTab" className="absolute inset-0 bg-white/10 rounded-md"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }} />
          )}
          <span className="relative z-10 flex items-center gap-2">{tab.icon}{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default Tabs;
