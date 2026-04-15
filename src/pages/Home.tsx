import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cpu, Sparkles, BookOpen, ArrowRight, Play } from 'lucide-react';
import Card from '../components/UI/Card';
import Badge from '../components/UI/Badge';
import Button from '../components/UI/Button';
import { getAlgorithms, getAlgorithmsByCategory } from '../algorithms/registry';
import { AlgorithmCategory } from '../algorithms/types';

// ── Animation variants ──────────────────────────────────────────────────────

const heroContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.05 },
  },
};

const heroItem = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerGrid = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

// ── Static data ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Cpu,
    title: '12 Built-in Algorithms',
    description:
      'Sorting, searching, graph traversal, and dynamic programming — all pre-loaded with step-by-step animations and playback controls.',
    iconColor: 'text-accent-cyan',
    iconBg: 'bg-accent-cyan/10 border border-accent-cyan/20',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Generation',
    description:
      'Describe any algorithm in plain English and get an instant interactive visualization powered by Gemini. No code required.',
    iconColor: 'text-accent-amber',
    iconBg: 'bg-accent-amber/10 border border-accent-amber/20',
  },
  {
    icon: BookOpen,
    title: 'Step-by-Step Learning',
    description:
      'Playback controls, synchronized code highlighting, and plain-English explanations for every single step of execution.',
    iconColor: 'text-accent-teal',
    iconBg: 'bg-accent-teal/10 border border-accent-teal/20',
  },
];

const CATEGORIES: {
  key: AlgorithmCategory;
  label: string;
  badgeVariant: 'sorting' | 'searching' | 'graph' | 'dp';
  accentColor: string;
  lineColor: string;
}[] = [
  {
    key: 'sorting',
    label: 'Sorting',
    badgeVariant: 'sorting',
    accentColor: 'border-teal-500/25',
    lineColor: 'text-teal-400',
  },
  {
    key: 'searching',
    label: 'Searching',
    badgeVariant: 'searching',
    accentColor: 'border-cyan-500/25',
    lineColor: 'text-accent-cyan',
  },
  {
    key: 'graph',
    label: 'Graph',
    badgeVariant: 'graph',
    accentColor: 'border-violet-500/25',
    lineColor: 'text-violet-400',
  },
  {
    key: 'dp',
    label: 'Dynamic Programming',
    badgeVariant: 'dp',
    accentColor: 'border-orange-500/25',
    lineColor: 'text-orange-400',
  },
];

const difficultyVariant: Record<string, 'easy' | 'medium' | 'hard'> = {
  Easy: 'easy',
  Medium: 'medium',
  Hard: 'hard',
};

// ── Component ────────────────────────────────────────────────────────────────

