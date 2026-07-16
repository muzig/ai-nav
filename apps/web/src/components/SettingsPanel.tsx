import { useState, useEffect } from 'react';
import { X, Loader2, Check, Server } from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingSource = 'db' | 'env' | 'default';

const MODEL_OPTIONS = [
  { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
  { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
  { value: 'claude-opus-4-8', label: 'Claude Opus 4.8' },
];

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('claude-haiku-4-5-20251001');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/ai/settings')
        .then((r) => r.json())
        .then((data) => {
          setHasKey(data.hasApiKey);
          setBaseUrl(data.baseURL || '');
          setModel(data.model || 'claude-haiku-4-5-20251001');
        });
      setApiKey('');
      setSaved(false);
    }
  }, [isOpen]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/ai/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claude_api_key: apiKey.trim() || undefined,
          base_url: baseUrl.trim(),
          model,
        }),
      });
      if (apiKey.trim()) setHasKey(true);
      setSaved(true);
      setApiKey('');
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <span className="modal__title">settings</span>
          <button onClick={onClose} className="btn-icon"><X size={13} /></button>
        </div>
        <div className="modal__body space-y-4">
          <div>
            <label className="block text-[10px] font-[family-name:var(--font-outlier)] uppercase tracking-wider text-[var(--color-ink-3)] mb-1">
              claude api key {hasKey && <span className="text-[var(--color-accent)] ml-1">[set]</span>}
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-api…"
              className="w-full bg-[var(--color-paper)] border border-[var(--color-rule)] px-3 py-2 text-[13px] text-[var(--color-ink)] font-[family-name:var(--font-outlier)] outline-none focus:border-[var(--color-focus)]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-[family-name:var(--font-outlier)] uppercase tracking-wider text-[var(--color-ink-3)] mb-1">base url</label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.anthropic.com"
              className="w-full bg-[var(--color-paper)] border border-[var(--color-rule)] px-3 py-2 text-[13px] text-[var(--color-ink)] font-[family-name:var(--font-outlier)] outline-none focus:border-[var(--color-focus)]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-[family-name:var(--font-outlier)] uppercase tracking-wider text-[var(--color-ink-3)] mb-1">model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-[var(--color-paper)] border border-[var(--color-rule)] px-3 py-2 text-[13px] text-[var(--color-ink)] outline-none focus:border-[var(--color-focus)]"
            >
              {MODEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="pt-2 border-t border-[var(--color-rule)]">
            <div className="text-[10px] font-[family-name:var(--font-outlier)] uppercase tracking-wider text-[var(--color-ink-3)] mb-2">shortcuts</div>
            <div className="space-y-1 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-ink-2)]">search</span>
                <kbd className="font-[family-name:var(--font-outlier)] text-[10px] text-[var(--color-ink-3)] border border-[var(--color-rule)] px-1.5 py-0.5">⌘K</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-ink-2)]">add</span>
                <kbd className="font-[family-name:var(--font-outlier)] text-[10px] text-[var(--color-ink-3)] border border-[var(--color-rule)] px-1.5 py-0.5">⌘N</kbd>
              </div>
            </div>
          </div>
        </div>
        <div className="modal__footer">
          <button onClick={handleSave} disabled={saving} className="btn btn--primary disabled:opacity-40">
            {saving ? <Loader2 size={12} className="animate-spin" /> : saved ? <Check size={12} /> : null}
            <span>{saving ? 'saving…' : saved ? 'saved' : 'save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}