import React from 'react';
import { cn } from '../../utils/cn';

interface SliderProps {
  value: number; min?: number; max?: number; step?: number;
  label?: string; onChange: (value: number) => void; className?: string;
}

const Slider: React.FC<SliderProps> = ({ value, min = 0, max = 100, step = 1, label, onChange, className }) => {
  const percentage = ((value - min) / (max - min)) * 100;
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">{label}</span>
          <span className="text-white font-medium">{value}</span>
        </div>
      )}
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-700"
        style={{ background: `linear-gradient(to right, #3b82f6 0%, #22c55e ${percentage}%, #334155 ${percentage}%)` }} />
    </div>
  );
};

export default Slider;
