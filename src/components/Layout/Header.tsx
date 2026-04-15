import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/algorithms', label: 'Algorithms' },
  { to: '/visualizer', label: 'Visualizer' },
];

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, loading, isAuthenticated } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  const getUserDisplayName = () =>
    user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  const getInitial = () => getUserDisplayName().charAt(0).toUpperCase();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/');
      setIsUserMenuOpen(false);
      setIsMenuOpen(false);
    } catch {
      toast.error('Error signing out');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-0/90 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="w-2 h-2 rounded-full bg-accent-cyan shrink-0" />
            <span className="font-mono font-bold text-lg text-text-primary group-hover:text-accent-cyan transition-colors duration-200">
              Algorhythm
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  isActive(to)
                    ? 'text-accent-cyan'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {label}
                {isActive(to) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-accent-cyan rounded-full" />
                )}
              </Link>
            ))}

            {isAuthenticated && (
              <Link
                to="/dashboard"
                className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  isActive('/dashboard')
                    ? 'text-accent-cyan'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                Dashboard
                {isActive('/dashboard') && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-accent-cyan rounded-full" />
                )}
              </Link>
            )}

            {/* Auth Section */}
            <div className="ml-3 flex items-center gap-2">
              {loading ? (
                <div className="w-24 h-8 rounded-lg bg-surface-3 animate-pulse" />
              ) : isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-surface-3 hover:bg-surface-3/80 border border-white/[0.06] transition-colors duration-200"
                    aria-label="User menu"
                  >
                    <div className="w-7 h-7 rounded-full bg-surface-3 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan text-xs font-mono font-bold shrink-0">
                      {getInitial()}
                    </div>
                    <span className="text-sm font-medium text-text-primary hidden lg:block">
                      {getUserDisplayName()}
                    </span>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-surface-1 border border-white/[0.06] rounded-xl shadow-elevated py-1.5 z-50">
                      <div className="px-4 py-2.5 border-b border-white/[0.06] mb-1">
                        <p className="text-sm font-semibold text-text-primary truncate">{getUserDisplayName()}</p>
                        <p className="text-xs text-text-muted truncate mt-0.5">{user?.email}</p>
                      </div>
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-3/50 transition-colors duration-150"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4 shrink-0" />
                        Dashboard
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-text-secondary hover:text-accent-cyan hover:bg-surface-3/50 transition-colors duration-150"
                      >
                        <LogOut className="w-4 h-4 shrink-0" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-1.5 text-sm font-medium text-text-muted hover:text-text-secondary border border-white/[0.06] rounded-lg transition-colors duration-200"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className="px-4 py-1.5 text-sm font-medium text-surface-0 bg-accent-cyan hover:bg-accent-cyan/90 rounded-lg transition-colors duration-200"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-text-muted hover:text-text-secondary hover:bg-surface-3/50 transition-colors duration-200"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-surface-1 border-t border-white/[0.06]">
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive(to)
                    ? 'text-accent-cyan bg-accent-cyan/10'
                    : 'text-text-muted hover:text-text-secondary hover:bg-surface-3/50'
                }`}
              >
                {label}
              </Link>
            ))}
            {isAuthenticated && (
              <Link
                to="/dashboard"
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive('/dashboard')
                    ? 'text-accent-cyan bg-accent-cyan/10'
                    : 'text-text-muted hover:text-text-secondary hover:bg-surface-3/50'
                }`}
              >
                Dashboard
              </Link>
            )}

            <div className="border-t border-white/[0.06] pt-3 mt-3">
              {loading ? (
                <div className="w-32 h-8 rounded-lg bg-surface-3 animate-pulse" />
              ) : isAuthenticated ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 px-3 py-2">
                    <div className="w-7 h-7 rounded-full bg-surface-3 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan text-xs font-mono font-bold shrink-0">
                      {getInitial()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{getUserDisplayName()}</p>
                      <p className="text-xs text-text-muted">{user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:text-accent-cyan hover:bg-surface-3/50 transition-colors duration-200"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    className="block px-3 py-2.5 rounded-lg text-sm font-medium text-center text-text-muted hover:text-text-secondary border border-white/[0.06] transition-colors duration-200"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className="block px-3 py-2.5 rounded-lg text-sm font-medium text-center text-surface-0 bg-accent-cyan hover:bg-accent-cyan/90 transition-colors duration-200"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
