import { SITE_NAME } from '@/config/siteInfo';
import type { CategoryResponse, VariantDetailResponse } from '@/api/types';

export interface ResolvedMeta {
  title: string;
  description: string;
}

/** Рекомендуемая длина description в выдаче. Мягкая: длиннее обрезается по границе слова. */
export const META_DESCRIPTION_LIMIT = 160;

/** Тот же формат, что показывает компонент Price, чтобы в сниппете не всплывало «159.0». */
const priceFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

/**
 * Значения атрибутов, которыми текущий вариант отличается от соседних —
 * например «чёрный» для одного из цветов смесителя. Берутся из variantOptions,
 * где бэкенд уже пометил текущий вариант флагом current.
 */
function distinguishingValues(variant: VariantDetailResponse): string[] {
  return variant.variantOptions
    .map((group) => group.options.find((option) => option.current)?.value)
    .filter((value): value is string => Boolean(value));
}

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
 * Причина в том, что URL повариантные, а редактировать meta удобно на товаре —
 * и тогда одно значение растиражировалось бы на все его варианты, то есть создало
 * бы ровно те дубли, которых мы избегаем. Генерация же различает варианты:
 * заголовок несёт различающий атрибут, описание — ещё и цену.
 *
 * Описание товара в сниппет намеренно не попадает: оно общее для вариантов.
 * На самой странице и в JSON-LD оно, разумеется, остаётся.
 *
 * Название магазина дописывает шаблон из app/layout.tsx. Порядок частей важен:
 * различающая информация идёт первой, чтобы при усечении в выдаче терялся хвост
 * с доставкой, а не идентичность товара.
 */
export function resolveProductMeta(variant: VariantDetailResponse): ResolvedMeta {
  const values = distinguishingValues(variant);
  const title =
    values.length > 0 ? `${variant.productName}, ${values.join(', ')}` : variant.productName;

  const description = `${title}. Цена ${priceFormatter.format(variant.price)} BYN. Доставка по Беларуси, гарантия.`;

  return { title, description: truncate(description, META_DESCRIPTION_LIMIT) };
}

export function resolveCategoryMeta(category: CategoryResponse): ResolvedMeta {
  // Двоеточие, а не тире: тире уже добавляет шаблон заголовка из app/layout.tsx,
  // и два подряд читались бы плохо.
  const title = `${category.name}: каталог и цены`;
  const description = `Купить ${category.name.toLowerCase()} в интернет-магазине ${SITE_NAME}. Широкий выбор, честные характеристики, доставка по Беларуси.`;

  return { title, description: truncate(description, META_DESCRIPTION_LIMIT) };
}
