import './ThemeToggle.css';
import { useTheme } from '@/theme/useTheme';
import { MoonIcon, SunIcon } from '@/components/ui/icons';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-toggle" role="group" aria-label="Тема оформления">
      <button
        type="button"
        className={`theme-toggle__btn touch-target ${theme === 'light' ? 'theme-toggle__btn--active' : ''}`}
        onClick={() => setTheme('light')}
        aria-pressed={theme === 'light'}
        title="Светлая тема"
      >
        <SunIcon width={16} height={16} />
      </button>
      <button
        type="button"
        className={`theme-toggle__btn touch-target ${theme === 'dark' ? 'theme-toggle__btn--active' : ''}`}
        onClick={() => setTheme('dark')}
        aria-pressed={theme === 'dark'}
        title="Тёмная тема"
      >
        <MoonIcon width={16} height={16} />
      </button>
    </div>
  );
}
