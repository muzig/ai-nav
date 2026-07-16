import { useState } from 'react';
import { X, Sparkles, Loader2, Check, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
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

  const allCategoryNames = [
    ...new Set([
      ...categories.map((c) => c.name),
      ...suggestions.map((s) => s.editingCategory),
    ]),
  ];

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <div className="flex items-center gap-2">
            <Sparkles size={12} className="text-[var(--color-accent)]" />
            <span className="modal__title">
              {step === 'input' ? 'add bookmarks' : 'review'}
            </span>
            <span className="font-[family-name:var(--font-outlier)] text-[10px] text-[var(--color-ink-3)] ml-2">
              {step === 'review' && `${suggestions.filter(s => s.selected).length}/${suggestions.length} selected`}
            </span>
          </div>
          <button onClick={handleClose} className="btn-icon"><X size={13} /></button>
        </div>

        <div className="modal__body">
          {step === 'input' ? (
            <>
              <textarea
                value={urlText}
                onChange={(e) => setUrlText(e.target.value)}
                placeholder={`paste urls, one per line:\n\nhttps://github.com\nhttps://docs.anthropic.com\nhttps://news.ycombinator.com`}
                className="w-full h-44 bg-[var(--color-paper)] border border-[var(--color-rule)] p-3 text-[13px] text-[var(--color-ink)] placeholder-[var(--color-ink-3)] font-[family-name:var(--font-body)] resize-none outline-none focus:border-[var(--color-focus)]"
              />
              {error && (
                <div className="flex items-center gap-2 mt-3 text-[12px] text-[var(--color-error)]">
                  <AlertCircle size={12} />
                  {error}
                </div>
              )}
              <div className="flex items-center justify-between mt-3">
                <span className="font-[family-name:var(--font-outlier)] text-[10px] text-[var(--color-ink-3)]">
                  {urlText.split('\n').filter(l => l.trim()).length} lines
                </span>
                <button
                  onClick={handleParse}
                  disabled={!urlText.trim() || parsing}
                  className="btn btn--primary disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {parsing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  <span>{parsing ? 'analyzing…' : 'analyze'}</span>
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-1">
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
          )}
        </div>

        {step === 'review' && (
          <div className="modal__footer">
            <button onClick={() => setStep('input')} className="btn">← back</button>
            <button
              onClick={handleConfirm}
              disabled={suggestions.filter(s => s.selected).length === 0}
              className="btn btn--primary disabled:opacity-40"
            >
              <Check size={12} />
              <span>save {suggestions.filter(s => s.selected).length}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SuggestionRow({ suggestion, categories, onToggle, onCategoryChange }: {
  suggestion: EditableSuggestion;
  categories: string[];
  onToggle: () => void;
  onCategoryChange: (cat: string) => void;
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  return (
    <div className={`flex items-center gap-3 p-2 ${suggestion.selected ? '' : 'opacity-40'}`}>
      <button
        onClick={onToggle}
        className={`w-3.5 h-3.5 border flex items-center justify-center flex-shrink-0 ${
          suggestion.selected
            ? 'bg-[var(--color-accent)] border-[var(--color-accent)]'
            : 'border-[var(--color-rule)]'
        }`}
      >
        {suggestion.selected && <Check size={10} className="text-[var(--color-paper)]" />}
      </button>

      <img
        src={suggestion.favicon}
        alt=""
        className="w-4 h-4 object-contain flex-shrink-0"
        onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
      />

      <div className="min-w-0 flex-1">
        <div className="text-[12px] text-[var(--color-ink)] truncate">{suggestion.title}</div>
        <div className="text-[10px] text-[var(--color-ink-3)] font-[family-name:var(--font-outlier)] truncate">{suggestion.url}</div>
      </div>

      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-1 text-[10px] font-[family-name:var(--font-outlier)] px-2 py-1 border border-[var(--color-rule)] text-[var(--color-ink-2)]"
        >
          {suggestion.editingCategory}
          {showDropdown ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
        </button>
        {showDropdown && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
            <div className="absolute right-0 top-full mt-1 z-20 bg-[var(--color-paper-2)] border border-[var(--color-rule)] min-w-[140px] max-h-[180px] overflow-y-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { onCategoryChange(cat); setShowDropdown(false); }}
                  className={`block w-full text-left px-2 py-1.5 text-[10px] font-[family-name:var(--font-outlier)] ${
                    cat === suggestion.editingCategory
                      ? 'bg-[var(--color-accent)] text-[var(--color-paper)]'
                      : 'text-[var(--color-ink-2)] hover:bg-[var(--color-paper-3)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
              <div className="border-t border-[var(--color-rule)]">
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customCategory.trim()) {
                      onCategoryChange(customCategory.trim());
                      setCustomCategory('');
                      setShowDropdown(false);
                    }
                  }}
                  placeholder="new category…"
                  className="w-full px-2 py-1.5 text-[10px] bg-transparent text-[var(--color-ink)] placeholder-[var(--color-ink-3)] outline-none font-[family-name:var(--font-outlier)]"
                />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="w-8 flex-shrink-0">
        <div className="w-full h-0.5 bg-[var(--color-rule)] overflow-hidden">
          <div
            className="h-full"
            style={{
              width: `${suggestion.confidence * 100}%`,
              background: suggestion.confidence > 0.7
                ? 'var(--color-accent)'
                : suggestion.confidence > 0.4
                ? 'var(--color-warning)'
                : 'var(--color-error)',
            }}
          />
        </div>
      </div>
    </div>
  );
}