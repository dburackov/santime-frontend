import { apiRequest } from './client';
import type { OrderRequest, OrderResponse } from './types';

export function createOrder(body: OrderRequest): Promise<OrderResponse> {
  return apiRequest('/api/orders', { method: 'POST', body });
}
