import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cpu, Sparkles, Lock, Code } from 'lucide-react';
import Tabs from '../components/UI/Tabs';
import Badge from '../components/UI/Badge';
import Card from '../components/UI/Card';
import CodeBlock from '../components/UI/CodeBlock';
import AICustomMode from '../components/Visualizer/AICustomMode';
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

const tabAnim = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25 },
};

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
        setTimeout(() => { generateSteps(); }, 0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAlgorithmSelect = (alg: typeof algorithm) => {
    if (!alg) return;
    setAlgorithm(alg);
    setTimeout(() => { generateSteps(); }, 0);
  };

  const handleInputGenerate = (newData: unknown) => {
    setData(newData ?? algorithm?.defaultInput);
    setTimeout(() => { generateSteps(); }, 0);
  };

  const handlePlay = () => {
    if (steps.length === 0) {
      generateSteps();
      setTimeout(() => { play(); }, 0);
    } else {
      play();
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0e1a' }}>

      {/* ── Page header ── */}
      <div className="border-b border-white/5 px-4 py-4 md:px-8">
        <div className="max-w-screen-2xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-text-primary leading-tight">
              Algorithm{' '}
              <span className="gradient-text">Visualizer</span>
            </h1>
            <p className="text-xs text-text-muted mt-0.5 font-mono">
              Step through algorithms with interactive animations
            </p>
          </div>
          <Tabs tabs={modeTabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 px-4 py-5 md:px-8 overflow-hidden">
        <div className="max-w-screen-2xl mx-auto h-full">

          {/* ─────────────────── BUILT-IN TAB ─────────────────── */}
          {activeTab === 'builtin' && (
            <motion.div key="builtin" {...tabAnim} className="flex flex-col gap-4">

              {/* Main layout: sidebar + canvas + code */}
              <div className="flex flex-col lg:flex-row gap-4">

                {/* ── Left sidebar (lg:w-80) ── */}
                <div className="w-full lg:w-80 flex flex-col gap-4 flex-shrink-0">
                  <Card variant="surface-1" className="p-4">
                    <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-3 font-mono">
                      Algorithm
                    </p>
                    <AlgorithmSelector
                      selected={algorithm}
                      onSelect={handleAlgorithmSelect}
                    />
                  </Card>

                  {algorithm && (
                    <Card variant="surface-1" className="p-4">
                      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-3 font-mono">
                        Input
                      </p>
                      <InputConfigurator
                        category={algorithm.category}
                        onGenerate={handleInputGenerate}
                      />
                    </Card>
                  )}

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

                {/* ── Right area (flex-1) ── */}
                <div className="flex-1 flex flex-col gap-4 min-w-0">

                  {algorithm ? (
                    <>
                      {/* Algorithm name + badges + complexity */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-base font-semibold text-text-primary">
                          {algorithm.name}
                        </h2>
                        <Badge
                          variant={algorithm.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard'}
                        >
                          {algorithm.difficulty}
                        </Badge>
                        <Badge
                          variant={algorithm.category as 'sorting' | 'searching' | 'graph' | 'dp'}
                        >
                          {algorithm.category === 'dp'
                            ? 'Dynamic Prog.'
                            : algorithm.category.charAt(0).toUpperCase() + algorithm.category.slice(1)}
                        </Badge>
                        <span className="text-xs font-mono text-text-muted ml-auto">
                          T: {algorithm.timeComplexity} &nbsp;|&nbsp; S: {algorithm.spaceComplexity}
                        </span>
                      </div>

                      {/* Visualizer canvas */}
                      <Card variant="surface-2" className="p-4 min-h-[320px] flex flex-col">
                        <div className="flex-1 min-h-[280px]">
                          <VisualizerCanvas
                            step={currentStepData}
                            category={algorithm.category}
                          />
                        </div>
                      </Card>

                      {/* Step explainer */}
                      <StepExplainer step={currentStepData} />

                      {/* Code block */}
                      <CodeBlock
                        code={algorithm.code}
                        language="javascript"
                        title={algorithm.name}
                        highlightLine={currentStepData?.codeLine}
                      />
                    </>
                  ) : (
                    <Card variant="surface-2" className="flex-1 flex flex-col items-center justify-center min-h-[420px] gap-4 text-center">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center"
                           style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)' }}>
                        <Code className="w-7 h-7 text-accent-cyan" />
                      </div>
                      <div>
                        <p className="text-text-primary font-medium">Select an algorithm to begin</p>
                        <p className="text-text-muted text-sm mt-1">
                          Choose from the left panel to start the visualization
                        </p>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ─────────────────── AI CUSTOM TAB ─────────────────── */}
          {activeTab === 'ai' && (
            <motion.div key="ai" {...tabAnim}>
              {isAuthenticated ? (
                <AICustomMode />
              ) : (
                <div className="flex items-center justify-center py-24">
                  <Card variant="surface-1" className="flex flex-col items-center gap-5 max-w-sm w-full text-center p-8">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center"
                         style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <Lock className="w-6 h-6 text-text-muted" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-text-primary mb-2">
                        Sign in to access AI mode
                      </h2>
                      <p className="text-sm text-text-secondary leading-relaxed">
                        Create an account or sign in to unlock AI-generated algorithm visualizations.
                      </p>
                    </div>
                    <Link
                      to="/login"
                      className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-semibold
                                 bg-gradient-to-r from-accent-cyan to-accent-teal text-surface-0
                                 hover:shadow-glow-cyan transition-all duration-200"
                    >
                      Sign In
                    </Link>
                  </Card>
                </div>
              )}
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Visualizer;
