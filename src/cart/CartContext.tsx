'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { CartContext, type CartContextValue, type CartItem } from './cart-context';

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
  const hydrated = useRef(false);

  useEffect(() => {
    // Это и есть паттерн гидрации: localStorage существует только в браузере,
    // поэтому первый рендер обязан совпасть с серверным (пустая корзина), а
    // реальное содержимое подставляется ровно одним дополнительным рендером
    // после монтирования. Читать хранилище в инициализаторе useState нельзя —
    // на сервере это падение, на клиенте расхождение при гидрации.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(loadCart());
    setPromoCodeState(window.localStorage.getItem(PROMO_STORAGE_KEY));
    hydrated.current = true;
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // Без этой проверки первый прогон эффекта затёр бы сохранённую корзину
    // пустым массивом ещё до того, как её успели прочитать.
    if (!hydrated.current) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (!hydrated.current) return;
    if (promoCode) {
      window.localStorage.setItem(PROMO_STORAGE_KEY, promoCode);
    } else {
      window.localStorage.removeItem(PROMO_STORAGE_KEY);
    }
  }, [promoCode]);

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

  const value = useMemo<CartContextValue>(() => {
    const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);
    const totalPrice = items.reduce((sum, i) => sum + i.quantity * i.price, 0);
    return {
      items,
      isHydrated,
      totalCount,
      totalPrice,
      promoCode,
      addItem,
      removeItem,
      setQuantity,
      setPromoCode,
      clearPromoCode,
      clear,
    };
  }, [items, isHydrated, promoCode, addItem, removeItem, setQuantity, setPromoCode, clearPromoCode, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
