import React from 'react';
import { Link } from 'react-router-dom';
import { Play, BookOpen, Users, Zap, Eye, Star, Rocket } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative px-4 py-20 sm:px-6 lg:px-8 z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-blue-500 to-green-500 rounded-full mb-6 shadow-lg">
              <Star className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6">
            <span className="gradient-text">
              Algorhythm
            </span>
            <br />
            <span className="text-2xl sm:text-4xl text-gray-300">
              Visualize Your Algorithms
            </span>
          </h1>
          
          <p className="text-lg text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed">
            Master Data Structures and Algorithms through interactive visualizations. 
            Watch algorithms come to life with step-by-step animations and clear explanations.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/visualizer"
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-green-600 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Eye className="w-5 h-5 mr-2" />
              Try Visualizer
            </Link>
            <Link
              to="/problems"
              className="inline-flex items-center px-8 py-3 bg-slate-700 text-gray-200 font-semibold rounded-lg border border-slate-600 hover:bg-slate-600 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <Play className="w-5 h-5 mr-2" />
              Browse Problems
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-4">
            Why Choose Algorhythm?
          </h2>
          <p className="text-center text-gray-400 text-lg mb-12">Simple, effective algorithm learning</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 hover:border-blue-500/50 transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Interactive Visualizations
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Enter your own data and watch algorithms execute step-by-step with beautiful animations and real-time updates.
              </p>
            </div>
            
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 hover:border-green-500/50 transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Clear Explanations
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Understand complex algorithms with detailed explanations and highlighted code for each step.
              </p>
            </div>
            
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 hover:border-purple-500/50 transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Easy to Use
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Simply enter your problem data and select an algorithm to see instant visualizations with playback controls.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 bg-slate-800/30 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mb-4 shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Visualize Your Algorithms?
          </h2>
          
          <p className="text-lg text-gray-400 mb-8 leading-relaxed">
            Enter your own data and watch sorting, searching, and other algorithms come to life with clear visuals.
          </p>
          
          <Link
            to="/visualizer"
            className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-green-600 transition-all duration-300 shadow-lg hover:shadow-xl text-lg"
          >
            <Rocket className="w-5 h-5 mr-2" />
            Start Visualizing
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;