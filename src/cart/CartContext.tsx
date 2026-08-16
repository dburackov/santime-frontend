'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  CartActionsContext,
  CartContext,
  type CartActions,
  type CartContextValue,
  type CartItem,
} from './cart-context';

const STORAGE_KEY = 'santime-cart';
const PROMO_STORAGE_KEY = 'santime-promo';

function loadCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  // Стартуем всегда с пустой корзины: на сервере localStorage нет, а если
  // читать его в инициализаторе useState, серверная и клиентская разметка
  // разойдутся. Настоящее содержимое подтягивается эффектом после монтирования.
  const [items, setItems] = useState<CartItem[]>([]);
  const [promoCode, setPromoCodeState] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Это и есть паттерн гидрации: localStorage существует только в браузере,
    // поэтому первый рендер обязан совпасть с серверным (пустая корзина), а
    // реальное содержимое подставляется ровно одним дополнительным рендером
    // после монтирования. Читать хранилище в инициализаторе useState нельзя —
    // на сервере это падение, на клиенте расхождение при гидрации.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(loadCart());
    setPromoCodeState(window.localStorage.getItem(PROMO_STORAGE_KEY));
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // Сторожем должно быть состояние, а не ref: ref выставлялся в соседнем
    // эффекте и к первому прогону этого был уже true, а items в том же коммите
    // ещё пуст — прочитанная корзина тут же затиралась пустым массивом. В dev
    // со StrictMode это стоило корзины на каждой перезагрузке: повторный прогон
    // эффекта гидрации читал уже затёртое хранилище.
    if (!isHydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (promoCode) {
      window.localStorage.setItem(PROMO_STORAGE_KEY, promoCode);
    } else {
      window.localStorage.removeItem(PROMO_STORAGE_KEY);
    }
  }, [promoCode, isHydrated]);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === item.variantId);
      if (existing) {
        return prev.map((i) =>
          i.variantId === item.variantId ? { ...i, quantity: i.quantity + quantity } : i,
        );
      }
      return [...prev, { ...item, quantity }];
    });
  }, []);

  const removeItem = useCallback((variantId: number) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  }, []);

  const setQuantity = useCallback((variantId: number, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.variantId !== variantId);
      return prev.map((i) => (i.variantId === variantId ? { ...i, quantity } : i));
    });
  }, []);

  // Код нормализуем сразу: сервер всё равно приводит его к верхнему регистру,
  // и без этого «summer» и «SUMMER» дали бы два разных ключа запроса.
  const setPromoCode = useCallback((code: string) => setPromoCodeState(code.trim().toUpperCase()), []);

  const clearPromoCode = useCallback(() => setPromoCodeState(null), []);

  const clear = useCallback(() => {
    setItems([]);
    setPromoCodeState(null);
  }, []);

  // Все шесть колбэков стабильны, поэтому объект действий создаётся один раз за
  // жизнь провайдера: подписчики useCartActions переживают изменения корзины без
  // единого лишнего рендера.
  const actions = useMemo<CartActions>(
    () => ({ addItem, removeItem, setQuantity, setPromoCode, clearPromoCode, clear }),
    [addItem, removeItem, setQuantity, setPromoCode, clearPromoCode, clear],
  );

  const value = useMemo<CartContextValue>(() => {
    const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);
    const totalPrice = items.reduce((sum, i) => sum + i.quantity * i.price, 0);
    return { items, isHydrated, totalCount, totalPrice, promoCode, ...actions };
  }, [items, isHydrated, promoCode, actions]);

  return (
    <CartActionsContext.Provider value={actions}>
      <CartContext.Provider value={value}>{children}</CartContext.Provider>
    </CartActionsContext.Provider>
  );
}
