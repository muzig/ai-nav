import { useState } from 'react';
import SettingsPanel from './SettingsPanel';
import ToolLibraryPage from './ToolLibraryPage';

export default function Dashboard() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    localStorage.getItem('ai-nav-theme') === 'dark' ? 'dark' : 'light'
  );

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('ai-nav-theme', next);
    document.documentElement.dataset.theme = next;
  };

  return (
    <>
      <ToolLibraryPage
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
