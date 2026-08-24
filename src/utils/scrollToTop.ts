/**
 * Прокрутка страницы наверх с анимацией. Длительность выбирает браузер — на длинной
 * категории это доли секунды, но переход остаётся видимым, а не телепортом.
 *
 * `prefers-reduced-motion` проверяется вручную: правило из reset.css гасит только
 * CSS-анимации, на `behavior: 'smooth'` из JS оно не распространяется.
 */
export function scrollToTop() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
}
