// Модуль намеренно без 'use client': ключ импортирует и серверная страница товара
// для префетча (см. kitsQueryKeys.ts).
export const similarProductsQueryKey = (variantSlug: string) => ['similar-products', variantSlug];
