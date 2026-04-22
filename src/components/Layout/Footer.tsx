import React from 'react';
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
        <span className="text-text-muted text-xs font-mono">v{APP_CONFIG.version}</span>
      </div>
    </footer>
  );
};

export default Footer;
