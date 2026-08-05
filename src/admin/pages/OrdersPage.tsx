'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import '@/admin/admin.css';
import { listOrders } from '@/api/admin';
import { ErrorState } from '@/components/ui/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import { Price } from '@/components/ui/Price';

const PAGE_SIZE = 20;

export function OrdersPage() {
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-orders', page],
    queryFn: () => listOrders({ page, size: PAGE_SIZE, sort: 'createdAt,desc' }),
  });

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1>Заказы</h1>
      </div>

      {isError && <ErrorState description="Не удалось загрузить заказы." onRetry={refetch} />}

      {!isError && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Клиент</th>
                <th>Статус</th>
                <th>Оплата</th>
                <th>Доставка</th>
                <th>Промокод</th>
                <th>Сумма</th>
                <th>Дата</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data?.content.map((order) => (
                <tr key={order.id}>
                  <td className="mono-num">{order.id}</td>
                  <td>
                    {order.firstName} {order.lastName}
                  </td>
                  <td>{order.status}</td>
                  <td>{order.paymentMethod}</td>
                  <td>{order.deliveryMethod}</td>
                  <td className="mono-num">{order.promoCode ?? '—'}</td>
                  <td>
                    <Price value={order.totalPrice} size="sm" />
                  </td>
                  <td className="mono-num">{new Date(order.createdAt).toLocaleString('ru-RU')}</td>
                  <td>
                    <Link href={`/admin/orders/${order.id}`} className="admin-table__link-btn">
                      Открыть
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && data?.content.length === 0 && <div className="admin-empty">Заказов пока нет.</div>}
        </div>
      )}

      {data && <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />}
    </div>
  );
}
