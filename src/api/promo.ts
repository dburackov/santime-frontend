import { apiRequest } from './client';
import type { CatalogFetchOptions } from './catalog';
import type {
  PromoCodeBannerResponse,
  PromoCodeValidateRequest,
  PromoCodeValidateResponse,
} from './types';

/** Промокоды для слайдера на витрине. */
export function getPublicPromoCodes(opts: CatalogFetchOptions = {}): Promise<PromoCodeBannerResponse[]> {
  return apiRequest('/api/promo-codes/public', opts);
}

/**
 * Предпросмотр скидки по составу корзины. Отвечает 200 и при отказе — причина
 * лежит в теле (`valid: false`, `reason`), исключение прилетит только на
 * несуществующий вариант товара.
 */
export function validatePromoCode(body: PromoCodeValidateRequest): Promise<PromoCodeValidateResponse> {
  return apiRequest('/api/promo-codes/validate', { method: 'POST', body });
}
