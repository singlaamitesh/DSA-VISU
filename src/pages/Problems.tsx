import React, { useState } from 'react';
import { Search, Filter, Clock, Star, Eye } from 'lucide-react';

const Problems: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  const problems = [
    {
      id: 1,
      title: "Binary Search",
      difficulty: "Easy",
      category: "Search",
      description: "Find an element in a sorted array using binary search algorithm with smooth animations.",
      timeComplexity: "O(log n)",
      spaceComplexity: "O(1)",
      icon: "🔍"
    },
    {
      id: 2,
      title: "Quick Sort",
      difficulty: "Medium",
      category: "Sorting",
      description: "Sort an array using the quicksort divide-and-conquer algorithm with visual partitioning.",
      timeComplexity: "O(n log n)",
      spaceComplexity: "O(log n)",
      icon: "⚡"
    },
    {
      id: 3,
      title: "Dijkstra's Algorithm",
      difficulty: "Hard",
      category: "Graph",
      description: "Find shortest paths from source to all vertices in a weighted graph with clear visuals.",
      timeComplexity: "O(V²)",
      spaceComplexity: "O(V)",
      icon: "🗺️"
    },
    {
      id: 4,
      title: "Dynamic Programming - Knapsack",
      difficulty: "Medium",
      category: "Dynamic Programming",
      description: "Solve the 0/1 knapsack problem using dynamic programming with animated table filling.",
      timeComplexity: "O(nW)",
      spaceComplexity: "O(nW)",
      icon: "🎒"
    },
    {
      id: 5,
      title: "Merge Sort",
      difficulty: "Medium",
      category: "Sorting",
      description: "Divide and conquer sorting algorithm with beautiful merge animations.",
      timeComplexity: "O(n log n)",
      spaceComplexity: "O(n)",
      icon: "🔀"
    },
    {
      id: 6,
      title: "BFS Traversal",
      difficulty: "Easy",
      category: "Graph",
      description: "Breadth-first search with level-by-level exploration visualization.",
      timeComplexity: "O(V + E)",
      spaceComplexity: "O(V)",
      icon: "🌊"
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Hard': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Search': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Sorting': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Graph': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Dynamic Programming': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const filteredProblems = problems.filter(problem => {
    const matchesSearch = problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         problem.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = selectedDifficulty === 'all' || problem.difficulty === selectedDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-blue-500 to-green-500 rounded-full mb-6 shadow-lg">
            <Star className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Algorithm Problems
          </h1>
          <p className="text-lg text-gray-400">Explore and visualize data structures and algorithms</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search problems..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
            />
          </div>
          <div className="flex items-center gap-3">
            <Filter className="text-gray-400 w-5 h-5" />
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
            >
              <option value="all">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Problems Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProblems.map((problem) => (
            <div
              key={problem.id}
              className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300 cursor-pointer hover:shadow-xl backdrop-blur-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{problem.icon}</span>
                  <h3 className="text-lg font-semibold text-white">
                    {problem.title}
                  </h3>
                </div>
                <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getDifficultyColor(problem.difficulty)}`}>
                  {problem.difficulty}
                </span>
              </div>
              
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">{problem.description}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-xs text-gray-400">
                  <Clock className="w-4 h-4 mr-2 text-blue-400" />
                  <span className="font-medium">Time:</span>
                  <span className="ml-1">{problem.timeComplexity}</span>
                </div>
                <div className="flex items-center text-xs text-gray-400">
                  <Star className="w-4 h-4 mr-2 text-yellow-400" />
                  <span className="font-medium">Space:</span>
                  <span className="ml-1">{problem.spaceComplexity}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium px-2 py-1 rounded-md border ${getCategoryColor(problem.category)}`}>
                  {problem.category}
                </span>
                <button className="flex items-center text-blue-400 hover:text-blue-300 text-sm font-medium bg-blue-500/20 hover:bg-blue-500/30 px-3 py-1 rounded-md transition-all duration-300">
                  <Eye className="w-4 h-4 mr-1" />
                  Visualize
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredProblems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No problems found matching your criteria.</p>
            <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Problems;