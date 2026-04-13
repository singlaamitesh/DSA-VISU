import React, { useState } from 'react';
import { Shuffle } from 'lucide-react';
import Button from '../UI/Button';
import Slider from '../UI/Slider';
import { cn } from '../../utils/cn';
import { VISUALIZER_CONFIG } from '../../config/constants';

interface InputConfiguratorProps {
  category: string;
  onGenerate: (data: unknown) => void;
}

const generateRandomArray = (size: number, max: number): number[] =>
  Array.from({ length: size }, () => Math.floor(Math.random() * max) + 1);

const InputConfigurator: React.FC<InputConfiguratorProps> = ({ category, onGenerate }) => {
  const [arraySize, setArraySize] = useState<number>(VISUALIZER_CONFIG.defaultArraySize);
  const [customInput, setCustomInput] = useState('');
  const [customError, setCustomError] = useState('');

  const handleRandomArray = () => {
    const arr = generateRandomArray(arraySize, VISUALIZER_CONFIG.maxArrayValue);
    setCustomError('');
    onGenerate(arr);
  };

  const handleApplyCustom = () => {
    setCustomError('');
    const parts = customInput.split(',').map((s) => s.trim()).filter(Boolean);
    const nums = parts.map(Number);
    if (nums.some(isNaN)) {
      setCustomError('Please enter comma-separated numbers (e.g. 5, 3, 8, 1)');
      return;
    }
    if (nums.length < 2) {
      setCustomError('Please enter at least 2 numbers');
      return;
    }
    onGenerate(nums);
  };

  if (category === 'graph' || category === 'dp') {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-xs text-slate-500">
          {category === 'graph'
            ? 'Graph algorithms use a predefined sample graph.'
            : 'DP algorithms use a predefined sample input.'}
        </p>
        <Button variant="secondary" size="sm" onClick={() => onGenerate(null)}>
          Use Default Input
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Array size slider */}
      <Slider
        label="Array Size"
        value={arraySize}
        min={5}
        max={VISUALIZER_CONFIG.maxArraySize}
        onChange={setArraySize}
      />

      {/* Random array button */}
      <Button variant="secondary" size="sm" onClick={handleRandomArray}>
        <Shuffle className="w-4 h-4 mr-2" />
        Random Array
      </Button>

      {/* Custom input */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-400">Custom Input (comma-separated)</label>
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder="e.g. 5, 3, 8, 1, 9"
          className={cn(
            'w-full bg-slate-800 border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500',
            customError ? 'border-red-500' : 'border-slate-600'
          )}
        />
        {customError && (
          <p className="text-xs text-red-400">{customError}</p>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleApplyCustom}
          disabled={!customInput.trim()}
          className="mt-1"
        >
          Apply Custom
        </Button>
      </div>
    </div>
  );
};

export default InputConfigurator;
