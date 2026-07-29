import { useEffect, useRef } from 'react';
import { Search, Command } from 'lucide-react';

interface CommandInputProps {
  query: string;
  onSearch(query: string): void;
  onAddUrls(urls: string[]): void;
}

const URL_PATTERN = /https?:\/\/[^\s]+/g;

export default function CommandInput({ query, onSearch, onAddUrls }: CommandInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  return (
    <div className="command-input">
      <Search size={16} aria-hidden="true" />
      <label htmlFor="tool-command" className="sr-only">Search tools or paste URLs</label>
      <input
        ref={inputRef}
        id="tool-command"
        type="search"
        value={query}
        onChange={(event) => onSearch(event.target.value)}
        onPaste={(event) => {
          const urls = event.clipboardData.getData('text').match(URL_PATTERN) ?? [];
          if (urls.length) {
            event.preventDefault();
            onAddUrls([...new Set(urls)]);
          }
        }}
        placeholder="Search tools, or paste a URL"
      />
      <span className="command-key"><Command size={10} />K</span>
    </div>
  );
}
