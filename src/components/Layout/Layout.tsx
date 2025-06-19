import React, { useEffect } from 'react';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  useEffect(() => {
    // Create minimal floating particles
    const createParticles = () => {
      const container = document.createElement('div');
      container.className = 'floating-particles';
      
      for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 15) + 's';
        
        container.appendChild(particle);
      }
      
      document.body.appendChild(container);
    };

    createParticles();

    return () => {
      const particles = document.querySelector('.floating-particles');
      if (particles) {
        particles.remove();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 relative">
      <Header />
      <main className="pt-16 relative z-10">
        {children}
      </main>
    </div>
  );
};

export default Layout;