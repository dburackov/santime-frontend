'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { saveLastOrder } from '@/cart/lastOrder';
import './CheckoutPage.css';
import '@/admin/admin.css';
import '@/components/filters/Filters.css';
import { useCart } from '@/cart/useCart';
import { usePromoDiscount } from '@/cart/usePromoDiscount';
import { createOrder } from '@/api/orders';
import type { OrderRequest } from '@/api/types';
import { Price } from '@/components/ui/Price';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { fieldError, formError } from '@/admin/formErrors';

const PAYMENT_METHODS = [
  { value: 'CARD', label: 'Картой онлайн' },
  { value: 'CASH', label: 'Наличными при получении' },
];

const DELIVERY_METHODS = [
  { value: 'COURIER', label: 'Курьером' },
  { value: 'PICKUP', label: 'Самовывоз' },
];

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  paymentMethod: string;
  deliveryMethod: string;
  comment: string;
}

const EMPTY_FORM: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  postalCode: '',
  city: '',
  paymentMethod: PAYMENT_METHODS[0].value,
  deliveryMethod: DELIVERY_METHODS[0].value,
  comment: '',
};

export function CheckoutPage() {
  const { items, isHydrated, totalPrice, promoCode, clear } = useCart();
  const discount = usePromoDiscount();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const mutation = useMutation({
    mutationFn: (body: OrderRequest) => createOrder(body),
    onSuccess: (order) => {
      saveLastOrder(order);
      clear();
      router.replace('/order-confirmation');
    },
  });

  // Пустую корзину оформлять нечего — уводим назад. Раньше это был <Navigate>,
  // в Next перенаправление клиентского компонента идёт эффектом.
  //
  // isSuccess в условии обязателен: сразу после оформления clear() опустошает
  // корзину, и без этой оговорки редирект увёл бы с подтверждения обратно в /cart.
  // isHydrated обязателен: до чтения localStorage корзина всегда пуста, и без
  // этой проверки редирект срабатывал бы даже на заполненной корзине.
  const cartIsEmpty = isHydrated && items.length === 0 && !mutation.isSuccess;

  useEffect(() => {
    if (cartIsEmpty) router.replace('/cart');
  }, [cartIsEmpty, router]);

  if (!isHydrated || cartIsEmpty) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Промокод, который сервер уже отклонил, отправлять незачем: заказ вернёт 409.
    // Пусть покупатель сначала уберёт его в корзине.
    if (discount.isRejected) return;

    const body: OrderRequest = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email || null,
      phone: form.phone || null,
      address: form.address || null,
      postalCode: form.postalCode || null,
      city: form.city || null,
      paymentMethod: form.paymentMethod,
      deliveryMethod: form.deliveryMethod,
      comment: form.comment || null,
      promoCode: promoCode || null,
      items: items.map((item) => ({ productVariantId: item.variantId, quantity: item.quantity })),
    };
    mutation.mutate(body);
  }

  return (
    <div className="container checkout-page">
      <h1 className="checkout-page__title">Оформление заказа</h1>

      <div className="checkout-page__layout">
        <form className="admin-form checkout-page__form" onSubmit={handleSubmit}>
          {formError(mutation.error) && <div className="admin-banner-error">{formError(mutation.error)}</div>}

          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="co-first-name">Имя</label>
              <input
                id="co-first-name"
                className="filter-text-input"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                required
              />
              {fieldError(mutation.error, 'firstName') && (
                <span className="admin-form-error">{fieldError(mutation.error, 'firstName')}</span>
              )}
            </div>
            <div className="admin-form-field">
              <label htmlFor="co-last-name">Фамилия</label>
              <input
                id="co-last-name"
                className="filter-text-input"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                required
              />
              {fieldError(mutation.error, 'lastName') && (
                <span className="admin-form-error">{fieldError(mutation.error, 'lastName')}</span>
              )}
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="co-email">Email</label>
              <input
                id="co-email"
                type="email"
                className="filter-text-input"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              {fieldError(mutation.error, 'email') && (
                <span className="admin-form-error">{fieldError(mutation.error, 'email')}</span>
              )}
            </div>
            <div className="admin-form-field">
              <label htmlFor="co-phone">Телефон</label>
              <input
                id="co-phone"
                type="tel"
                className="filter-text-input"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="admin-form-field">
            <label htmlFor="co-address">Адрес</label>
            <input
              id="co-address"
              className="filter-text-input"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
          </div>

          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="co-city">Город</label>
              <input
                id="co-city"
                className="filter-text-input"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              />
            </div>
            <div className="admin-form-field">
              <label htmlFor="co-postal">Индекс</label>
              <input
                id="co-postal"
                className="filter-text-input mono-num"
                value={form.postalCode}
                onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
              />
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="co-delivery">Способ доставки</label>
              <Select
                id="co-delivery"
                options={DELIVERY_METHODS}
                value={form.deliveryMethod}
                onChange={(value) => setForm((f) => ({ ...f, deliveryMethod: value }))}
                ariaLabel="Способ доставки"
              />
            </div>
            <div className="admin-form-field">
              <label htmlFor="co-payment">Способ оплаты</label>
              <Select
                id="co-payment"
                options={PAYMENT_METHODS}
                value={form.paymentMethod}
                onChange={(value) => setForm((f) => ({ ...f, paymentMethod: value }))}
                ariaLabel="Способ оплаты"
              />
            </div>
          </div>

          <div className="admin-form-field">
            <label htmlFor="co-comment">Комментарий к заказу</label>
            <textarea
              id="co-comment"
              value={form.comment}
              onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
            />
          </div>

          <Button type="submit" disabled={mutation.isPending || discount.isRejected}>
            {mutation.isPending ? 'Оформляем...' : 'Подтвердить заказ'}
          </Button>
        </form>

        <aside className="checkout-page__summary">
          <h2>Ваш заказ</h2>
          <ul className="checkout-page__items">
            {items.map((item) => (
              <li key={item.variantId} className="checkout-page__item">
                <span className="checkout-page__item-name">
                  {item.productName} <span className="mono-num">× {item.quantity}</span>
                </span>
                <Price value={item.price * item.quantity} size="sm" />
              </li>
            ))}
          </ul>

          {discount.isApplied && (
            <>
              <div className="checkout-page__line">
                <span>Товары</span>
                <Price value={totalPrice} size="sm" />
              </div>
              <div className="checkout-page__line checkout-page__line--discount">
                <span>
                  Промокод <span className="checkout-page__promo-code">{promoCode}</span>
                </span>
                <span className="checkout-page__discount-value">
                  −<Price value={discount.discountAmount} size="sm" />
                </span>
              </div>
            </>
          )}

          <div className="checkout-page__total">
            <span>Итого</span>
            {discount.isApplied ? (
              <span className="checkout-page__total-values">
                <Price value={totalPrice} size="sm" className="checkout-page__old-price" />
                <Price value={discount.totalPrice} size="lg" />
              </span>
            ) : (
              <Price value={totalPrice} size="lg" />
            )}
          </div>

          {discount.isRejected && (
            <div className="admin-banner-error checkout-page__promo-error">
              {discount.message} Уберите или замените промокод в корзине.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
