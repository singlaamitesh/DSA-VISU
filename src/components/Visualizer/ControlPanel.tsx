import React from 'react';
import { Play, Pause, SkipForward, SkipBack, RotateCcw } from 'lucide-react';
import Button from '../UI/Button';
import Slider from '../UI/Slider';
import { cn } from '../../utils/cn';

interface ControlPanelProps {
  isPlaying: boolean;
  speed: number;
  currentStep: number;
  totalSteps: number;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  isPlaying,
  speed,
  currentStep,
  totalSteps,
  onPlay,
  onPause,
  onStepForward,
  onStepBackward,
  onReset,
  onSpeedChange,
}) => {
  return (
    <div className={cn('glass rounded-lg p-4 flex flex-col gap-4')}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Playback buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onStepBackward}
            disabled={currentStep <= 0}
            title="Step Backward"
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={isPlaying ? onPause : onPlay}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onStepForward}
            disabled={currentStep >= totalSteps - 1}
            title="Step Forward"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* Step counter */}
        <span className="text-sm text-slate-400 font-mono">
          Step{' '}
          <span className="text-white font-semibold">{currentStep}</span>
          {' '}of{' '}
          <span className="text-white font-semibold">{totalSteps}</span>
        </span>
      </div>

      {/* Speed slider */}
      <Slider
        label="Speed"
        value={speed}
        min={1}
        max={100}
        onChange={onSpeedChange}
      />
    </div>
  );
};

export default ControlPanel;
