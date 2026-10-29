import { apiRequest } from './client';
import type { CartQuoteRequest, CartQuoteResponse } from './types';

export function quoteCart(body: CartQuoteRequest): Promise<CartQuoteResponse> {
  return apiRequest('/api/cart/quote', { method: 'POST', body });
}
