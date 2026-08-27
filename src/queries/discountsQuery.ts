import type { CatalogProductsQuery } from '@/api/types';
import { STOREFRONT_BLOCK_SIZE } from '@/hooks/catalogQuery';
import type { CatalogQueryOptions } from '@/hooks/catalogQuery';

export const DISCOUNTS_QUERY: CatalogProductsQuery = {
  discounted: true,
  sort: 'DISCOUNT_DESC',
  size: STOREFRONT_BLOCK_SIZE,
};

export const DISCOUNTS_PAGE_OPTIONS: CatalogQueryOptions = {
  discounted: true,
  defaultSort: 'DISCOUNT_DESC',
  allowedSorts: ['DISCOUNT_DESC', 'PRICE_ASC', 'PRICE_DESC'],
};
