import React from 'react';
import { cn } from '../../utils/cn';

interface SliderProps {
  value: number; min?: number; max?: number; step?: number;
  label?: string; onChange: (value: number) => void; className?: string;
}

const Slider: React.FC<SliderProps> = ({ value, min = 0, max = 100, step = 1, label, onChange, className }) => {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      {label && (
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">{label}</span>
          <span className="text-sm font-mono font-semibold text-accent-cyan">{value}</span>
        </div>
      )}
      <div className="relative">
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-surface-3
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-cyan
                     [&::-webkit-slider-thumb]:shadow-glow-cyan [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
          style={{
            background: `linear-gradient(to right, #06b6d4 0%, #14b8a6 ${pct}%, #1c2438 ${pct}%)`,
          }} />
      </div>
    </div>
  );
};

export default Slider;
