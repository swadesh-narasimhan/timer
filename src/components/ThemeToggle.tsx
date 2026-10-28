import { Icon } from './Icons';
interface ThemeToggleProps {
  theme: 'dark' | 'light';
  onToggle: () => void;
}

export default function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <button
      className="icon-btn theme-toggle"
      onClick={onToggle}
      title="Toggle theme (D)"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <span className={`theme-icon ${theme}`}><Icon name={theme === 'dark' ? 'sun' : 'moon'} /></span>
    </button>
  );
}
