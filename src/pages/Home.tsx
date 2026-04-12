import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, Sparkles, Save, Zap, ArrowRight } from 'lucide-react';
import Card from '../components/UI/Card';
import Badge from '../components/UI/Badge';
import { getAlgorithms, getAlgorithmsByCategory } from '../algorithms/registry';
import { AlgorithmCategory } from '../algorithms/types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.18, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const cardContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.14, delayChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const CATEGORIES: { key: AlgorithmCategory; label: string; color: string; accent: string }[] = [
  { key: 'sorting',   label: 'Sorting',   color: 'text-emerald-400', accent: 'border-emerald-500/40' },
  { key: 'searching', label: 'Searching', color: 'text-blue-400',    accent: 'border-blue-500/40'    },
  { key: 'graph',     label: 'Graph',     color: 'text-purple-400',  accent: 'border-purple-500/40'  },
  { key: 'dp',        label: 'Dynamic Programming', color: 'text-orange-400', accent: 'border-orange-500/40' },
];

const difficultyVariant: Record<string, 'easy' | 'medium' | 'hard'> = {
  Easy: 'easy',
  Medium: 'medium',
  Hard: 'hard',
};

const Home: React.FC = () => {
  const allAlgorithms = getAlgorithms();

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative px-4 pt-24 pb-28 sm:px-6 lg:px-8 overflow-hidden">
        {/* Radial gradient backdrop */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(96,165,250,0.18) 0%, rgba(52,211,153,0.10) 40%, transparent 70%)',
          }}
        />
        {/* Subtle grid pattern */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <motion.div
          className="max-w-4xl mx-auto text-center relative z-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Pill badge */}
          <motion.div variants={itemVariants}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase glass border border-blue-500/30 text-blue-300 mb-8 shadow">
              <Zap className="w-3.5 h-3.5" />
              Interactive Algorithm Visualizer
            </span>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            variants={itemVariants}
            className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-none mb-4"
          >
            <span className="gradient-text">Algorhythm</span>
          </motion.h1>

          <motion.h2
            variants={itemVariants}
            className="text-2xl sm:text-4xl font-bold text-gray-200 mb-6 leading-snug"
          >
            Visualize Algorithms,{' '}
            <span className="gradient-text">Instantly</span>
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Master data structures &amp; algorithms through stunning step-by-step
            animations. Watch sorting, searching, graphs and dynamic programming
            come to life — or describe your own algorithm and let AI build it for you.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/visualizer"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white text-base bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-400 hover:to-emerald-400 shadow-lg hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-0.5"
            >
              <Eye className="w-5 h-5" />
              Try Visualizer
            </Link>
            <Link
              to="/algorithms"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-gray-200 text-base glass border border-slate-600 hover:border-blue-500/50 hover:text-white transition-all duration-300 hover:-translate-y-0.5"
            >
              Browse Algorithms
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── FEATURES GRID ────────────────────────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Everything You Need to{' '}
              <span className="gradient-text">Learn Faster</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Three powerful modes — built-in, AI-generated, and persistent.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={cardContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
          >
            {/* Card 1 */}
            <motion.div variants={cardVariants}>
              <Card hover className="h-full flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-5 shadow-lg">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Built-in Visualizer</h3>
                <p className="text-gray-400 leading-relaxed flex-1">
                  12+ algorithms with step-by-step animations, playback controls, and code highlighting — ready to explore out of the box.
                </p>
              </Card>
            </motion.div>

            {/* Card 2 */}
            <motion.div variants={cardVariants}>
              <Card hover className="h-full flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-5 shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">AI-Powered Custom</h3>
                <p className="text-gray-400 leading-relaxed flex-1">
                  Describe any algorithm and get an instant interactive visualization powered by Gemini — no code required.
                </p>
              </Card>
            </motion.div>

            {/* Card 3 */}
            <motion.div variants={cardVariants}>
              <Card hover className="h-full flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-5 shadow-lg">
                  <Save className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Save &amp; Share</h3>
                <p className="text-gray-400 leading-relaxed flex-1">
                  Save your visualizations, track your history, and download for offline use — your learning journey, preserved.
                </p>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────────────── */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="glass rounded-2xl px-8 py-5 text-center"
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-gray-300 font-medium tracking-wide text-sm sm:text-base">
              <span className="gradient-text font-bold">12+ Algorithms</span>
              <span className="mx-3 text-slate-600">•</span>
              <span className="gradient-text font-bold">4 Categories</span>
              <span className="mx-3 text-slate-600">•</span>
              <span className="text-gray-300">Instant Visualization</span>
              <span className="mx-3 text-slate-600">•</span>
              <span className="text-gray-300">AI-Powered</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── ALGORITHM SHOWCASE ───────────────────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              <span className="gradient-text">12+ Algorithms</span> Across 4 Categories
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Click any algorithm to jump straight into its visualization.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={cardContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
          >
            {CATEGORIES.map(({ key, label, color, accent }) => {
              const algos = getAlgorithmsByCategory(key);
              return (
                <motion.div key={key} variants={cardVariants}>
                  <div className={`glass rounded-2xl p-5 border ${accent} h-full`}>
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant={key}>{label}</Badge>
                      <span className="text-xs text-gray-500">{algos.length} algos</span>
                    </div>
                    <ul className="space-y-2">
                      {algos.map((algo) => (
                        <li key={algo.id} className="flex items-center justify-between gap-2">
                          <Link
                            to={`/visualizer?algorithm=${algo.id}`}
                            className={`text-sm font-medium ${color} hover:underline underline-offset-2 transition-colors`}
                          >
                            {algo.name}
                          </Link>
                          <Badge variant={difficultyVariant[algo.difficulty]}>
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
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group"
            >
              View all {allAlgorithms.length} algorithms
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── CTA SECTION ──────────────────────────────────────────────────── */}
      <section className="px-4 py-24 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(52,211,153,0.12) 0%, transparent 70%)',
          }}
        />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 shadow-lg mb-6">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
              Ready to{' '}
              <span className="gradient-text">Visualize?</span>
            </h2>
            <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto leading-relaxed">
              Pick an algorithm, adjust the input, and watch every step unfold in real time. Learning DSA has never felt this intuitive.
            </p>
            <Link
              to="/visualizer"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-400 hover:to-emerald-400 shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-0.5"
            >
              <Zap className="w-5 h-5" />
              Start Visualizing
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
