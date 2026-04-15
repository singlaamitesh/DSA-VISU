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

// ─── Forgot-password panel ───────────────────────────────────────────────────

interface ForgotPanelProps {
  onBack: () => void;
  resetPassword: (email: string) => Promise<void>;
}

const ForgotPanel: React.FC<ForgotPanelProps> = ({ onBack, resetPassword }) => {
  const [resetEmail, setResetEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) { toast.error('Please enter your email address'); return; }
    setIsLoading(true);
    try {
      await resetPassword(resetEmail);
      toast.success('Password reset email sent! Check your inbox.');
      onBack();
      setResetEmail('');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="max-w-md w-full"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-accent-cyan shadow-glow-cyan mb-6" />
        <h2 className="text-3xl font-bold text-text-primary mb-2">Reset password</h2>
        <p className="text-text-secondary text-sm">Enter your email to receive a reset link</p>
      </div>

      {/* Card */}
      <div className="surface-1 rounded-2xl p-8 shadow-elevated">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="resetEmail" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 font-mono">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
              <input
                id="resetEmail"
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className={`${inputBase} pl-10 pr-4`}
                placeholder="you@example.com"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={isLoading}
            className="w-full justify-center"
          >
            {!isLoading && 'Send reset link'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-accent-cyan hover:text-accent-teal transition-colors font-medium"
          >
            Back to sign in
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main login component ────────────────────────────────────────────────────

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const { signIn, resetPassword, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(searchParams.get('redirect') || '/');
    }
  }, [isAuthenticated, navigate, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }

    setIsLoading(true);
    try {
      await signIn(email, password);
      toast.success('Welcome back!');
      navigate(searchParams.get('redirect') || '/');
    } catch (error: any) {
      const msg = error?.message || '';
      if (msg.includes('Invalid login credentials')) {
        toast.error('Invalid email or password');
      } else if (msg.includes('Email not confirmed')) {
        toast.error('Please check your email and confirm your account first.');
      } else {
        toast.error(msg || 'Failed to sign in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <ForgotPanel onBack={() => setShowForgotPassword(false)} resetPassword={resetPassword} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <motion.div
        className="max-w-md w-full"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-accent-cyan shadow-glow-cyan mb-6" />
          <h2 className="text-3xl font-bold text-text-primary mb-2">Welcome back</h2>
          <p className="text-text-secondary text-sm">Sign in to continue</p>
        </div>

        {/* Card */}
        <div className="surface-1 rounded-2xl p-8 shadow-elevated">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
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

            {/* Password */}
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
                  placeholder="Enter your password"
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

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 accent-accent-cyan bg-surface-2 border-white/10 rounded"
                />
                <span className="text-xs text-text-secondary">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-xs text-accent-cyan hover:text-accent-teal transition-colors font-medium"
              >
                Forgot password?
              </button>
            </div>

            {/* Sign in */}
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

          {/* Sign up link */}
          <div className="mt-6 text-center">
            <p className="text-text-muted text-sm">
              Don't have an account?{' '}
              <Link to="/signup" className="text-accent-cyan hover:text-accent-teal font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
