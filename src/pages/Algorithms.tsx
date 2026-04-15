import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, HardDrive, ArrowRight } from 'lucide-react';
import Card from '../components/UI/Card';
import Badge from '../components/UI/Badge';
import Tabs from '../components/UI/Tabs';
import { getAlgorithms } from '../algorithms/registry';
import { AlgorithmConfig } from '../algorithms/types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
  exit: { opacity: 0 },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 },
  },
};

const CATEGORY_ORDER = ['all', 'sorting', 'searching', 'graph', 'dp'] as const;

const Algorithms: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  const allAlgorithms = useMemo(() => getAlgorithms(), []);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allAlgorithms.length };
    for (const algo of allAlgorithms) {
      counts[algo.category] = (counts[algo.category] ?? 0) + 1;
    }
    return counts;
  }, [allAlgorithms]);

  const categoryTabs = useMemo(() =>
    CATEGORY_ORDER.map((id) => ({
      id,
      label:
        id === 'all' ? 'All' :
        id === 'dp' ? 'Dynamic Prog.' :
        id.charAt(0).toUpperCase() + id.slice(1),
      count: categoryCounts[id] ?? 0,
    })),
    [categoryCounts]
  );

  const filteredAlgorithms = useMemo(() => {
    return allAlgorithms.filter((algo: AlgorithmConfig) => {
      const matchesCategory =
        selectedCategory === 'all' || algo.category === selectedCategory;
      const matchesSearch =
        searchTerm === '' ||
        algo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        algo.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDifficulty =
        selectedDifficulty === 'all' ||
        algo.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();
      return matchesCategory && matchesSearch && matchesDifficulty;
    });
  }, [allAlgorithms, selectedCategory, searchTerm, selectedDifficulty]);

  const filterKey = `${selectedCategory}-${searchTerm}-${selectedDifficulty}`;

  return (
    <div className="min-h-screen" style={{ background: '#0a0e1a' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* ── Page Header ── */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-3xl font-bold text-text-primary">
              Algorithm{' '}
              <span className="gradient-text">Collection</span>
            </h1>
            <Badge variant="cyan" size="md">{allAlgorithms.length}</Badge>
          </div>
          <p className="text-text-secondary text-base">
            Explore, filter, and step through {allAlgorithms.length} classic algorithms — sorted, visualized, explained.
          </p>
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col gap-4 mb-8">
          {/* Category tabs */}
          <Tabs
            tabs={categoryTabs}
            activeTab={selectedCategory}
            onChange={setSelectedCategory}
            className="flex-wrap"
          />

          {/* Search + Difficulty row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Search algorithms…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full surface-2 rounded-lg pl-10 pr-4 py-2.5 text-text-primary placeholder-text-muted text-sm
                           focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/30
                           transition-all duration-200"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>

            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="surface-2 rounded-lg px-4 py-2.5 text-text-primary text-sm
                         focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/30
                         transition-all duration-200 cursor-pointer appearance-none"
              style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#151b2e' }}
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* ── Result count ── */}
        <p className="text-text-muted text-xs font-mono mb-6 tracking-wide uppercase">
          {filteredAlgorithms.length} algorithm{filteredAlgorithms.length !== 1 ? 's' : ''} found
        </p>

        {/* ── Grid ── */}
        <AnimatePresence mode="wait">
          {filteredAlgorithms.length > 0 ? (
            <motion.div
              key={filterKey}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {filteredAlgorithms.map((algo: AlgorithmConfig) => (
                <motion.div key={algo.id} variants={cardVariants} layout>
                  <Card variant="surface-2" hover glow className="flex flex-col h-full p-5 gap-0">
                    {/* Name */}
                    <h2 className="text-base font-semibold text-text-primary mb-3 leading-snug">
                      {algo.name}
                    </h2>

                    {/* Difficulty + Category badges */}
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <Badge variant={algo.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard'}>
                        {algo.difficulty}
                      </Badge>
                      <Badge variant={algo.category as 'sorting' | 'searching' | 'graph' | 'dp'}>
                        {algo.category === 'dp'
                          ? 'Dynamic Prog.'
                          : algo.category.charAt(0).toUpperCase() + algo.category.slice(1)}
                      </Badge>
                    </div>

                    {/* Complexity */}
                    <div className="flex items-center gap-4 mb-4">
                      <span className="flex items-center gap-1.5 text-xs font-mono text-text-muted">
                        <Clock className="w-3 h-3 text-accent-cyan flex-shrink-0" />
                        {algo.timeComplexity}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-mono text-text-muted">
                        <HardDrive className="w-3 h-3 text-accent-teal flex-shrink-0" />
                        {algo.spaceComplexity}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-text-secondary text-sm leading-relaxed flex-1 mb-5 line-clamp-2">
                      {algo.description}
                    </p>

                    {/* Visualize link */}
                    <Link
                      to={`/visualizer?algorithm=${algo.id}`}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-accent-cyan/30
                                 text-accent-cyan text-sm font-medium self-start
                                 hover:bg-accent-cyan/10 hover:border-accent-cyan/50
                                 transition-all duration-200"
                    >
                      Visualize
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-28"
            >
              <p className="text-text-muted text-base">
                No algorithms match — try adjusting your filters.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Algorithms;
