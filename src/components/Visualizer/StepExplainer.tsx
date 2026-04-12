import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { AnimationStep } from '../../algorithms/types';
import Badge from '../UI/Badge';

interface StepExplainerProps {
  step: AnimationStep | null;
}

const stepTypeVariant: Record<AnimationStep['type'], string> = {
  compare: 'medium',
  swap: 'hard',
  visit: 'graph',
  fill: 'dp',
  highlight: 'searching',
  done: 'easy',
};

const StepExplainer: React.FC<StepExplainerProps> = ({ step }) => {
  return (
    <div className={cn('glass rounded-lg p-4 min-h-[80px] flex flex-col justify-center')}>
      <AnimatePresence mode="wait">
        {step ? (
          <motion.div
            key={`${step.type}-${step.codeLine}-${step.explanation.slice(0, 20)}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-2"
          >
            <Badge variant={stepTypeVariant[step.type] as any} className="self-start">
              {step.type.toUpperCase()}
            </Badge>
            <p className="text-sm text-slate-300 leading-relaxed">
              {step.explanation}
            </p>
          </motion.div>
        ) : (
          <motion.p
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-slate-500 text-center"
          >
            Step details will appear here during visualization
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StepExplainer;
