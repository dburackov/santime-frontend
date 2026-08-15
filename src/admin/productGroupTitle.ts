import type { ProductVariantResponse } from '@/api/types';

/**
 * Имя модели — общее начало имён исполнений: «Смеситель X, хром» + «Смеситель X, чёрный»
 * → «Смеситель X». Своего имени у группы в базе нет, а показывать имя первого исполнения —
 * врать про остальные.
 */
export function groupTitle(variants: ProductVariantResponse[]): string {
  const [first, ...rest] = variants;
  if (!first) return '';
  if (rest.length === 0) return first.name;

  let end = first.name.length;
  for (const variant of rest) {
    let i = 0;
    while (i < end && i < variant.name.length && first.name[i] === variant.name[i]) i += 1;
    end = i;
  }

  return first.name.slice(0, end).replace(/[\s,;:—-]+$/, '');
}
