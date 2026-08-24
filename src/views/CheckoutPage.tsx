'use client';

import { useEffect, useState } from 'react';
import type { FocusEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { RequiredMark } from '@/admin/components/RequiredMark';
import { DELIVERY_METHODS, PAYMENT_METHODS } from '@/utils/orderLabels';
import { PHONE_PREFIX, formatPhone, isValidPhone, phoneDigits, toPhoneE164 } from '@/utils/phone';

/** Поля, которые проверяем на клиенте: у каждого своя русская ошибка под полем. */
type RequiredField = 'firstName' | 'lastName' | 'email' | 'phone' | 'address';

type FormErrors = Partial<Record<RequiredField, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FIELD_INPUT_ID: Record<RequiredField, string> = {
  firstName: 'co-first-name',
  lastName: 'co-last-name',
  email: 'co-email',
  phone: 'co-phone',
  address: 'co-address',
};

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
  phone: PHONE_PREFIX,
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
  const [errors, setErrors] = useState<FormErrors>({});
  const [agreed, setAgreed] = useState(false);

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

  // Самовывозу адрес не нужен — обязателен он только курьерской доставке.
  const addressRequired = form.deliveryMethod === 'COURIER';

  function handlePhoneChange(raw: string) {
    clearError('phone');
    setForm((f) => {
      const formatted = formatPhone(raw);
      // Backspace на разделителе маски даёт ту же строку, и поле переставало
      // стираться — в этом случае убираем ещё и цифру перед разделителем.
      const isStuck = formatted === f.phone && raw.length < f.phone.length;
      return { ...f, phone: isStuck ? formatPhone(phoneDigits(raw).slice(0, -1)) : formatted };
    });
  }

  /**
   * По Tab браузер выделяет содержимое поля целиком, и заполненный префикс +375 выглядит так,
   * будто следующая цифра его сотрёт. Схлопываем такое выделение в курсор в конце строки;
   * клик мышью не трогаем — там выделения нет и позиция каретки уже выбрана пользователем.
   */
  function handlePhoneFocus(event: FocusEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    requestAnimationFrame(() => {
      if (input.selectionStart === 0 && input.selectionEnd === input.value.length) {
        input.setSelectionRange(input.value.length, input.value.length);
      }
    });
  }

  function clearError(field: RequiredField) {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  function errorFor(field: RequiredField) {
    return errors[field] ?? fieldError(mutation.error, field);
  }

  // Свои сообщения вместо нативных подсказок браузера: те приходят на языке браузера,
  // а сайт русский. Поэтому у формы noValidate, а обязательность полей проверяем здесь.
  function validate(): FormErrors {
    const found: FormErrors = {};
    if (!form.firstName.trim()) found.firstName = 'Укажите имя';
    if (!form.lastName.trim()) found.lastName = 'Укажите фамилию';
    if (!form.email.trim()) found.email = 'Укажите email — на него придёт письмо о заказе';
    else if (!EMAIL_RE.test(form.email.trim())) found.email = 'Похоже, в адресе опечатка';
    if (!isValidPhone(form.phone)) found.phone = `Введите действительный номер телефона`;
    if (addressRequired && !form.address.trim()) found.address = 'Укажите адрес доставки';
    return found;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Промокод, который сервер уже отклонил, отправлять незачем: заказ вернёт 409.
    // Пусть покупатель сначала уберёт его в корзине.
    if (discount.isRejected) return;

    const found = validate();
    setErrors(found);
    const firstInvalid = (Object.keys(found) as RequiredField[])[0];
    if (firstInvalid) {
      document.getElementById(FIELD_INPUT_ID[firstInvalid])?.focus();
      return;
    }

    const body: OrderRequest = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: toPhoneE164(form.phone),
      address: form.address.trim() || null,
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
        <form className="admin-form checkout-page__form" onSubmit={handleSubmit} noValidate>
          {formError(mutation.error) && <div className="admin-banner-error">{formError(mutation.error)}</div>}

          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="co-first-name">Имя<RequiredMark /></label>
              <input
                id="co-first-name"
                className="filter-text-input"
                value={form.firstName}
                onChange={(e) => {
                  clearError('firstName');
                  setForm((f) => ({ ...f, firstName: e.target.value }));
                }}
                required
              />
              {errorFor('firstName') && <span className="admin-form-error">{errorFor('firstName')}</span>}
            </div>
            <div className="admin-form-field">
              <label htmlFor="co-last-name">Фамилия<RequiredMark /></label>
              <input
                id="co-last-name"
                className="filter-text-input"
                value={form.lastName}
                onChange={(e) => {
                  clearError('lastName');
                  setForm((f) => ({ ...f, lastName: e.target.value }));
                }}
                required
              />
              {errorFor('lastName') && <span className="admin-form-error">{errorFor('lastName')}</span>}
            </div>
          </div>

          <div className="admin-form-row checkout-page__row--stacked">
            <div className="admin-form-field">
              <label htmlFor="co-email">Email<RequiredMark /></label>
              <input
                id="co-email"
                type="email"
                className="filter-text-input"
                value={form.email}
                onChange={(e) => {
                  clearError('email');
                  setForm((f) => ({ ...f, email: e.target.value }));
                }}
                required
              />
              {errorFor('email') && <span className="admin-form-error">{errorFor('email')}</span>}
            </div>
            <div className="admin-form-field">
              <label htmlFor="co-phone">Телефон<RequiredMark /></label>
              <input
                id="co-phone"
                type="tel"
                inputMode="tel"
                className="filter-text-input mono-num"
                value={form.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                onFocus={handlePhoneFocus}
                required
              />
              {errorFor('phone') && <span className="admin-form-error">{errorFor('phone')}</span>}
            </div>
          </div>

          <div className="admin-form-field">
            <label htmlFor="co-address">Адрес{addressRequired && <RequiredMark />}</label>
            <input
              id="co-address"
              className="filter-text-input"
              value={form.address}
              onChange={(e) => {
                clearError('address');
                setForm((f) => ({ ...f, address: e.target.value }));
              }}
              required={addressRequired}
            />
            {errorFor('address') && <span className="admin-form-error">{errorFor('address')}</span>}
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

          <div className="admin-form-row checkout-page__row--stacked">
            <div className="admin-form-field">
              <label htmlFor="co-delivery">Способ доставки</label>
              <Select
                id="co-delivery"
                options={DELIVERY_METHODS}
                value={form.deliveryMethod}
                onChange={(value) => {
                  clearError('address');
                  setForm((f) => ({ ...f, deliveryMethod: value }));
                }}
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

          <label className="admin-form-checkbox checkout-page__terms">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>
              Ознакомлен с{' '}
              <Link href="/terms" target="_blank" rel="noopener noreferrer">
                пользовательским соглашением
              </Link>{' '}
              и согласен с{' '}
              <Link href="/privacy" target="_blank" rel="noopener noreferrer">
                обработкой персональных данных
              </Link>
            </span>
          </label>

          <Button type="submit" disabled={mutation.isPending || discount.isRejected || !agreed}>
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
