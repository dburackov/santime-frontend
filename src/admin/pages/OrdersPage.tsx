'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import '@/admin/admin.css';
import './OrdersPage.css';
import { listOrders } from '@/api/admin';
import type { OrderStatus } from '@/api/types';
import { ErrorState } from '@/components/ui/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import { Price } from '@/components/ui/Price';
import { ORDER_STATUSES, deliveryMethodLabel, paymentMethodLabel } from '@/utils/orderLabels';

const PAGE_SIZE = 20;
const DEFAULT_STATUS: OrderStatus = 'NEW';

export function OrdersPage() {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const query = (useSearchParams() ?? new URLSearchParams()).toString();

  // Статус и страница живут в URL, чтобы переживать refresh и возврат со страницы заказа.
  const searchParams = new URLSearchParams(query);
  const statusParam = searchParams.get('status');
  const status = ORDER_STATUSES.some((option) => option.value === statusParam)
    ? (statusParam as OrderStatus)
    : DEFAULT_STATUS;
  const page = Math.max(0, Number(searchParams.get('page') ?? '1') - 1) || 0;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-orders', status, page],
    queryFn: () => listOrders({ status, page, size: PAGE_SIZE, sort: 'createdAt,desc' }),
  });

  function commit(next: URLSearchParams) {
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function selectStatus(next: OrderStatus) {
    const params = new URLSearchParams(query);
    params.set('status', next);
    params.delete('page');
    commit(params);
  }

  function setPage(nextPage: number) {
    const params = new URLSearchParams(query);
    if (nextPage <= 0) params.delete('page');
    else params.set('page', String(nextPage + 1));
    commit(params);
  }

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1>Заказы</h1>
      </div>

      <div className="orders-page__statuses" role="tablist" aria-label="Статус заказа">
        {ORDER_STATUSES.map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={status === option.value}
            className={`orders-page__status ${status === option.value ? 'orders-page__status--current' : ''}`}
            onClick={() => selectStatus(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isError && <ErrorState description="Не удалось загрузить заказы." onRetry={refetch} />}

      {!isError && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <colgroup>
              <col className="orders-page__col--id" />
              <col className="orders-page__col--client" />
              <col className="orders-page__col--payment" />
              <col className="orders-page__col--delivery" />
              <col className="orders-page__col--total" />
              <col className="orders-page__col--date" />
              <col className="orders-page__col--actions" />
            </colgroup>
            <thead>
              <tr>
                <th>ID</th>
                <th>Клиент</th>
                <th>Оплата</th>
                <th>Доставка</th>
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
                  <td>{paymentMethodLabel(order.paymentMethod)}</td>
                  <td>{deliveryMethodLabel(order.deliveryMethod)}</td>
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
          {!isLoading && data?.content.length === 0 && (
            <div className="admin-empty">Заказов с этим статусом нет.</div>
          )}
        </div>
      )}

      {data && <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />}
    </div>
  );
}
