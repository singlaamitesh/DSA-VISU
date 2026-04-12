import React from 'react';
import { AnimationStep } from '../../algorithms/types';
import SortingBars from './SortingBars';
import SearchHighlighter from './SearchHighlighter';
import GraphRenderer from './GraphRenderer';
import DPGrid from './DPGrid';

interface VisualizerCanvasProps {
  step: AnimationStep | null;
  category: string;
}

const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({ step, category }) => {
  if (!step) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
        <div className="text-center">
          <p className="text-slate-400 mb-1">No visualization running</p>
          <p className="text-slate-600 text-xs">Select an algorithm and press Play to start</p>
        </div>
      </div>
    );
  }

  switch (category) {
    case 'sorting':
      return <SortingBars step={step} />;
    case 'searching':
      return <SearchHighlighter step={step} />;
    case 'graph':
      return <GraphRenderer step={step} />;
    case 'dp':
      return <DPGrid step={step} />;
    default:
      return (
        <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
          Unknown category: {category}
        </div>
      );
  }
};

export default VisualizerCanvas;
