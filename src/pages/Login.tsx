import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/UI/Button';
import toast from 'react-hot-toast';

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

const inputBase =
  'w-full py-3 bg-surface-2 border border-white/10 rounded-lg text-text-primary placeholder-text-muted focus:border-accent-cyan focus:outline-none focus:ring-1 focus:ring-accent-cyan/40 transition-all duration-200 font-sans text-sm';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { signIn, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(searchParams.get('redirect') || '/');
    }
  }, [isAuthenticated, navigate, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await signIn(email, password);
      toast.success('Welcome back!');
      navigate(searchParams.get('redirect') || '/');
    } catch (error: any) {
      const msg = error?.message || '';
      // PocketBase auth errors are generic — map common ones to friendly text
      if (msg.includes('Failed to authenticate') || msg.includes('identity') || msg.includes('400')) {
        toast.error('Invalid email or password');
      } else {
        toast.error(msg || 'Failed to sign in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <motion.div
        className="max-w-md w-full"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-accent-cyan shadow-glow-cyan mb-6" />
          <h2 className="text-3xl font-bold text-text-primary mb-2">Welcome back</h2>
          <p className="text-text-secondary text-sm">Sign in to continue</p>
        </div>

        <div className="surface-1 rounded-2xl p-8 shadow-elevated">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 font-mono">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${inputBase} pl-10 pr-4`}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 font-mono">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputBase} pl-10 pr-11`}
                  placeholder="Your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-white/10 bg-surface-2 text-accent-cyan focus:ring-accent-cyan/40 focus:ring-2 focus:ring-offset-0"
              />
              <span className="text-sm text-text-secondary">Remember me</span>
            </label>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={isLoading}
              className="w-full justify-center"
            >
              {!isLoading && 'Sign in'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-text-muted text-sm">
              New to Algorhythm?{' '}
              <Link to="/signup" className="text-accent-cyan hover:text-accent-teal transition-colors font-medium">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
