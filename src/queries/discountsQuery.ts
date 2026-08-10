import type { CatalogProductsQuery } from '@/api/types';
import type { CatalogQueryOptions } from '@/hooks/catalogQuery';

export const DISCOUNTS_QUERY: CatalogProductsQuery = {
  discounted: true,
  sort: 'DISCOUNT_DESC',
  size: 8,
};

export const DISCOUNTS_PAGE_OPTIONS: CatalogQueryOptions = {
  discounted: true,
  defaultSort: 'DISCOUNT_DESC',
};
