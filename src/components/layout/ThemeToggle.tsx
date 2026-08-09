'use client';

import './ThemeToggle.css';
import { useTheme } from '@/theme/useTheme';
import { MoonIcon, SunIcon } from '@/components/ui/icons';

interface ThemeToggleProps {
  /** Тумблер стоит на тёмной плашке (служебная полоса) — переключает контрастную схему. */
  onDark?: boolean;
}

export function ThemeToggle({ onDark = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={`theme-toggle ${onDark ? 'theme-toggle--on-dark' : ''}`}
      role="group"
      aria-label="Тема оформления"
    >
      {/* Подсветка активной кнопки намеренно НЕ зависит от состояния React:
          на сервере тема неизвестна, состояние стартует со светлой, и тумблер
          прыгал бы со светлой на тёмную после гидрации. Классы --light/--dark
          статичны, а какой из них подсвечен, решает CSS по атрибуту data-theme
          на <html> — его проставляет инлайн-скрипт до первой отрисовки, то есть
          из того же источника, что и цвета всей страницы. */}
      <button
        type="button"
        className="theme-toggle__btn theme-toggle__btn--light"
        onClick={() => setTheme('light')}
        aria-pressed={theme === 'light'}
        title="Светлая тема"
      >
        <SunIcon width={12} height={12} />
      </button>
      <button
        type="button"
        className="theme-toggle__btn theme-toggle__btn--dark"
        onClick={() => setTheme('dark')}
        aria-pressed={theme === 'dark'}
        title="Тёмная тема"
      >
        <MoonIcon width={12} height={12} />
      </button>
    </div>
  );
}
