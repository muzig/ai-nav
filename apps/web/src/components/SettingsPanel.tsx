import { useState, useEffect } from 'react';
import { X, Loader2, Check } from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('claude-haiku-4-5-20251001');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/ai/settings')
        .then((r) => r.json())
        .then((data) => {
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
        body: JSON.stringify({ claude_api_key: apiKey.trim() || undefined, base_url: baseUrl.trim(), model }),
      });
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
            <label className="cell__label block mb-1">claude api key</label>
            <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-ant-api…" className="input" style={{ fontFamily: 'var(--font-outlier)' }} />
          </div>
          <div>
            <label className="cell__label block mb-1">base url</label>
            <input type="url" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://api.anthropic.com" className="input" style={{ fontFamily: 'var(--font-outlier)' }} />
          </div>
          <div>
            <label className="cell__label block mb-1">model</label>
            <select value={model} onChange={(e) => setModel(e.target.value)} className="input">
              <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5</option>
              <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
              <option value="claude-opus-4-8">Claude Opus 4.8</option>
            </select>
          </div>
          <div className="pt-3 border-t border-[var(--color-rule)]">
            <div className="cell__label mb-2">shortcuts</div>
            <div className="space-y-1.5 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-ink-2)]">search</span>
                <kbd className="kbd">⌘K</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-ink-2)]">add</span>
                <kbd className="kbd">⌘N</kbd>
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