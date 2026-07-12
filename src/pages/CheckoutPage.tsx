import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import './CheckoutPage.css';
import '@/admin/admin.css';
import '@/components/filters/Filters.css';
import { useCart } from '@/cart/useCart';
import { createOrder } from '@/api/orders';
import type { OrderRequest } from '@/api/types';
import { Price } from '@/components/ui/Price';
import { Button } from '@/components/ui/Button';
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
  const { items, totalPrice, clear } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const mutation = useMutation({
    mutationFn: (body: OrderRequest) => createOrder(body),
    onSuccess: (order) => {
      clear();
      navigate('/order-confirmation', { state: { order } });
    },
  });

  if (items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
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
              <select
                id="co-delivery"
                className="filter-select"
                value={form.deliveryMethod}
                onChange={(e) => setForm((f) => ({ ...f, deliveryMethod: e.target.value }))}
              >
                {DELIVERY_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-form-field">
              <label htmlFor="co-payment">Способ оплаты</label>
              <select
                id="co-payment"
                className="filter-select"
                value={form.paymentMethod}
                onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
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

          <Button type="submit" disabled={mutation.isPending}>
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
          <div className="checkout-page__total">
            <span>Итого</span>
            <Price value={totalPrice} size="lg" />
          </div>
        </aside>
      </div>
    </div>
  );
}
