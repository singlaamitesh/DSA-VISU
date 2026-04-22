import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, Download, Trash2 } from 'lucide-react';
import Card from '../components/UI/Card';
import Badge from '../components/UI/Badge';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import { useAuth } from '../hooks/useAuth';
import { useHistoryStore, AIGeneration } from '../stores/historyStore';
import toast from 'react-hot-toast';

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Dashboard ───────────────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { generations, loading, loadHistory, deleteGeneration } = useHistoryStore();

  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);

  // Load history on mount
  useEffect(() => {
    if (user) loadHistory(user.id);
  }, [user]);

  const displayName =
    user?.name || user?.email?.split('@')[0] || 'User';

  const thisMonthCount = getThisMonthCount(generations);
  const latestDate =
    generations.length > 0
      ? generations[0].createdAt.toLocaleDateString()
      : 'None yet';

  const handleSignOut = async () => {
    setSignOutLoading(true);
    try {
      await signOut();
    } catch {
      toast.error('Failed to sign out');
    } finally {
      setSignOutLoading(false);
    }
  };

  const handlePreview = (html: string) => {
    setPreviewHtml(html);
    setPreviewOpen(true);
  };

  const handleDownload = (html: string, index: number) => {
    downloadHtml(html, `generation-${index + 1}.html`);
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

  return (
    <div className="min-h-screen px-4 py-10 md:px-8">
      <div className="max-w-4xl mx-auto">

        {/* ── Page header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-10"
        >
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-secondary text-sm mt-1">
            Welcome back,{' '}
            <span className="text-accent-cyan font-medium">{displayName}</span>
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-6"
        >

          {/* ── Account card ── */}
          <motion.div variants={itemVariants}>
            <Card variant="surface-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <p className="text-text-primary font-semibold leading-tight">{displayName}</p>
                  <p className="text-text-muted text-sm">{user?.email}</p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  loading={signOutLoading}
                  onClick={handleSignOut}
                >
                  {!signOutLoading && 'Sign out'}
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* ── Stats row ── */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              {/* Generations */}
              <Card variant="surface-2" className="flex flex-col gap-1">
                <p className="text-text-muted text-xs uppercase font-mono tracking-wider">
                  Generations
                </p>
                <p className="text-2xl font-bold text-text-primary">{generations.length}</p>
              </Card>

              {/* This month */}
              <Card variant="surface-2" className="flex flex-col gap-1">
                <p className="text-text-muted text-xs uppercase font-mono tracking-wider">
                  This Month
                </p>
                <p className="text-2xl font-bold text-text-primary">{thisMonthCount}</p>
              </Card>

              {/* Latest */}
              <Card variant="surface-2" className="flex flex-col gap-1">
                <p className="text-text-muted text-xs uppercase font-mono tracking-wider">
                  Latest
                </p>
                <p className="text-2xl font-bold text-text-primary leading-tight">{latestDate}</p>
              </Card>

            </div>
          </motion.div>

          {/* ── Generation history ── */}
          <motion.div variants={itemVariants}>
            <Card variant="surface-1">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-base font-semibold text-text-primary">History</h2>
                <Badge variant="cyan">{generations.length}</Badge>
              </div>

              {/* Loading */}
              {loading && (
                <div className="flex items-center justify-center py-14">
                  <div className="w-7 h-7 rounded-full border-2 border-accent-cyan border-t-transparent animate-spin" />
                </div>
              )}

              {/* Empty */}
              {!loading && generations.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <p className="text-text-muted text-sm">No generations yet.</p>
                  <p className="text-text-muted text-xs">
                    Try the{' '}
                    <Link
                      to="/visualizer"
                      className="text-accent-cyan hover:text-accent-teal underline underline-offset-2 transition-colors"
                    >
                      AI Custom mode
                    </Link>{' '}
                    in the Visualizer.
                  </p>
                </div>
              )}

              {/* List */}
              {!loading && generations.length > 0 && (
                <ul className="flex flex-col gap-3">
                  {generations.map((gen, index) => (
                    <motion.li
                      key={gen.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04, duration: 0.25 }}
                      className="surface-2 rounded-lg p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
                    >
                      {/* Text */}
                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <p className="text-sm text-text-primary leading-snug line-clamp-2 break-words">
                          {gen.prompt}
                        </p>
                        <p className="text-xs text-text-muted font-mono">
                          {gen.createdAt.toLocaleDateString()}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
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
                          variant="danger"
                          size="sm"
                          title="Delete"
                          onClick={() => handleDelete(gen.id)}
                          className="px-2"
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

      {/* ── Preview modal ── */}
      <Modal
        isOpen={previewOpen}
        onClose={() => { setPreviewOpen(false); setPreviewHtml(null); }}
        title="Preview"
      >
        {previewHtml && (
          <div className="w-full rounded-lg overflow-hidden border border-white/10">
            <iframe
              srcDoc={previewHtml}
              title="Generation Preview"
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
