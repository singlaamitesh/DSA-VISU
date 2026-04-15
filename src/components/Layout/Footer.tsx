import React from 'react';
import { Github } from 'lucide-react';
import { APP_CONFIG } from '../../config/constants';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/[0.06] py-8 px-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
          <span className="font-mono font-bold text-text-primary">{APP_CONFIG.name}</span>
          <span className="hidden sm:inline text-text-muted text-sm">—</span>
          <span className="text-text-muted text-sm">{APP_CONFIG.description}</span>
        </div>
        <a
          href={APP_CONFIG.repository}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-text-muted hover:text-text-secondary transition-colors duration-200 text-sm"
        >
          <Github className="w-4 h-4 shrink-0" />
          <span>GitHub</span>
        </a>
      </div>
    </footer>
  );
};

export default Footer;
