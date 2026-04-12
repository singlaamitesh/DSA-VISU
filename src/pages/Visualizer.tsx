import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cpu, Sparkles, Lock, Code } from 'lucide-react';
import Tabs from '../components/UI/Tabs';
import Badge from '../components/UI/Badge';
import Card from '../components/UI/Card';
import CodeBlock from '../components/UI/CodeBlock';
import AlgorithmSelector from '../components/Visualizer/AlgorithmSelector';
import InputConfigurator from '../components/Visualizer/InputConfigurator';
import ControlPanel from '../components/Visualizer/ControlPanel';
import VisualizerCanvas from '../components/Visualizer/VisualizerCanvas';
import StepExplainer from '../components/Visualizer/StepExplainer';
import { useVisualizer } from '../hooks/useVisualizer';
import { useAuth } from '../hooks/useAuth';
import { getAlgorithmById } from '../algorithms/registry';

const modeTabs = [
  { id: 'builtin', label: 'Built-in', icon: <Cpu className="w-4 h-4" /> },
  { id: 'ai', label: 'AI Custom', icon: <Sparkles className="w-4 h-4" /> },
];

const Visualizer: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('builtin');

  const {
    algorithm,
    steps,
    currentStep,
    speed,
    isPlaying,
    currentStepData,
    setAlgorithm,
    setData,
    generateSteps,
    play,
    pause,
    stepForward,
    stepBackward,
    reset,
    setSpeed,
  } = useVisualizer();

  const { isAuthenticated } = useAuth();

  // Auto-select algorithm from URL param on mount
  useEffect(() => {
    const algId = searchParams.get('algorithm');
    if (algId) {
      const found = getAlgorithmById(algId);
      if (found) {
        setAlgorithm(found);
        // generateSteps needs data to be set first; setAlgorithm sets defaultInput
        // Use a tick delay so the store state settles
        setTimeout(() => {
          generateSteps();
        }, 0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAlgorithmSelect = (alg: typeof algorithm) => {
    if (!alg) return;
    setAlgorithm(alg);
    // After setAlgorithm the store sets data = alg.defaultInput; generate immediately
    setTimeout(() => {
      generateSteps();
    }, 0);
  };

  const handleInputGenerate = (newData: unknown) => {
    setData(newData ?? algorithm?.defaultInput);
    setTimeout(() => {
      generateSteps();
    }, 0);
  };

  const handlePlay = () => {
    if (steps.length === 0) {
      generateSteps();
      // Give the store a tick to populate steps before playing
      setTimeout(() => {
        play();
      }, 0);
    } else {
      play();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white">
      {/* Page header */}
      <div className="border-b border-white/5 px-4 py-4 md:px-8">
        <div className="max-w-screen-2xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white">Algorithm Visualizer</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Step through algorithms with interactive animations
            </p>
          </div>
          <Tabs tabs={modeTabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden px-4 py-4 md:px-8">
        <div className="max-w-screen-2xl mx-auto h-full">

          {/* ─── BUILT-IN TAB ─── */}
          {activeTab === 'builtin' && (
            <motion.div
              key="builtin"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-4 h-full"
            >
              {/* Main 3-column layout */}
              <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">

                {/* Left sidebar */}
                <div className="w-full lg:w-72 flex flex-col gap-4 overflow-y-auto flex-shrink-0">
                  {/* Algorithm selector */}
                  <Card className="p-4 flex flex-col gap-3">
                    <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Algorithm
                    </h2>
                    <AlgorithmSelector
                      selected={algorithm}
                      onSelect={handleAlgorithmSelect}
                    />
                  </Card>

                  {/* Input configurator */}
                  {algorithm && (
                    <Card className="p-4 flex flex-col gap-3">
                      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Input
                      </h2>
                      <InputConfigurator
                        category={algorithm.category}
                        onGenerate={handleInputGenerate}
                      />
                    </Card>
                  )}

                  {/* Control panel */}
                  <ControlPanel
                    isPlaying={isPlaying}
                    speed={speed}
                    currentStep={currentStep}
                    totalSteps={steps.length}
                    onPlay={handlePlay}
                    onPause={pause}
                    onStepForward={stepForward}
                    onStepBackward={stepBackward}
                    onReset={reset}
                    onSpeedChange={setSpeed}
                  />
                </div>

                {/* Center: canvas */}
                <div className="flex-1 flex flex-col gap-4 min-w-0">
                  <Card className="flex-1 flex flex-col p-4 min-h-[300px]">
                    {algorithm ? (
                      <>
                        {/* Algorithm title + badges */}
                        <div className="flex items-center gap-2 flex-wrap mb-4">
                          <h2 className="text-base font-semibold text-white">{algorithm.name}</h2>
                          <Badge variant={algorithm.category}>{algorithm.category}</Badge>
                          <Badge variant={algorithm.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard'}>
                            {algorithm.difficulty}
                          </Badge>
                        </div>
                        <div className="flex-1 min-h-[260px]">
                          <VisualizerCanvas
                            step={currentStepData}
                            category={algorithm.category}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <Code className="w-7 h-7 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-slate-300 font-medium">Select an algorithm to begin</p>
                          <p className="text-slate-500 text-sm mt-1">
                            Choose from the left panel to start the visualization
                          </p>
                        </div>
                      </div>
                    )}
                  </Card>
                </div>

                {/* Right sidebar: code + metadata */}
                {algorithm && (
                  <div className="w-full lg:w-80 flex flex-col gap-4 flex-shrink-0 overflow-y-auto">
                    {/* Complexity badges */}
                    <Card className="p-4 flex flex-col gap-3">
                      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Complexity
                      </h2>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">Time</span>
                          <Badge variant="medium">{algorithm.timeComplexity}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">Space</span>
                          <Badge variant="graph">{algorithm.spaceComplexity}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">Step</span>
                          <Badge variant="default">
                            {steps.length > 0
                              ? `${currentStep + 1} / ${steps.length}`
                              : '— / —'}
                          </Badge>
                        </div>
                      </div>
                      {algorithm.description && (
                        <p className="text-xs text-slate-500 leading-relaxed border-t border-white/5 pt-3 mt-1">
                          {algorithm.description}
                        </p>
                      )}
                    </Card>

                    {/* Code block */}
                    <Card className="p-0 overflow-hidden flex flex-col">
                      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                        <Code className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Code
                        </span>
                      </div>
                      <div className="overflow-auto max-h-[420px]">
                        <CodeBlock
                          code={algorithm.code}
                          language="javascript"
                          highlightLine={currentStepData?.codeLine}
                        />
                      </div>
                    </Card>
                  </div>
                )}
              </div>

              {/* Bottom: step explainer */}
              <StepExplainer step={currentStepData} />
            </motion.div>
          )}

          {/* ─── AI CUSTOM TAB ─── */}
          {activeTab === 'ai' && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-center justify-center py-24"
            >
              {isAuthenticated ? (
                <div className="text-center flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-purple-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">AI Custom mode</h2>
                  <p className="text-slate-400 text-sm max-w-sm">
                    AI-powered custom algorithm generation is coming soon. Stay tuned!
                  </p>
                  <Badge variant="dp">Coming Soon</Badge>
                </div>
              ) : (
                <Card className="flex flex-col items-center gap-5 max-w-sm w-full text-center">
                  <div className="w-14 h-14 rounded-full bg-slate-700/50 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-white mb-1">
                      Sign in to use AI Custom mode
                    </h2>
                    <p className="text-sm text-slate-400">
                      Create an account or sign in to unlock AI-generated algorithm visualizations.
                    </p>
                  </div>
                  <Link
                    to="/auth"
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
                  >
                    Sign In
                  </Link>
                </Card>
              )}
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Visualizer;
