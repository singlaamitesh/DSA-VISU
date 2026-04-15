import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps { children: React.ReactNode; }

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-surface-0 flex flex-col relative">
      <Header />
      <main className="pt-16 flex-1 relative z-10">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
