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

/**
 * Действия отделены от состояния намеренно: объект действий стабилен, и
 * подписчики вроде карточки товара (их в сетке до 24) не перерисовываются при
 * каждом изменении корзины. Состояние живёт в CartContext, действия — в
 * CartActionsContext; CartContextValue объединяет оба для тех, кому нужно всё.
 */
export interface AddItemOptions {
  /** Не поднимать диалог подтверждения: место добавления показывает отклик само. */
  silent?: boolean;
}

export interface CartActions {
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number, options?: AddItemOptions) => void;
  removeItem: (variantId: number) => void;
  setQuantity: (variantId: number, quantity: number) => void;
  setPromoCode: (code: string) => void;
  clearPromoCode: () => void;
  clear: () => void;
  /** Закрыть диалог «товар добавлен»; по умолчанию даёт пульс кнопке корзины. */
  dismissAddedDialog: (options?: { silent?: boolean }) => void;
}

export interface CartContextValue extends CartActions {
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
  /** Товар для диалога подтверждения; null — диалога нет. */
  addedItem: CartItem | null;
  /**
   * Счётчик-сигнал для анимации кнопки корзины: растёт на каждое событие,
   * которое должно её подсветить. Значение само по себе ничего не значит.
   */
  pulseToken: number;
}

export const CartContext = createContext<CartContextValue | null>(null);
export const CartActionsContext = createContext<CartActions | null>(null);

/**
 * Только состав корзины — набор variantId. Отдельно от CartContext, потому что
 * карточкам каталога (в сетке их до 24) нужно знать лишь «этот товар уже внутри»:
 * значение здесь меняется, когда меняется состав, а не количество или промокод.
 */
export const CartItemIdsContext = createContext<Set<number> | null>(null);
