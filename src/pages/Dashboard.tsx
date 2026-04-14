import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, BarChart3, Calendar, Clock, Eye, Download, Trash2, Sparkles } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import { useAuth } from '../hooks/useAuth';
import { useHistoryStore, AIGeneration } from '../stores/historyStore';
import toast from 'react-hot-toast';

// ─── helpers ────────────────────────────────────────────────────────────────

function getThisMonthCount(generations: Pick<AIGeneration, 'createdAt'>[]): number {
  const now = new Date();
  return generations.filter(
    (g) =>
      g.createdAt.getFullYear() === now.getFullYear() &&
      g.createdAt.getMonth() === now.getMonth()
  ).length;
}

function downloadHtml(html: string, filename: string) {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── animated counter ────────────────────────────────────────────────────────

interface CounterProps {
  value: number;
}

const AnimatedCounter: React.FC<CounterProps> = ({ value }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    if (value === 0) {
      setDisplay(0);
      return;
    }
    const step = Math.ceil(value / 20);
    const interval = setInterval(() => {
      start += step;
      if (start >= value) {
        setDisplay(value);
        clearInterval(interval);
      } else {
        setDisplay(start);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [value]);

  return <>{display}</>;
};

// ─── main component ──────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { generations, loading, loadHistory, deleteGeneration } = useHistoryStore();

  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Load history on mount
  useEffect(() => {
    if (user) loadHistory(user.id);
  }, [user]);

  const thisMonthCount = getThisMonthCount(generations);
  const latestDate =
    generations.length > 0
      ? generations[0].createdAt.toLocaleDateString()
      : 'No generations yet';

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      toast.error('Failed to sign out');
    }
  };

  const handlePreview = (html: string) => {
    setPreviewHtml(html);
    setPreviewOpen(true);
  };

  const handleDownload = (html: string, index: number) => {
    downloadHtml(html, `ai-generation-${index + 1}.html`);
    toast.success('Downloaded!');
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGeneration(id);
      toast.success('Generation deleted');
    } catch {
      toast.error('Failed to delete generation');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-10 md:px-8">
      <div className="max-w-4xl mx-auto">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-4 mb-10"
        >
          <div className="w-12 h-12 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0">
            <User className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">My Dashboard</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Track your algorithm visualizations and AI generations
            </p>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-6"
        >

          {/* ── Account Overview ── */}
          <motion.div variants={itemVariants}>
            <Card>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Account
                  </p>
                  <p className="text-white font-semibold text-lg leading-tight">
                    {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-slate-400 text-sm">{user?.email}</p>
                </div>
                <Button variant="secondary" size="sm" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* ── Stats Row ── */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Card 1: Total */}
              <Card className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">AI Generations</span>
                </div>
                <p className="text-3xl font-bold text-white">
                  <AnimatedCounter value={generations.length} />
                </p>
                <p className="text-xs text-slate-500">total saved</p>
              </Card>

              {/* Card 2: This Month */}
              <Card className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">This Month</span>
                </div>
                <p className="text-3xl font-bold text-white">
                  <AnimatedCounter value={thisMonthCount} />
                </p>
                <p className="text-xs text-slate-500">generated this month</p>
              </Card>

              {/* Card 3: Latest */}
              <Card className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Latest</span>
                </div>
                <p className="text-lg font-semibold text-white leading-tight pt-1">
                  {latestDate}
                </p>
                <p className="text-xs text-slate-500">most recent generation</p>
              </Card>
            </div>
          </motion.div>

          {/* ── Generation History ── */}
          <motion.div variants={itemVariants}>
            <Card>
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h2 className="text-base font-semibold text-white">Generation History</h2>
              </div>

              {/* Loading */}
              {loading && (
                <div className="flex items-center justify-center py-14">
                  <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                </div>
              )}

              {/* Empty */}
              {!loading && generations.length === 0 && (
                <div className="flex flex-col items-center gap-4 py-14 text-center">
                  <div className="w-14 h-14 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                  </div>
                  <p className="text-slate-300 font-medium">No AI generations yet.</p>
                  <p className="text-slate-500 text-sm max-w-xs">
                    Try the{' '}
                    <Link
                      to="/visualizer"
                      className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
                    >
                      AI Custom mode
                    </Link>{' '}
                    in the Visualizer!
                  </p>
                </div>
              )}

              {/* List */}
              {!loading && generations.length > 0 && (
                <ul className="flex flex-col divide-y divide-white/5">
                  {generations.map((gen, index) => (
                    <motion.li
                      key={gen.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04, duration: 0.25 }}
                      className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 py-4 first:pt-0 last:pb-0"
                    >
                      {/* Text */}
                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <p className="text-sm text-slate-200 leading-snug line-clamp-2 break-words">
                          {gen.prompt}
                        </p>
                        <p className="text-xs text-slate-500">
                          {gen.createdAt.toLocaleDateString()}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Preview"
                          onClick={() => handlePreview(gen.html)}
                          className="px-2"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Download"
                          onClick={() => handleDownload(gen.html, index)}
                          className="px-2"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Delete"
                          onClick={() => handleDelete(gen.id)}
                          className="px-2 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </Card>
          </motion.div>

        </motion.div>
      </div>

      {/* ── Preview Modal ── */}
      <Modal
        isOpen={previewOpen}
        onClose={() => { setPreviewOpen(false); setPreviewHtml(null); }}
        title="Preview"
      >
        {previewHtml && (
          <div className="w-full rounded-lg overflow-hidden border border-white/10">
            <iframe
              srcDoc={previewHtml}
              title="AI Generation Preview"
              className="w-full h-[60vh]"
              sandbox="allow-scripts"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
