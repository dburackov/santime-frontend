import { createContext } from 'react';
import type { AttributeValue, ProductImageResponse } from '@/api/types';

export interface CartItem {
  variantId: number;
  variantSlug: string;
  productName: string;
  price: number;
  quantity: number;
  /** снапшот ключевых атрибутов на момент добавления, для отображения в корзине */
  attributes: Record<string, AttributeValue>;
  /** снапшот главного фото на момент добавления, если оно было у товара */
  image?: ProductImageResponse | null;
}

export interface CartContextValue {
  items: CartItem[];
  /**
   * Прочитана ли корзина из localStorage. До этого `items` заведомо пуст (на
   * сервере хранилища нет), поэтому решения вида «корзина пустая — уводим на
   * /cart» до гидрации принимать нельзя.
   */
  isHydrated: boolean;
  totalCount: number;
  totalPrice: number;
  /**
   * Введённый покупателем промокод — только строка. Сумма скидки здесь
   * намеренно не хранится: корзину можно поменять в любой момент, и сохранённая
   * скидка тут же станет враньём. Актуальную считает сервер, см. usePromoDiscount.
   */
  promoCode: string | null;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (variantId: number) => void;
  setQuantity: (variantId: number, quantity: number) => void;
  setPromoCode: (code: string) => void;
  clearPromoCode: () => void;
  clear: () => void;
}

export const CartContext = createContext<CartContextValue | null>(null);
