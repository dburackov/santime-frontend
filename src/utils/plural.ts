/** Русские формы числа: [1 товар, 2 товара, 5 товаров]. */
function pluralize(count: number, forms: [string, string, string]): string {
  const n = Math.abs(count) % 100;
  const last = n % 10;
  if (n > 10 && n < 20) return forms[2];
  if (last === 1) return forms[0];
  if (last >= 2 && last <= 4) return forms[1];
  return forms[2];
}

export function formatProductsCount(count: number): string {
  return `${count} ${pluralize(count, ['товар', 'товара', 'товаров'])}`;
}

export function formatFoundProducts(count: number): string {
  return `${pluralize(count, ['Найден', 'Найдено', 'Найдено'])} ${formatProductsCount(count)}`;
}
