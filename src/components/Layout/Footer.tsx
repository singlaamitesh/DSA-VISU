import React from 'react';
import { Github, Code } from 'lucide-react';
import { APP_CONFIG } from '../../config/constants';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800 py-8 px-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Code className="w-4 h-4" />
          <span>{APP_CONFIG.name} — Interactive Algorithm Visualizer</span>
        </div>
        <a href={APP_CONFIG.repository} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
          <Github className="w-4 h-4" />
          <span>GitHub</span>
        </a>
      </div>
    </footer>
  );
};

export default Footer;
