import type { CategoryResponse } from '@/api/types';

/**
 * Путь от корня до категории включительно. Цикл в родителях бэкенд не проверяет,
 * поэтому подъём ограничен множеством уже пройденных id.
 */
export function buildCategoryPath(
  categories: CategoryResponse[],
  categoryId: number,
): CategoryResponse[] {
  const byId = new Map(categories.map((category) => [category.id, category]));

  const path: CategoryResponse[] = [];
  const seen = new Set<number>();

  let current = byId.get(categoryId);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    path.push(current);
    current = current.parentCategoryId != null ? byId.get(current.parentCategoryId) : undefined;
  }

  return path.reverse();
}

export function getSubcategories(
  categories: CategoryResponse[],
  categoryId: number,
): CategoryResponse[] {
  return categories.filter((category) => category.parentCategoryId === categoryId);
}
