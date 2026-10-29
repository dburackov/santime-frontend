'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouteParams } from '@/hooks/useRouteParams';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import '@/admin/admin.css';
import '@/components/filters/Filters.css';
import './OrderDetailPage.css';
import { getOrder, updateOrder } from '@/api/admin';
import type { AdminOrderUpdateRequest, OrderResponse, OrderStatus } from '@/api/types';
import { Modal } from '@/admin/components/Modal';
import { PrintReceiptButton } from '@/admin/components/PrintReceiptButton';
import { RequiredMark } from '@/admin/components/RequiredMark';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Price } from '@/components/ui/Price';
import { Select } from '@/components/ui/Select';
import { fieldError, formError } from '@/admin/formErrors';
import { ChevronLeftIcon, ChevronRightIcon, EditIcon } from '@/components/ui/icons';
import {
  DELIVERY_METHODS,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  deliveryMethodLabel,
  nextOrderStatus,
  orderStatusLabel,
  paymentMethodLabel,
  previousOrderStatus,
} from '@/utils/orderLabels';

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  postalCode: string;
  paymentMethod: string;
  deliveryMethod: string;
  comment: string;
  status: OrderStatus;
}

function toForm(order: OrderResponse): FormState {
  return {
    firstName: order.firstName,
    lastName: order.lastName ?? '',
    email: order.email ?? '',
    phone: order.phone ?? '',
    city: order.city ?? '',
    address: order.address ?? '',
    postalCode: order.postalCode ?? '',
    paymentMethod: order.paymentMethod,
    deliveryMethod: order.deliveryMethod,
    comment: order.comment ?? '',
    status: order.status,
  };
}

function toRequest(form: FormState): AdminOrderUpdateRequest {
  return {
    firstName: form.firstName,
    lastName: form.lastName || null,
    email: form.email || null,
    phone: form.phone || null,
    city: form.city || null,
    address: form.address || null,
    postalCode: form.postalCode || null,
    paymentMethod: form.paymentMethod,
    deliveryMethod: form.deliveryMethod,
    comment: form.comment || null,
    status: form.status,
  };
}