const Home: React.FC = () => {
  const allAlgorithms = getAlgorithms();

  return (
    <div className="min-h-screen" style={{ background: '#0a0e1a' }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative px-4 pt-28 pb-32 sm:px-6 lg:px-8 overflow-hidden">
        {/* Radial backdrop — accent-cyan/5 centred */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 55% at 50% 0%, rgba(6,182,212,0.07) 0%, rgba(20,184,166,0.04) 45%, transparent 72%)',
          }}
        />
        {/* Subtle dot grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />

        <motion.div
          className="max-w-4xl mx-auto text-center relative z-10"
          variants={heroContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Pill label */}
          <motion.div variants={heroItem}>
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-mono font-semibold tracking-widest uppercase mb-8"
              style={{
                background: 'rgba(6,182,212,0.08)',
                border: '1px solid rgba(6,182,212,0.22)',
                color: '#06b6d4',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full bg-accent-cyan"
                style={{ boxShadow: '0 0 6px #06b6d4' }}
              />
              Interactive Algorithm Visualizer
            </span>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            variants={heroItem}
            className="text-6xl sm:text-8xl font-extrabold tracking-tight leading-none mb-5"
          >
            <span className="gradient-text">Algorhythm</span>
          </motion.h1>

          {/* Mono subtitle */}
          <motion.p
            variants={heroItem}
            className="font-mono text-xl sm:text-2xl mb-4"
            style={{ color: '#8896b0' }}
          >
            Watch algorithms think.
          </motion.p>

          {/* Tagline */}
          <motion.p
            variants={heroItem}
            className="text-base sm:text-lg max-w-2xl mx-auto mb-11 leading-relaxed"
            style={{ color: '#556480' }}
          >
            Master data structures &amp; algorithms through precise step-by-step
            animations. Sorting, graphs, dynamic programming — or describe your
            own algorithm and let AI build the visualization instantly.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={heroItem}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/visualizer">
              <Button variant="primary" size="lg" icon={<Play className="w-4 h-4" />}>
                Start Visualizing
              </Button>
            </Link>
            <Link to="/algorithms">
              <Button variant="outline" size="lg">
                Browse Algorithms
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────────────── */}
      <section className="px-4 py-0 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            className="surface-1 rounded-xl px-6 py-4 text-center"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="font-mono text-sm tracking-wide" style={{ color: '#556480' }}>
              <span className="text-accent-cyan font-semibold">12 Algorithms</span>
              <span className="mx-3" style={{ color: '#2a3347' }}>•</span>
              <span className="text-accent-teal font-semibold">4 Categories</span>
              <span className="mx-3" style={{ color: '#2a3347' }}>•</span>
              Instant Visualization
              <span className="mx-3" style={{ color: '#2a3347' }}>•</span>
              AI-Powered
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-3" style={{ color: '#e8edf5' }}>
              Built for{' '}
              <span className="gradient-text">deep understanding</span>
            </h2>
            <p className="text-base max-w-md mx-auto" style={{ color: '#8896b0' }}>
              Three modes that take you from exploration to mastery.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
            variants={staggerGrid}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
          >
            {FEATURES.map(({ icon: Icon, title, description, iconColor, iconBg }) => (
              <motion.div key={title} variants={fadeUp}>
                <Card variant="surface-2" hover glow className="h-full flex flex-col gap-4">
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${iconBg}`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base mb-2" style={{ color: '#e8edf5' }}>
                      {title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#8896b0' }}>
                      {description}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── ALGORITHM SHOWCASE ───────────────────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: '#e8edf5' }}>
                Explore the{' '}
                <span className="gradient-text">Collection</span>
              </h2>
              <p className="text-sm" style={{ color: '#556480' }}>
                Click any algorithm to jump straight into its visualization.
              </p>
            </div>
            <Badge variant="cyan" size="md">
              {allAlgorithms.length} algorithms
            </Badge>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
            variants={staggerGrid}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
          >
            {CATEGORIES.map(({ key, label, badgeVariant, accentColor, lineColor }) => {
              const algos = getAlgorithmsByCategory(key);
              return (
                <motion.div key={key} variants={fadeUp}>
                  <div
                    className={`surface-2 rounded-xl p-5 h-full border ${accentColor}`}
                    style={{ borderWidth: '1px' }}
                  >
                    <div className="flex items-center justify-between gap-2 mb-5">
                      <Badge variant={badgeVariant} size="sm">
                        {label}
                      </Badge>
                      <span className="font-mono text-[10px]" style={{ color: '#556480' }}>
                        {algos.length}
                      </span>
                    </div>
                    <ul className="space-y-2.5">
                      {algos.map((algo) => (
                        <li key={algo.id} className="flex items-center justify-between gap-2">
                          <Link
                            to={`/visualizer?algorithm=${algo.id}`}
                            className={`text-xs font-mono font-medium ${lineColor} hover:underline underline-offset-2 transition-colors truncate`}
                          >
                            {algo.name}
                          </Link>
                          <Badge variant={difficultyVariant[algo.difficulty]} size="sm">
                            {algo.difficulty}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div
            className="text-center mt-10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Link
              to="/algorithms"
              className="inline-flex items-center gap-2 text-sm font-mono transition-colors group"
              style={{ color: '#556480' }}
            >
              <span className="group-hover:text-accent-cyan transition-colors">
                View all {allAlgorithms.length} algorithms
              </span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 group-hover:text-accent-cyan transition-all" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="px-4 py-28 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Amber glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 55% 45% at 50% 110%, rgba(245,158,11,0.07) 0%, transparent 68%)',
          }}
        />

        <div className="max-w-2xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="flex flex-col items-center gap-6"
          >
            {/* Terminal prompt decoration */}
            <div
              className="terminal px-5 py-3 text-sm font-mono"
              style={{ color: '#06b6d4' }}
            >
              <span style={{ color: '#556480' }}>$ </span>
              run visualizer
              <span
                className="inline-block w-2 h-4 ml-1 align-middle animate-pulse"
                style={{ background: '#06b6d4' }}
              />
            </div>

            <h2
              className="text-4xl sm:text-5xl font-extrabold leading-tight"
              style={{ color: '#e8edf5' }}
            >
              Ready to{' '}
              <span className="gradient-text-warm">visualize?</span>
            </h2>

            <p className="text-base max-w-md leading-relaxed" style={{ color: '#556480' }}>
              Pick an algorithm, set your input, and watch every single step
              unfold in real time. Learning DSA has never felt this precise.
            </p>

            <Link to="/visualizer">
              <Button variant="primary" size="lg" icon={<Play className="w-4 h-4" />}>
                Start Visualizing
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
