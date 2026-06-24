import { useState } from 'react';
import {
  X, Sparkles, Loader2, Check, ChevronDown, ChevronUp,
  AlertCircle, ExternalLink, Plus
} from 'lucide-react';
import { useAI, type AiSuggestion } from '../hooks/useAI';
import type { Category } from '@ai-nav/shared';

interface AddUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (items: Array<{ title: string; url: string; description: string; favicon: string; category_id: number | null }>) => void;
  categories: Category[];
  onAddCategory: (name: string) => Promise<Category>;
}

interface EditableSuggestion extends AiSuggestion {
  selected: boolean;
  editingCategory: string;
}

export default function AddUrlModal({ isOpen, onClose, onConfirm, categories, onAddCategory }: AddUrlModalProps) {
  const [urlText, setUrlText] = useState('');
  const [suggestions, setSuggestions] = useState<EditableSuggestion[]>([]);
  const [step, setStep] = useState<'input' | 'review'>('input');
  const { parsing, error, parseUrls, clearError } = useAI();

  const handleParse = async () => {
    const result = await parseUrls(urlText);
    if (result) {
      setSuggestions(
        result.suggestions.map((s) => ({
          ...s,
          selected: true,
          editingCategory: s.suggestedCategory,
        }))
      );
      setStep('review');
    }
  };

  const toggleSuggestion = (index: number) => {
    setSuggestions((prev) =>
      prev.map((s, i) => (i === index ? { ...s, selected: !s.selected } : s))
    );
  };

  const updateCategory = (index: number, category: string) => {
    setSuggestions((prev) =>
      prev.map((s, i) => (i === index ? { ...s, editingCategory: category } : s))
    );
  };

  const handleConfirm = async () => {
    const selected = suggestions.filter((s) => s.selected);
    if (selected.length === 0) return;

    // Resolve category names to IDs
    const items = await Promise.all(
      selected.map(async (s) => {
        let categoryId: number | null = null;
        const existing = categories.find(
          (c) => c.name.toLowerCase() === s.editingCategory.toLowerCase()
        );
        if (existing) {
          categoryId = existing.id;
        } else if (s.editingCategory) {
          const newCat = await onAddCategory(s.editingCategory);
          categoryId = newCat.id;
        }
        return {
          title: s.title,
          url: s.url,
          description: s.description,
          favicon: s.favicon,
          category_id: categoryId,
        };
      })
    );

    onConfirm(items);
    handleClose();
  };

  const handleClose = () => {
    setUrlText('');
    setSuggestions([]);
    setStep('input');
    clearError();
    onClose();
  };

  // Get unique category names from existing + suggestions
  const allCategoryNames = [
    ...new Set([
      ...categories.map((c) => c.name),
      ...suggestions.map((s) => s.editingCategory),
    ]),
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-4" onClick={handleClose}>
      <div
        className="glass-strong w-full max-w-2xl max-h-[85vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-cyan/20 to-accent-violet/20 flex items-center justify-center">
              <Sparkles size={16} className="text-accent-cyan" />
            </div>
            <div>
              <h2 className="text-lg font-display font-semibold text-[var(--text-primary)]">
                {step === 'input' ? 'Add Bookmarks' : 'Review AI Suggestions'}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {step === 'input'
                  ? 'Paste URLs and let AI organize them'
                  : `${suggestions.filter((s) => s.selected).length} of ${suggestions.length} selected`}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {step === 'input' ? (
            <div className="p-6">
              <textarea
                value={urlText}
                onChange={(e) => setUrlText(e.target.value)}
                placeholder={`Paste URLs here, one per line or mixed with text:\n\nhttps://github.com\nhttps://chat.openai.com\nhttps://docs.anthropic.com\nhttps://news.ycombinator.com\n\nYou can paste any text containing URLs — they'll be extracted automatically.`}
                className="w-full h-48 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] resize-none outline-none focus:border-accent-cyan/30 font-body leading-relaxed"
              />

              {error && (
                <div className="flex items-center gap-2 mt-3 text-sm text-red-400">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-[var(--text-muted)]">
                  {urlText.split('\n').filter((l) => l.trim()).length} lines pasted
                </p>
                <button
                  onClick={handleParse}
                  disabled={!urlText.trim() || parsing}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(167, 139, 250, 0.2))',
                    border: '1px solid rgba(0, 212, 255, 0.3)',
                  }}
                >
                  {parsing ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      Analyze URLs
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4">
              {/* Category legend */}
              <div className="flex flex-wrap gap-2 mb-4 px-2">
                {allCategoryNames.map((name) => {
                  const cat = categories.find((c) => c.name === name);
                  const count = suggestions.filter(
                    (s) => s.editingCategory === name && s.selected
                  ).length;
                  return (
                    <span
                      key={name}
                      className="text-xs px-2 py-1 rounded-full border border-white/10"
                      style={{
                        background: cat ? `${cat.color}15` : 'rgba(255,255,255,0.05)',
                        color: cat?.color || 'var(--text-secondary)',
                      }}
                    >
                      {name} ({count})
                    </span>
                  );
                })}
              </div>

              {/* Suggestion list */}
              <div className="space-y-2">
                {suggestions.map((s, i) => (
                  <SuggestionRow
                    key={i}
                    suggestion={s}
                    categories={allCategoryNames}
                    onToggle={() => toggleSuggestion(i)}
                    onCategoryChange={(cat) => updateCategory(i, cat)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'review' && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
            <button
              onClick={() => setStep('input')}
              className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors"
            >
              ← Back to input
            </button>
            <button
              onClick={handleConfirm}
              disabled={suggestions.filter((s) => s.selected).length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.3), rgba(167, 139, 250, 0.3))',
                border: '1px solid rgba(0, 212, 255, 0.4)',
              }}
            >
              <Check size={14} />
              Save {suggestions.filter((s) => s.selected).length} Bookmarks
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SuggestionRow({
  suggestion,
  categories,
  onToggle,
  onCategoryChange,
}: {
  suggestion: EditableSuggestion;
  categories: string[];
  onToggle: () => void;
  onCategoryChange: (cat: string) => void;
}) {
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
        suggestion.selected ? 'bg-white/[0.03] border border-white/5' : 'bg-transparent border border-transparent opacity-50'
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border transition-all ${
          suggestion.selected
            ? 'bg-accent-cyan/20 border-accent-cyan/40 text-accent-cyan'
            : 'border-white/20 text-transparent'
        }`}
      >
        {suggestion.selected && <Check size={12} />}
      </button>

      {/* Favicon */}
      <img
        src={suggestion.favicon}
        alt=""
        className="w-5 h-5 object-contain rounded flex-shrink-0"
        onError={(e) => {
          (e.target as HTMLImageElement).style.opacity = '0.3';
        }}
      />

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="text-sm text-[var(--text-primary)] truncate font-medium">
          {suggestion.title}
        </div>
        <div className="text-xs text-[var(--text-muted)] truncate">{suggestion.url}</div>
      </div>

      {/* Category selector */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[var(--text-secondary)] hover:border-white/20 transition-colors"
        >
          {suggestion.editingCategory}
          {showCategoryDropdown ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {showCategoryDropdown && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowCategoryDropdown(false)} />
            <div className="absolute right-0 top-full mt-1 z-20 glass-strong p-1 min-w-[160px] max-h-[200px] overflow-y-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    onCategoryChange(cat);
                    setShowCategoryDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    cat === suggestion.editingCategory
                      ? 'bg-accent-cyan/10 text-accent-cyan'
                      : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
              {/* Custom category input */}
              <div className="border-t border-white/5 mt-1 pt-1">
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customCategory.trim()) {
                      onCategoryChange(customCategory.trim());
                      setCustomCategory('');
                      setShowCategoryDropdown(false);
                    }
                  }}
                  placeholder="Custom category..."
                  className="w-full px-3 py-1.5 text-xs bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Confidence */}
      <div className="flex-shrink-0 w-8">
        <div className="w-full h-1 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${suggestion.confidence * 100}%`,
              background:
                suggestion.confidence > 0.7
                  ? 'var(--accent-cyan)'
                  : suggestion.confidence > 0.4
                  ? 'var(--accent-amber)'
                  : 'var(--accent-rose)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
