import { apiRequest } from './client';
import type { CatalogFetchOptions } from './catalog';
import type { PromoCodeBannerResponse } from './types';

/** Промокоды для слайдера на витрине. */
export function getPublicPromoCodes(opts: CatalogFetchOptions = {}): Promise<PromoCodeBannerResponse[]> {
  return apiRequest('/api/promo-codes/public', opts);
}
