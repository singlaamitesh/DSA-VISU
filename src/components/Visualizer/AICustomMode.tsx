import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Download, Copy, Trash2, Eye, Loader2, Clock } from 'lucide-react';
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

const AICustomMode: React.FC = () => {
  const { user } = useAuth();
  const { generations, loading: historyLoading, loadHistory, saveGeneration, deleteGeneration } = useHistoryStore();

  const [prompt, setPrompt] = useState('');
  const [html, setHtml] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [viewingHistory, setViewingHistory] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (user?.uid) {
      loadHistory(user.uid);
    }
  }, [user?.uid]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError('');
    setHtml('');
    setViewingHistory(null);
    try {
      const result = await generateVisualization(prompt.trim());
      setHtml(result);
      if (user?.uid) {
        await saveGeneration(user.uid, prompt.trim(), result);
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
      <Card>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-400" />
          AI Visualization Generator
        </h2>
        <div className="space-y-4">
          <textarea
            className="w-full h-36 bg-slate-800/60 border border-slate-700 rounded-lg p-3 text-slate-200 placeholder-slate-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            placeholder={PLACEHOLDER}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={generating}
          />
          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              className="flex items-center gap-2"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {generating ? 'Generating...' : 'Generate Visualization'}
            </Button>
            {displayHtml && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(displayHtml)}
                  className="flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(displayHtml)}
                  className="flex items-center gap-1.5"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy HTML'}
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Preview */}
      {displayHtml && (
        <Card>
          <h3 className="text-sm font-medium text-slate-300 mb-3">
            {viewingHistory ? 'History Preview' : 'Generated Visualization'}
          </h3>
          <iframe
            ref={iframeRef}
            srcDoc={displayHtml}
            sandbox="allow-scripts"
            className="w-full rounded-lg border border-slate-700 bg-slate-900"
            style={{ height: '520px' }}
            title="Visualization Preview"
          />
        </Card>
      )}

      {/* History */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          Past Generations
          {historyLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />}
        </h3>
        {generations.length === 0 && !historyLoading ? (
          <p className="text-slate-500 text-sm">No generations yet. Create your first visualization above.</p>
        ) : (
          <ul className="space-y-3">
            {generations.map((gen) => (
              <li
                key={gen.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-sm truncate font-medium">{gen.prompt}</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {gen.createdAt.toLocaleDateString()} at{' '}
                    {gen.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleViewHistory(gen.id, gen.html)}
                    title="View"
                    className="p-1.5 rounded-md text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(gen.html, `visualization-${gen.id}.html`)}
                    title="Download"
                    className="p-1.5 rounded-md text-slate-400 hover:text-green-400 hover:bg-green-400/10 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteGeneration(gen.id)}
                    title="Delete"
                    className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
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
