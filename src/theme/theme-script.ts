export const THEME_STORAGE_KEY = 'santime-theme';

/**
 * Блокирующий скрипт, проставляющий data-theme до первой отрисовки — иначе
 * тёмная тема моргала бы светлой на каждой загрузке. Раньше жил прямо в
 * index.html; в Next его вставляет app/layout.tsx через dangerouslySetInnerHTML.
 *
 * ThemeProvider на клиенте не читает localStorage сам, а забирает результат
 * работы этого скрипта из атрибута — так серверная и клиентская разметка
 * совпадают и гидрация проходит без расхождений.
 */
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('${THEME_STORAGE_KEY}');
    var theme =
      stored === 'light' || stored === 'dark'
        ? stored
        : window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } catch (e) {}
})();
`;
