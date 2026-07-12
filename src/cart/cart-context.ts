import { createContext } from 'react';
import type { AttributeValue } from '@/api/types';

export interface CartItem {
  variantId: number;
  variantSlug: string;
  productName: string;
  price: number;
  quantity: number;
  /** снапшот ключевых атрибутов на момент добавления, для отображения в корзине */
  attributes: Record<string, AttributeValue>;
}

export interface CartContextValue {
  items: CartItem[];
  totalCount: number;
  totalPrice: number;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (variantId: number) => void;
  setQuantity: (variantId: number, quantity: number) => void;
  clear: () => void;
}

export const CartContext = createContext<CartContextValue | null>(null);
