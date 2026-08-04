'use client';

import { useRouteParams } from '@/hooks/useRouteParams';
import { useQuery } from '@tanstack/react-query';
import '@/admin/admin.css';
import './OrderDetailPage.css';
import { getOrder } from '@/api/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ErrorState } from '@/components/ui/ErrorState';
import { Price } from '@/components/ui/Price';

export function OrderDetailPage() {
  const { orderId: orderIdParam } = useRouteParams<{ orderId: string }>();
  const orderId = Number(orderIdParam);

  const { data: order, isError, refetch } = useQuery({
    queryKey: ['admin-order', orderId],
    queryFn: () => getOrder(orderId),
  });

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
        <span className="admin-status-dot admin-status-dot--active">{order?.status}</span>
      </div>

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
                <dd>
                  {[order.city, order.address, order.postalCode].filter(Boolean).join(', ') || '—'}
                </dd>
              </div>
              <div>
                <dt>Оплата</dt>
                <dd>{order.paymentMethod}</dd>
              </div>
              <div>
                <dt>Доставка</dt>
                <dd>{order.deliveryMethod}</dd>
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
                <thead>
                  <tr>
                    <th>Товар</th>
                    <th>SKU</th>
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
            <div className="order-detail__total">
              <span>Итого</span>
              <Price value={order.totalPrice} size="lg" />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
