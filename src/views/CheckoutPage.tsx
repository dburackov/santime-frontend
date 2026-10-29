'use client';

import { useEffect, useState } from 'react';
import type { FocusEvent, FormEvent, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { saveLastOrder } from '@/cart/lastOrder';
import './CheckoutPage.css';
import { useCart } from '@/cart/useCart';
import { usePromoDiscount } from '@/cart/usePromoDiscount';
import { createOrder } from '@/api/orders';
import type { OrderRequest } from '@/api/types';
import { Price } from '@/components/ui/Price';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CurrencySymbol } from '@/components/ui/CurrencySymbol';
import { ProductPhoto } from '@/components/ui/ProductPhoto';
import {
  AlertIcon,
  ArrowRightIcon,
  BanknoteIcon,
  BoxIcon,
  CardCheckIcon,
  ClockIcon,
  PlusIcon,
  TruckIcon,
  WarehouseIcon,
} from '@/components/ui/icons';
import { fieldError, formError } from '@/admin/formErrors';
import { CARRIER, COURIER, PICKUP, isCourierFree } from '@/config/delivery';
import { formatPrice } from '@/utils/price';
import { formatProductsCount } from '@/utils/plural';
import { PHONE_PREFIX, formatPhone, isValidPhone, phoneDigits, toPhoneE164 } from '@/utils/phone';

type DeliveryMethod = 'COURIER' | 'PICKUP' | 'CARRIER';

/** Поля, которые проверяем на клиенте: у каждого своя русская ошибка под полем. */
type CheckedField = 'firstName' | 'phone' | 'email' | 'address' | 'city' | 'agreed';

type FormErrors = Partial<Record<CheckedField, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FIELD_INPUT_ID: Record<CheckedField, string> = {
  firstName: 'co-first-name',
  phone: 'co-phone',
  email: 'co-email',
  address: 'co-address',
  city: 'co-city',
  agreed: 'co-agreed',
};

const CRUMBS = [{ label: 'Главная', to: '/' }, { label: 'Корзина', to: '/cart' }, { label: 'Оформление заказа' }];

const PAYMENT_OPTIONS = [
  {
    value: 'CASH',
    icon: <BanknoteIcon width={20} height={20} strokeWidth={1.7} />,
    title: 'При получении',
    note: 'Наличными или картой',
  },
  {
    value: 'CARD',
    icon: <CardCheckIcon width={20} height={20} strokeWidth={1.7} />,
    title: 'Онлайн картой',
    note: 'Через систему E-POS',
  },
];

interface FormState {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  deliveryMethod: DeliveryMethod;
  address: string;
  city: string;
  postalCode: string;
  paymentMethod: string;
  comment: string;
}

const EMPTY_FORM: FormState = {
  firstName: '',
  lastName: '',
  phone: PHONE_PREFIX,
  email: '',
  deliveryMethod: 'COURIER',
  address: '',
  city: '',
  postalCode: '',
  paymentMethod: PAYMENT_OPTIONS[0].value,
  comment: '',
};

