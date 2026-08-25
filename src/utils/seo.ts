import { SITE_NAME } from '@/config/siteInfo';
import { formatPrice } from '@/utils/price';
import type { CategoryResponse, VariantDetailResponse } from '@/api/types';

export interface ResolvedMeta {
  title: string;
  description: string;
}

/** Рекомендуемая длина description в выдаче. Мягкая: длиннее обрезается по границе слова. */
export const META_DESCRIPTION_LIMIT = 160;

function truncate(text: string, limit: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= limit) return normalized;
  const cut = normalized.slice(0, limit - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * Метаданные страницы товара — всегда генерируются, хранимых переопределений нет.
 *
 * Заголовок — имя самой позиции: оно уже содержит различающее значение
 * («Смеситель Grohe Essence, хром»), поэтому склеивать его с осями не нужно.
 *
 * Описание группы в сниппет намеренно не попадает: оно общее для всех исполнений.
 * На самой странице и в JSON-LD оно, разумеется, остаётся.
 *
 * Название магазина дописывает шаблон из app/layout.tsx. Порядок частей важен:
 * различающая информация идёт первой, чтобы при усечении в выдаче терялся хвост
 * с доставкой, а не идентичность товара.
 */
export function resolveProductMeta(variant: VariantDetailResponse): ResolvedMeta {
  const title = variant.name;

  // Формат тот же, что показывает компонент Price, чтобы цена в сниппете
  // совпадала с ценой на странице.
  const description = `${title}. Цена ${formatPrice(variant.price)} BYN. Доставка по Беларуси, гарантия.`;

  return { title, description: truncate(description, META_DESCRIPTION_LIMIT) };
}

export function resolveCategoryMeta(category: CategoryResponse): ResolvedMeta {
  // Двоеточие, а не тире: тире уже добавляет шаблон заголовка из app/layout.tsx,
  // и два подряд читались бы плохо.
  const title = `${category.name}: каталог и цены`;
  const description = `Купить ${category.name.toLowerCase()} в интернет-магазине ${SITE_NAME}. Широкий выбор, гарантия, доставка по Беларуси.`;

  return { title, description: truncate(description, META_DESCRIPTION_LIMIT) };
}
