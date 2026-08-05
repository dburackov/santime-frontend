/**
 * Единственный источник формата цены.
 *
 * Цена приходит с бэка как BigDecimal(12,2) и в JSON выглядит как 159.00 —
 * то есть копейки в данных есть всегда. Показывать их тоже надо всегда:
 * minimumFractionDigits: 2 — это про целые суммы, которые иначе выводились бы
 * как «144» вместо «144,00» и ломали бы колонку tabular-nums.
 */
const formatter = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Цена для показа человеку: «1 249,00» — запятая и узкий пробел в разрядах. */
export function formatPrice(value: number): string {
  return formatter.format(value);
}

/**
 * Цена для машин: «1249.00» — точка, без разделителей разрядов.
 *
 * Нужна отдельно от formatPrice для schema.org Offer.price: человеческий
 * формат ru-RU разделяет разряды узким неразрывным пробелом и ставит запятую,
 * а робот ждёт обычное десятичное число и разберёт такое неверно.
 */
export function formatPriceMachine(value: number): string {
  return value.toFixed(2);
}
