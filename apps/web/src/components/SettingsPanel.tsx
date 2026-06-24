import { useState, useEffect } from 'react';
import { X, Key, Loader2, Check, AlertCircle } from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/ai/settings')
        .then((r) => r.json())
        .then((data) => setHasKey(data.hasApiKey));
      setSaved(false);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/ai/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claude_api_key: apiKey }),
      });
      setHasKey(true);
      setSaved(true);
      setApiKey('');
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save API key:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="glass-strong w-full max-w-md animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-lg font-display font-semibold text-[var(--text-primary)]">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* API Key section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Key size={16} className="text-accent-cyan" />
              <h3 className="text-sm font-medium text-[var(--text-primary)]">Claude API Key</h3>
              {hasKey && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                  Configured
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-3 leading-relaxed">
              Required for AI-powered URL categorization. Without it, basic heuristic categorization is used.
              Get your key at{' '}
              <a
                href="https://console.anthropic.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-cyan hover:underline"
              >
                console.anthropic.com
              </a>
            </p>

            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-api..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-accent-cyan/30"
              />
              <button
                onClick={handleSave}
                disabled={!apiKey.trim() || saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(167, 139, 250, 0.2))',
                  border: '1px solid rgba(0, 212, 255, 0.3)',
                }}
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : saved ? (
                  <Check size={14} className="text-green-400" />
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>

          {/* Keyboard shortcuts */}
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Keyboard Shortcuts</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Search bookmarks</span>
                <kbd className="text-xs bg-white/5 px-2 py-1 rounded text-[var(--text-muted)]">
                  ⌘ K
                </kbd>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Add bookmarks</span>
                <kbd className="text-xs bg-white/5 px-2 py-1 rounded text-[var(--text-muted)]">
                  ⌘ N
                </kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
