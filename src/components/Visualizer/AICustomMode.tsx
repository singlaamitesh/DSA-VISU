import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Download, Copy, Trash2, Eye, Loader2, Clock, Code2, ExternalLink } from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import { generateVisualization } from '../../lib/openrouter';
import { useAuth } from '../../hooks/useAuth';
import { useHistoryStore } from '../../stores/historyStore';

const PLACEHOLDER = `Examples:
• Visualize bubble sort step-by-step with an array of 8 elements
• Show how a binary search tree inserts and balances nodes
• Animate Dijkstra's shortest path algorithm on a small graph
• Demonstrate dynamic programming with the knapsack problem`;

interface Language {
  value: string;
  label: string;
  icon: string;
}

const LANGUAGES: Language[] = [
  { value: 'javascript', label: 'JavaScript', icon: 'JS' },
  { value: 'python', label: 'Python', icon: 'Py' },
  { value: 'typescript', label: 'TypeScript', icon: 'TS' },
  { value: 'java', label: 'Java', icon: 'Jv' },
  { value: 'cpp', label: 'C++', icon: '++' },
  { value: 'c', label: 'C', icon: 'C' },
  { value: 'go', label: 'Go', icon: 'Go' },
  { value: 'rust', label: 'Rust', icon: 'Rs' },
];

const AICustomMode: React.FC = () => {
  const { user } = useAuth();
  const { generations, loading: historyLoading, loadHistory, saveGeneration, deleteGeneration } = useHistoryStore();

  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState<string>('javascript');
  const [html, setHtml] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [viewingHistory, setViewingHistory] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (user?.id) {
      loadHistory(user.id);
    }
  }, [user?.id]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError('');
    setHtml('');
    setViewingHistory(null);
    try {
      const result = await generateVisualization(prompt.trim(), language);
      setHtml(result);
      if (user?.id) {
        await saveGeneration(user.id, prompt.trim(), result);
      }
    } catch (err: any) {
      setError(err.message || 'Generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (htmlContent: string, name?: string) => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name || 'visualization.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async (htmlContent: string) => {
    await navigator.clipboard.writeText(htmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenInNewTab = (htmlContent: string) => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    // Revoke the URL after the new tab has a chance to load it
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    if (!win) {
      // Pop-up blocked — fall back to download
      handleDownload(htmlContent);
    }
  };

  const handleViewHistory = (id: string, histHtml: string) => {
    setViewingHistory(id);
    setHtml(histHtml);
    setError('');
  };

  const displayHtml = viewingHistory
    ? (generations.find((g) => g.id === viewingHistory)?.html ?? html)
    : html;

  return (
    <div className="space-y-6">
      {/* Prompt Input */}
      <Card variant="surface-1">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent-cyan" />
          AI Visualization Generator
        </h2>
        <div className="space-y-4">
          {/* Language Picker */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5" />
              Preferred Language
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.value}
                  type="button"
                  disabled={generating}
                  onClick={() => setLanguage(lang.value)}
                  className={`relative flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg border text-xs font-medium transition-all duration-200 ${
                    language === lang.value
                      ? 'bg-accent-cyan/10 border-accent-cyan/40 text-accent-cyan shadow-glow-cyan'
                      : 'bg-surface-2 border-white/10 text-text-muted hover:border-white/20 hover:text-text-secondary'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <span className="font-mono font-bold text-sm">{lang.icon}</span>
                  <span className="text-[10px]">{lang.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Textarea */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 font-mono">
              Describe the visualization
            </label>
            <textarea
              className="w-full h-36 bg-surface-2 border border-white/10 rounded-lg p-3 text-text-primary placeholder-text-muted text-sm resize-none focus:outline-none focus:ring-1 focus:ring-accent-cyan/40 focus:border-accent-cyan transition-colors font-sans"
              placeholder={PLACEHOLDER}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={generating}
            />
          </div>

          {error && (
            <p className="text-accent-rose text-sm bg-accent-rose/10 border border-accent-rose/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center flex-wrap gap-3">
            <Button
              variant="primary"
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              loading={generating}
              icon={!generating && <Sparkles className="w-4 h-4" />}
            >
              {generating ? 'Generating...' : 'Generate Visualization'}
            </Button>
            {displayHtml && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleOpenInNewTab(displayHtml)}
                  icon={<ExternalLink className="w-4 h-4" />}
                >
                  Open in New Tab
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(displayHtml)}
                  icon={<Download className="w-4 h-4" />}
                >
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(displayHtml)}
                  icon={<Copy className="w-4 h-4" />}
                >
                  {copied ? 'Copied!' : 'Copy HTML'}
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Preview — small embedded + prominent "Open in New Tab" CTA */}
      {displayHtml && (
        <Card variant="surface-1">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
            <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
              <Eye className="w-4 h-4" />
              {viewingHistory ? 'History Preview' : 'Generated Visualization'}
            </h3>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenInNewTab(displayHtml)}
              icon={<ExternalLink className="w-4 h-4" />}
            >
              Open in New Tab
            </Button>
          </div>
          <p className="text-xs text-text-muted mb-3">
            Interactive controls work best in a fresh tab. Preview below is a quick snapshot.
          </p>
          <iframe
            ref={iframeRef}
            srcDoc={displayHtml}
            sandbox="allow-scripts"
            className="w-full rounded-lg border border-white/10 bg-white"
            style={{ height: '360px' }}
            title="Visualization Preview"
          />
        </Card>
      )}

      {/* History */}
      <Card variant="surface-1">
        <h3 className="text-sm font-semibold text-text-secondary mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Past Generations
          {historyLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-text-muted" />}
        </h3>
        {generations.length === 0 && !historyLoading ? (
          <p className="text-text-muted text-sm">No generations yet. Create your first visualization above.</p>
        ) : (
          <ul className="space-y-2">
            {generations.map((gen) => (
              <li
                key={gen.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-surface-2 border border-white/5 hover:border-white/15 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary text-sm truncate font-medium">{gen.prompt}</p>
                  <p className="text-text-muted text-xs mt-0.5 font-mono">
                    {gen.createdAt.toLocaleDateString()} · {gen.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleOpenInNewTab(gen.html)}
                    title="Open in new tab"
                    className="p-1.5 rounded-md text-text-muted hover:text-accent-cyan hover:bg-accent-cyan/10 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleViewHistory(gen.id, gen.html)}
                    title="Preview below"
                    className="p-1.5 rounded-md text-text-muted hover:text-accent-cyan hover:bg-accent-cyan/10 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(gen.html, `visualization-${gen.id}.html`)}
                    title="Download"
                    className="p-1.5 rounded-md text-text-muted hover:text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteGeneration(gen.id)}
                    title="Delete"
                    className="p-1.5 rounded-md text-text-muted hover:text-accent-rose hover:bg-accent-rose/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default AICustomMode;
