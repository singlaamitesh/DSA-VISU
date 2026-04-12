import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Clock, HardDrive, ArrowRight, BookOpen } from 'lucide-react';
import Card from '../components/UI/Card';
import Badge from '../components/UI/Badge';
import Tabs from '../components/UI/Tabs';
import { getAlgorithms } from '../algorithms/registry';
import { AlgorithmConfig } from '../algorithms/types';

const categoryTabs = [
  { id: 'all', label: 'All' },
  { id: 'sorting', label: 'Sorting' },
  { id: 'searching', label: 'Searching' },
  { id: 'graph', label: 'Graph' },
  { id: 'dp', label: 'Dynamic Programming' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

const Algorithms: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  const allAlgorithms = useMemo(() => getAlgorithms(), []);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-blue-500 to-green-500 rounded-full shadow-lg">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold gradient-text">Algorithm Catalog</h1>
        </div>
        <p className="text-gray-400 text-lg mb-10">
          Explore and visualize 12+ algorithms across 4 categories
        </p>

        {/* Filtering Controls */}
        <div className="flex flex-col gap-4 mb-8">
          {/* Category Tabs */}
          <Tabs
            tabs={categoryTabs}
            activeTab={selectedCategory}
            onChange={setSelectedCategory}
            className="flex-wrap"
          />

          {/* Search + Difficulty Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search algorithms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
              />
            </div>

            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 cursor-pointer"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Count */}
        <p className="text-slate-400 text-sm mb-6">
          {filteredAlgorithms.length} algorithm{filteredAlgorithms.length !== 1 ? 's' : ''}
        </p>

        {/* Algorithm Cards Grid */}
        {filteredAlgorithms.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            key={`${selectedCategory}-${searchTerm}-${selectedDifficulty}`}
          >
            {filteredAlgorithms.map((algo: AlgorithmConfig) => (
              <motion.div key={algo.id} variants={cardVariants}>
                <Card hover={true} className="flex flex-col h-full">
                  {/* Name */}
                  <h2 className="text-lg font-semibold text-white mb-3">{algo.name}</h2>

                  {/* Badges */}
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <Badge variant={algo.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard'}>
                      {algo.difficulty}
                    </Badge>
                    <Badge variant={algo.category as 'sorting' | 'searching' | 'graph' | 'dp'}>
                      {algo.category === 'dp' ? 'Dynamic Programming' : algo.category.charAt(0).toUpperCase() + algo.category.slice(1)}
                    </Badge>
                  </div>

                  {/* Complexity */}
                  <div className="flex items-center gap-4 mb-4 text-sm text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      {algo.timeComplexity}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                      {algo.spaceComplexity}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-slate-400 text-sm leading-relaxed flex-1 mb-5 line-clamp-3">
                    {algo.description}
                  </p>

                  {/* Visualize Button */}
                  <Link
                    to={`/visualizer?algorithm=${algo.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-green-500/20 border border-blue-500/30 text-blue-300 rounded-lg hover:from-blue-500/30 hover:to-green-500/30 hover:text-blue-200 transition-all duration-200 text-sm font-medium self-start"
                  >
                    Visualize
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="flex items-center justify-center py-24">
            <p className="text-slate-400 text-lg">
              No algorithms found. Try adjusting your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Algorithms;
