'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import './PromoCodeField.css';
import { useCart } from '@/cart/useCart';
import { usePromoDiscount } from '@/cart/usePromoDiscount';
import { Button } from '@/components/ui/Button';
import { Price } from '@/components/ui/Price';
import { CloseIcon } from '@/components/ui/icons';

export function PromoCodeField() {
  const { promoCode, setPromoCode, clearPromoCode } = useCart();
  const discount = usePromoDiscount();
  const [draft, setDraft] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const code = draft.trim();
    if (!code) return;
    setPromoCode(code);
    setDraft('');
  }

  if (promoCode && discount.isApplied) {
    return (
      <div className="promo-field">
        <div className="promo-field__applied">
          <span className="promo-field__applied-text">
            Промокод <span className="promo-field__code">{promoCode}</span> — скидка{' '}
            <Price value={discount.discountAmount} size="sm" />
          </span>
          <button
            type="button"
            className="promo-field__remove touch-target"
            onClick={clearPromoCode}
            aria-label="Убрать промокод"
          >
            <CloseIcon width={14} height={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="promo-field">
      <form className="promo-field__form" onSubmit={handleSubmit}>
        <div className="promo-field__control">
          <input
            className="promo-field__input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Промокод"
            aria-label="Промокод"
            autoComplete="off"
          />
        </div>
        <Button type="submit" variant="secondary" size="sm" disabled={discount.isPending || !draft.trim()}>
          {discount.isPending ? 'Проверяем...' : 'Применить'}
        </Button>
      </form>

      {promoCode && discount.isRejected && (
        <span className="admin-form-error promo-field__error">{discount.message}</span>
      )}
    </div>
  );
}
