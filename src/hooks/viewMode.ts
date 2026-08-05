/**
 * Чистая часть режима отображения каталога — без 'use client', потому что её
 * импортирует серверный компонент категории. Тот же приём разделения, что у
 * catalogQuery.ts (хелперы для сервера) и useCatalogQueryState.ts (хук).
 */

export type ViewMode = 'grid' | 'list';

export const VIEW_MODE_COOKIE = 'santime-view-mode';

/** Год: настройка не должна протухать между визитами. */
export const VIEW_MODE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Разбор значения куки. Общий для сервера и клиента: если правила разъедутся,
 * вернётся то самое несовпадение разметки, ради устранения которого режим и
 * переехал в куку.
 */
export function parseViewMode(value: string | undefined): ViewMode {
  return value === 'list' ? 'list' : 'grid';
}
