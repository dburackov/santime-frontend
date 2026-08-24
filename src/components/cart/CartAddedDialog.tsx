'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import './CartAddedDialog.css';
import { Button } from '@/components/ui/Button';
import { ProductPhoto } from '@/components/ui/ProductPhoto';
import { CloseIcon } from '@/components/ui/icons';
import { useCart } from '@/cart/useCart';

/**
 * Подтверждение добавления в корзину. Монтируется один раз на витрину, а что
 * показывать — решает CartProvider: он же поднимает диалог из любой точки,
 * которая зовёт addItem.
 */
export function CartAddedDialog() {
  const { addedItem, dismissAddedDialog } = useCart();
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const open = addedItem != null;

  useEffect(() => {
    if (!open) return;
    document.body.classList.add('no-scroll');
    return () => document.body.classList.remove('no-scroll');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') dismissAddedDialog();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, dismissAddedDialog]);

  // Фокус на контейнер, а не на кнопку: скринридер прочитает заголовок целиком,
  // а на мобильном не дёргается вьюпорт. Тот же приём, что в ProductLightbox.
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    if (previous && !dialogRef.current?.contains(previous)) {
      restoreRef.current = previous;
    }
    dialogRef.current?.focus();

    return () => {
      const target = restoreRef.current;
      if (target && document.contains(target)) target.focus();
    };
  }, [open]);

  if (!addedItem) return null;

  return (
    <div className="cart-added">
      <div className="cart-added__backdrop" onClick={() => dismissAddedDialog()} />
      <div
        ref={dialogRef}
        className="cart-added__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-added-title"
        tabIndex={-1}
      >
        <button
          type="button"
          className="cart-added__close touch-target"
          onClick={() => dismissAddedDialog()}
          aria-label="Закрыть"
        >
          <CloseIcon width={18} height={18} />
        </button>

        <h2 className="cart-added__title" id="cart-added-title">
          Вы добавили товар в корзину
        </h2>

        <div className="cart-added__product">
          <ProductPhoto image={addedItem.image} alt={addedItem.productName} size="row" sizes="96px" />
          <span className="cart-added__name">{addedItem.productName}</span>
        </div>

        <div className="cart-added__actions">
          <Link href="/cart" className="btn btn--primary btn--md" onClick={() => dismissAddedDialog({ silent: true })}>
            Оформить заказ
          </Link>
          <Button variant="secondary" onClick={() => dismissAddedDialog()}>
            Продолжить покупки
          </Button>
        </div>
      </div>
    </div>
  );
}