export function CheckoutPage() {
  const { items, isHydrated, totalPrice, promoCode, clear } = useCart();
  const discount = usePromoDiscount();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [agreed, setAgreed] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);

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

  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const payable = discount.isApplied ? discount.totalPrice : totalPrice;
  const courierFree = isCourierFree(payable);
  const delivery = form.deliveryMethod;

  const deliveryOptions: {
    value: DeliveryMethod;
    icon: ReactNode;
    title: string;
    price: ReactNode;
    free: boolean;
  }[] = [
    {
      value: 'COURIER',
      icon: <TruckIcon width={20} height={20} strokeWidth={1.7} />,
      title: 'Курьером',
      price: courierFree ? 'Бесплатно' : <>{formatPrice(COURIER.price)} <CurrencySymbol /></>,
      free: courierFree,
    },
    {
      value: 'PICKUP',
      icon: <WarehouseIcon width={20} height={20} strokeWidth={1.7} />,
      title: 'Самовывоз',
      price: 'Бесплатно',
      free: true,
    },
    {
      value: 'CARRIER',
      icon: <BoxIcon width={20} height={20} strokeWidth={1.7} />,
      title: 'Транспортной компанией',
      price: <>от {formatPrice(CARRIER.priceFrom)} <CurrencySymbol /></>,
      free: false,
    },
  ];

  const deliveryFree = delivery === 'PICKUP' || (delivery === 'COURIER' && courierFree);
  const deliverySummary =
    delivery === 'CARRIER' ? (
      'По тарифу ТК'
    ) : deliveryFree ? (
      'Бесплатно'
    ) : (
      <>
        {formatPrice(COURIER.price)} <CurrencySymbol />
      </>
    );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    if (key in FIELD_INPUT_ID) clearError(key as CheckedField);
    setForm((f) => ({ ...f, [key]: value }));
  }

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

  function clearError(field: CheckedField) {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  function errorFor(field: CheckedField) {
    return errors[field] ?? fieldError(mutation.error, field);
  }

  // Свои сообщения вместо нативных подсказок браузера: те приходят на языке браузера,
  // а сайт русский. Поэтому у формы noValidate, а обязательность полей проверяем здесь.
  function validate(): FormErrors {
    const found: FormErrors = {};
    if (!form.firstName.trim()) found.firstName = 'Укажите имя';
    if (!isValidPhone(form.phone)) found.phone = 'Введите номер полностью, например +375 29 123-45-67';
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) found.email = 'Похоже, в адресе опечатка';
    if (delivery === 'CARRIER' && !form.city.trim()) found.city = 'Укажите город';
    if (delivery !== 'PICKUP' && !form.address.trim()) found.address = 'Укажите адрес доставки';
    if (!agreed) found.agreed = 'Без согласия мы не сможем принять заказ';
    return found;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Промокод, который сервер уже отклонил, отправлять незачем: заказ вернёт 409.
    // Пусть покупатель сначала уберёт его в корзине.
    if (discount.isRejected) return;

    const found = validate();
    setErrors(found);
    const firstInvalid = (Object.keys(FIELD_INPUT_ID) as CheckedField[]).find((field) => found[field]);
    if (firstInvalid) {
      document.getElementById(FIELD_INPUT_ID[firstInvalid])?.focus();
      return;
    }

    const body: OrderRequest = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim() || null,
      email: form.email.trim() || null,
      phone: toPhoneE164(form.phone),
      address: delivery === 'PICKUP' ? null : form.address.trim(),
      city: delivery === 'CARRIER' ? form.city.trim() : null,
      postalCode: delivery === 'CARRIER' ? form.postalCode.trim() || null : null,
      paymentMethod: form.paymentMethod,
      deliveryMethod: delivery,
      comment: form.comment.trim() || null,
      promoCode: promoCode || null,
      items: items.map((item) => ({ productVariantId: item.variantId, quantity: item.quantity })),
    };
    mutation.mutate(body);
  }

  return (
    <div className="container checkout-page">
      <Breadcrumbs items={CRUMBS} />
      <h1 className="checkout-page__title">Оформление заказа</h1>

      <form className="checkout-page__layout" onSubmit={handleSubmit} noValidate>
        <div className="checkout-page__steps">
          <section className="checkout-step" aria-labelledby="co-step-contacts">
            <StepHead id="co-step-contacts" number={1} title="Контактные данные" />
            <div className="checkout-step__grid">
              <Field id="co-first-name" label="Имя" required error={errorFor('firstName')}>
                <input
                  id="co-first-name"
                  aria-required="true"
                  className="checkout-input"
                  autoComplete="given-name"
                  value={form.firstName}
                  onChange={(e) => update('firstName', e.target.value)}
                />
              </Field>
              <Field id="co-phone" label="Телефон" required error={errorFor('phone')}>
                <input
                  id="co-phone"
                  aria-required="true"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  className="checkout-input mono-num"
                  value={form.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  onFocus={handlePhoneFocus}
                />
              </Field>
              <Field id="co-last-name" label="Фамилия" error={fieldError(mutation.error, 'lastName')}>
                <input
                  id="co-last-name"
                  className="checkout-input"
                  autoComplete="family-name"
                  value={form.lastName}
                  onChange={(e) => update('lastName', e.target.value)}
                />
              </Field>
              <Field id="co-email" label="Email" error={errorFor('email')}>
                <input
                  id="co-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  className="checkout-input"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                />
              </Field>
            </div>
          </section>

          <section className="checkout-step" aria-labelledby="co-step-delivery">
            <StepHead
              id="co-step-delivery"
              number={2}
              title="Доставка"
              action={
                <Link href="/delivery" target="_blank" className="checkout-step__more">
                  Подробнее
                  <ArrowRightIcon width={14} height={14} />
                </Link>
              }
            />
            <fieldset className="checkout-options">
              <legend className="visually-hidden">Способ доставки</legend>
              {deliveryOptions.map((option) => (
                <label key={option.value} className="checkout-option">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    className="visually-hidden"
                    value={option.value}
                    checked={delivery === option.value}
                    onChange={() => {
                      clearError('address');
                      clearError('city');
                      update('deliveryMethod', option.value);
                    }}
                  />
                  <span className="checkout-option__icon">{option.icon}</span>
                  <span className="checkout-option__body">
                    <span className="checkout-option__title">{option.title}</span>
                  </span>
                  <span className={`checkout-option__price${option.free ? ' checkout-option__price--free' : ''}`}>
                    {option.price}
                  </span>
                </label>
              ))}
            </fieldset>

            {delivery === 'COURIER' && (
              <div className="checkout-delivery">
                <p className="checkout-delivery__info">
                  <ClockIcon width={16} height={16} strokeWidth={1.8} />
                  <span>
                    От {COURIER.freeFrom} <CurrencySymbol /> доставка бесплатная. Менеджер свяжется с вами, чтобы
                    согласовать время доставки.
                  </span>
                </p>
                <Field id="co-address" label="Адрес" required error={errorFor('address')}>
                  <input
                    id="co-address"
                    aria-required="true"
                    className="checkout-input"
                    autoComplete="street-address"
                    placeholder="Улица, дом"
                    value={form.address}
                    onChange={(e) => update('address', e.target.value)}
                  />
                </Field>
              </div>
            )}

            {delivery === 'PICKUP' && (
              <div className="checkout-delivery checkout-pickup">
                <div className="checkout-pickup__place">
                  <span className="checkout-pickup__street">
                    {PICKUP.city}, {PICKUP.street}
                  </span>
                  <span className="checkout-pickup__hours">
                    {PICKUP.hours}, {PICKUP.hoursNote.toLowerCase()}
                  </span>
                </div>
              </div>
            )}

            {delivery === 'CARRIER' && (
              <div className="checkout-delivery">
                <p className="checkout-delivery__info">
                  <BoxIcon width={16} height={16} strokeWidth={1.8} />
                  <span>
                    Стоимость — по тарифу транспортной компании, от {formatPrice(CARRIER.priceFrom)} <CurrencySymbol />.
                    Менеджер рассчитает её и согласует с вами перед отправкой.
                  </span>
                </p>
                <div className="checkout-step__grid checkout-step__grid--city">
                  <Field id="co-city" label="Город или населённый пункт" required error={errorFor('city')}>
                    <input
                      id="co-city"
                      aria-required="true"
                      className="checkout-input"
                      autoComplete="address-level2"
                      value={form.city}
                      onChange={(e) => update('city', e.target.value)}
                    />
                  </Field>
                  <Field id="co-postal" label="Индекс" error={fieldError(mutation.error, 'postalCode')}>
                    <input
                      id="co-postal"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      className="checkout-input mono-num"
                      value={form.postalCode}
                      onChange={(e) => update('postalCode', e.target.value)}
                    />
                  </Field>
                </div>
                <Field id="co-address" label="Адрес" required error={errorFor('address')}>
                  <input
                    id="co-address"
                    aria-required="true"
                    className="checkout-input"
                    autoComplete="street-address"
                    placeholder="Улица, дом, квартира или номер отделения"
                    value={form.address}
                    onChange={(e) => update('address', e.target.value)}
                  />
                </Field>
              </div>
            )}
          </section>

          <section className="checkout-step" aria-labelledby="co-step-payment">
            <StepHead id="co-step-payment" number={3} title="Оплата" />
            <fieldset className="checkout-options checkout-options--two">
              <legend className="visually-hidden">Способ оплаты</legend>
              {PAYMENT_OPTIONS.map((option) => (
                <label key={option.value} className="checkout-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    className="visually-hidden"
                    value={option.value}
                    checked={form.paymentMethod === option.value}
                    onChange={() => update('paymentMethod', option.value)}
                  />
                  <span className="checkout-option__icon">{option.icon}</span>
                  <span className="checkout-option__body">
                    <span className="checkout-option__title">{option.title}</span>
                    <span className="checkout-option__note">{option.note}</span>
                  </span>
                </label>
              ))}
            </fieldset>

            {commentOpen ? (
              <Field id="co-comment" label="Комментарий к заказу">
                <textarea
                  id="co-comment"
                  className="checkout-input checkout-input--area"
                  placeholder="Например, удобное время звонка или подъезд со двора"
                  value={form.comment}
                  onChange={(e) => update('comment', e.target.value)}
                  autoFocus
                />
              </Field>
            ) : (
              <button type="button" className="checkout-step__add" onClick={() => setCommentOpen(true)}>
                <PlusIcon width={16} height={16} />
                Добавить комментарий к заказу
              </button>
            )}
          </section>
        </div>

        <aside className="checkout-summary" aria-label="Ваш заказ">
          <div className="checkout-summary__head">
            <h2 className="checkout-summary__title">Ваш заказ</h2>
            <Link href="/cart" className="checkout-summary__edit">
              Изменить
            </Link>
          </div>

          <ul className="checkout-summary__thumbs" aria-label={formatProductsCount(count)}>
            {items.slice(0, 4).map((item) => (
              <li key={item.variantId} className="checkout-summary__thumb" title={item.productName}>
                <ProductPhoto image={item.image} alt={item.productName} size="thumb" />
                {item.quantity > 1 && <span className="checkout-summary__qty">{item.quantity}</span>}
              </li>
            ))}
            {items.length > 4 && <li className="checkout-summary__more">+{items.length - 4}</li>}
          </ul>

          <dl className="checkout-summary__lines">
            <div className="checkout-summary__line">
              <dt>{formatProductsCount(count)}</dt>
              <dd>
                {formatPrice(totalPrice)} <CurrencySymbol />
              </dd>
            </div>
            {discount.isApplied && (
              <div className="checkout-summary__line checkout-summary__line--discount">
                <dt>Промокод {promoCode}</dt>
                <dd>
                  −{formatPrice(discount.discountAmount)} <CurrencySymbol />
                </dd>
              </div>
            )}
          </dl>

          <div className="checkout-summary__total">
            <span>Итого</span>
            <Price value={payable} size="lg" className="checkout-summary__total-price" />
          </div>

          <p className="checkout-summary__delivery">
            <TruckIcon width={16} height={16} strokeWidth={1.7} />
            <span>Доставка</span>
            <span className={`checkout-summary__delivery-value${deliveryFree ? ' checkout-summary__delivery-value--free' : ''}`}>
              {deliverySummary}
            </span>
          </p>

          {discount.isRejected && (
            <p className="checkout-summary__alert" role="alert">
              <AlertIcon width={16} height={16} />
              <span>
                {discount.message} <Link href="/cart">Уберите или замените промокод в корзине.</Link>
              </span>
            </p>
          )}

          <div className="checkout-summary__agree">
            <label className="checkout-agree">
              <input
                id="co-agreed"
                type="checkbox"
                checked={agreed}
                aria-invalid={Boolean(errors.agreed)}
                onChange={(e) => {
                  clearError('agreed');
                  setAgreed(e.target.checked);
                }}
              />
              <span>
                Принимаю{' '}
                <Link href="/terms" target="_blank" rel="noopener noreferrer">
                  пользовательское соглашение
                </Link>{' '}
                и даю согласие на{' '}
                <Link href="/privacy" target="_blank" rel="noopener noreferrer">
                  обработку персональных данных
                </Link>
              </span>
            </label>
            {errors.agreed && <span className="checkout-field__error">{errors.agreed}</span>}
          </div>

          {formError(mutation.error) && (
            <p className="checkout-summary__alert" role="alert">
              <AlertIcon width={16} height={16} />
              <span>{formError(mutation.error)}</span>
            </p>
          )}

          <button
            type="submit"
            className="checkout-summary__submit"
            disabled={mutation.isPending || discount.isRejected}
          >
            {mutation.isPending ? 'Оформляем…' : 'Подтвердить заказ'}
          </button>
        </aside>
      </form>
    </div>
  );
}

interface StepHeadProps {
  id: string;
  number: number;
  title: string;
  action?: ReactNode;
}

function StepHead({ id, number, title, action }: StepHeadProps) {
  return (
    <div className="checkout-step__head">
      <span className="checkout-step__num" aria-hidden="true">
        {number}
      </span>
      <h2 id={id} className="checkout-step__title">
        {title}
      </h2>
      {action}
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}

function Field({ id, label, required, error, children }: FieldProps) {
  return (
    <div className={`checkout-field${error ? ' checkout-field--invalid' : ''}`}>
      <label htmlFor={id} className="checkout-field__label">
        {label}
        {required && (
          <span className="checkout-field__required" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      {children}
      {error && <span className="checkout-field__error">{error}</span>}
    </div>
  );
}