export function OrderDetailPage() {
  const { orderId: orderIdParam } = useRouteParams<{ orderId: string }>();
  const orderId = Number(orderIdParam);
  const queryClient = useQueryClient();

  const {
    data: order,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin-order', orderId],
    queryFn: () => getOrder(orderId),
  });

  const updateMutation = useMutation({
    mutationFn: (body: AdminOrderUpdateRequest) => updateOrder(orderId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order', orderId] });
      // список заказов показывает статус и контакты — его тоже надо освежить
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [receiptError, setReceiptError] = useState<unknown>(null);

  function openEdit() {
    if (!order) return;
    setForm(toForm(order));
    setModalOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    updateMutation.mutateAsync(toRequest(form)).then(() => setModalOpen(false)).catch(() => {});
  }

  /** Шаг по цепочке статусов: остальные поля заказа уходят как есть. */
  function changeStatus(status: OrderStatus) {
    if (!order) return;
    updateMutation.mutate({ ...toRequest(toForm(order)), status });
  }

  const nextStatus = order ? nextOrderStatus(order.status) : null;
  const previousStatus = order ? previousOrderStatus(order.status) : null;

  if (isError) {
    return (
      <div className="admin-page">
        <ErrorState description="Не удалось загрузить заказ." onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <Breadcrumbs items={[{ label: 'Заказы', to: '/admin/orders' }, { label: order ? `№${order.id}` : '…' }]} />

      <div className="admin-page__header">
        <h1>Заказ №{order?.id}</h1>
        {order && (
          <div className="order-detail__header-actions">
            <span
              className={`admin-status-dot ${
                order.status === 'CANCELLED' ? 'admin-status-dot--inactive' : 'admin-status-dot--active'
              }`}
            >
              {orderStatusLabel(order.status)}
            </span>
            {previousStatus && (
              <Button
                variant="secondary"
                size="sm"
                className="order-status-step--prev"
                onClick={() => changeStatus(previousStatus)}
                disabled={updateMutation.isPending}
              >
                <ChevronLeftIcon width={16} height={16} />
                {orderStatusLabel(previousStatus)}
              </Button>
            )}
            {nextStatus && (
              <Button
                variant="secondary"
                size="sm"
                className="order-status-step--next"
                onClick={() => changeStatus(nextStatus)}
                disabled={updateMutation.isPending}
              >
                {orderStatusLabel(nextStatus)}
                <ChevronRightIcon width={16} height={16} />
              </Button>
            )}
            <PrintReceiptButton orderId={order.id} onError={setReceiptError} />
            <Button size="sm" onClick={openEdit}>
              <EditIcon width={16} height={16} />
              Редактировать
            </Button>
          </div>
        )}
      </div>

      {receiptError != null && <div className="admin-banner-error">{formError(receiptError)}</div>}

      {!modalOpen && formError(updateMutation.error) && (
        <div className="admin-banner-error">{formError(updateMutation.error)}</div>
      )}

      {order && (
        <div className="order-detail__grid">
          <section className="order-detail__section">
            <h2>Клиент</h2>
            <dl className="order-detail__fields">
              <div>
                <dt>Имя</dt>
                <dd>
                  {order.firstName} {order.lastName}
                </dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{order.email ?? '—'}</dd>
              </div>
              <div>
                <dt>Телефон</dt>
                <dd>{order.phone ?? '—'}</dd>
              </div>
              <div>
                <dt>Адрес</dt>
                <dd>{[order.city, order.address, order.postalCode].filter(Boolean).join(', ') || '—'}</dd>
              </div>
              <div>
                <dt>Оплата</dt>
                <dd>{paymentMethodLabel(order.paymentMethod)}</dd>
              </div>
              <div>
                <dt>Доставка</dt>
                <dd>{deliveryMethodLabel(order.deliveryMethod)}</dd>
              </div>
              <div>
                <dt>Комментарий</dt>
                <dd>{order.comment ?? '—'}</dd>
              </div>
              <div>
                <dt>Создан</dt>
                <dd className="mono-num">{new Date(order.createdAt).toLocaleString('ru-RU')}</dd>
              </div>
            </dl>
          </section>

          <section className="order-detail__section">
            <h2>Состав заказа</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <colgroup>
                  <col className="order-detail__col--product" />
                  <col className="order-detail__col--sku" />
                  <col className="order-detail__col--price" />
                  <col className="order-detail__col--quantity" />
                  <col className="order-detail__col--total" />
                </colgroup>
                <thead>
                  <tr>
                    <th>Товар</th>
                    <th>Артикул</th>
                    <th>Цена</th>
                    <th>Кол-во</th>
                    <th>Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.productName}</td>
                      <td className="mono-num">{item.sku}</td>
                      <td>
                        <Price value={item.price} size="sm" />
                      </td>
                      <td className="mono-num">{item.quantity}</td>
                      <td>
                        <Price value={item.price * item.quantity} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="order-detail__summary">
              <div className="order-detail__line">
                <span>Товары</span>
                <Price value={order.subtotal} size="sm" />
              </div>
              {/* Строку показываем при любом снапшоте кода, даже с нулевой скидкой:
                  «промокод был, но ничего не дал» — тоже ответ на вопрос админа. */}
              {order.promoCode && (
                <div className="order-detail__line order-detail__line--discount">
                  <span>
                    Промокод <span className="order-detail__promo-code">{order.promoCode}</span>
                  </span>
                  <span className="order-detail__discount-value">
                    −<Price value={order.discountAmount} size="sm" />
                  </span>
                </div>
              )}
              <div className="order-detail__total">
                <span>Итого</span>
                <Price value={order.totalPrice} size="lg" />
              </div>
            </div>
          </section>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Редактировать заказ"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Отмена
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={updateMutation.isPending}>
              Сохранить
            </Button>
          </>
        }
      >
        {form && (
          <form className="admin-form" onSubmit={handleSubmit}>
            {formError(updateMutation.error) && (
              <div className="admin-banner-error">{formError(updateMutation.error)}</div>
            )}

            <div className="admin-form-field">
              <label htmlFor="order-status">Статус<RequiredMark /></label>
              <Select
                id="order-status"
                options={ORDER_STATUSES}
                value={form.status}
                onChange={(value) => setForm((f) => (f ? { ...f, status: value as OrderStatus } : f))}
                portal
              />
            </div>

            <div className="admin-form-row">
              <div className="admin-form-field">
                <label htmlFor="order-first-name">Имя<RequiredMark /></label>
                <input
                  id="order-first-name"
                  className="filter-text-input"
                  value={form.firstName}
                  onChange={(e) => setForm((f) => (f ? { ...f, firstName: e.target.value } : f))}
                  required
                />
                {fieldError(updateMutation.error, 'firstName') && (
                  <span className="admin-form-error">{fieldError(updateMutation.error, 'firstName')}</span>
                )}
              </div>
              <div className="admin-form-field">
                <label htmlFor="order-last-name">Фамилия</label>
                <input
                  id="order-last-name"
                  className="filter-text-input"
                  value={form.lastName}
                  onChange={(e) => setForm((f) => (f ? { ...f, lastName: e.target.value } : f))}
                />
                {fieldError(updateMutation.error, 'lastName') && (
                  <span className="admin-form-error">{fieldError(updateMutation.error, 'lastName')}</span>
                )}
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-field">
                <label htmlFor="order-email">Email</label>
                <input
                  id="order-email"
                  type="email"
                  className="filter-text-input"
                  value={form.email}
                  onChange={(e) => setForm((f) => (f ? { ...f, email: e.target.value } : f))}
                />
                {fieldError(updateMutation.error, 'email') && (
                  <span className="admin-form-error">{fieldError(updateMutation.error, 'email')}</span>
                )}
              </div>
              <div className="admin-form-field">
                <label htmlFor="order-phone">Телефон</label>
                <input
                  id="order-phone"
                  type="tel"
                  className="filter-text-input"
                  value={form.phone}
                  onChange={(e) => setForm((f) => (f ? { ...f, phone: e.target.value } : f))}
                />
                {fieldError(updateMutation.error, 'phone') && (
                  <span className="admin-form-error">{fieldError(updateMutation.error, 'phone')}</span>
                )}
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-field">
                <label htmlFor="order-city">Город</label>
                <input
                  id="order-city"
                  className="filter-text-input"
                  value={form.city}
                  onChange={(e) => setForm((f) => (f ? { ...f, city: e.target.value } : f))}
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="order-postal-code">Индекс</label>
                <input
                  id="order-postal-code"
                  className="filter-text-input mono-num"
                  value={form.postalCode}
                  onChange={(e) => setForm((f) => (f ? { ...f, postalCode: e.target.value } : f))}
                />
              </div>
            </div>

            <div className="admin-form-field">
              <label htmlFor="order-address">Адрес</label>
              <input
                id="order-address"
                className="filter-text-input"
                value={form.address}
                onChange={(e) => setForm((f) => (f ? { ...f, address: e.target.value } : f))}
              />
              {fieldError(updateMutation.error, 'address') && (
                <span className="admin-form-error">{fieldError(updateMutation.error, 'address')}</span>
              )}
            </div>

            <div className="admin-form-row">
              <div className="admin-form-field">
                <label htmlFor="order-payment">Оплата<RequiredMark /></label>
                <Select
                  id="order-payment"
                  options={PAYMENT_METHODS}
                  value={form.paymentMethod}
                  onChange={(value) => setForm((f) => (f ? { ...f, paymentMethod: value } : f))}
                  portal
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="order-delivery">Доставка<RequiredMark /></label>
                <Select
                  id="order-delivery"
                  options={DELIVERY_METHODS}
                  value={form.deliveryMethod}
                  onChange={(value) => setForm((f) => (f ? { ...f, deliveryMethod: value } : f))}
                  portal
                />
              </div>
            </div>

            <div className="admin-form-field">
              <label htmlFor="order-comment">Комментарий</label>
              <textarea
                id="order-comment"
                value={form.comment}
                onChange={(e) => setForm((f) => (f ? { ...f, comment: e.target.value } : f))}
              />
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
