import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import '@/admin/admin.css';
import '@/components/filters/Filters.css';
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  listCategories,
  listBrands,
} from '@/api/admin';
import type { ProductRequest, ProductResponse } from '@/api/types';
import { Modal } from '@/admin/components/Modal';
import { ConfirmDialog } from '@/admin/components/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import { fieldError, formError } from '@/admin/formErrors';
import { PlusIcon, EditIcon, TrashIcon } from '@/components/ui/icons';

interface FormState {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  brandId: string;
  active: boolean;
}

const EMPTY_FORM: FormState = { name: '', slug: '', description: '', categoryId: '', brandId: '', active: true };

export function ProductsPage() {
  const queryClient = useQueryClient();
  const { data: categories } = useQuery({ queryKey: ['admin-categories'], queryFn: () => listCategories() });
  const { data: brands } = useQuery({ queryKey: ['admin-brands'], queryFn: listBrands });

  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(0);

  const {
    data: pageData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin-products', { categoryId: categoryFilter, page }],
    queryFn: () =>
      listProducts({ categoryId: categoryFilter ? Number(categoryFilter) : undefined, page, size: 20 }),
  });

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: ['admin-products'] });
  }

  const createMutation = useMutation({ mutationFn: createProduct, onSuccess: invalidate });
  const updateMutation = useMutation({
    mutationFn: (vars: { id: number; body: ProductRequest }) => updateProduct(vars.id, vars.body),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({ mutationFn: deleteProduct, onSuccess: invalidate });

  const [editing, setEditing] = useState<ProductResponse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<ProductResponse | null>(null);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, categoryId: categoryFilter });
    setModalOpen(true);
  }

  function openEdit(product: ProductResponse) {
    setEditing(product);
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description ?? '',
      categoryId: product.categoryId.toString(),
      brandId: product.brandId?.toString() ?? '',
      active: product.active,
    });
    setModalOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const body: ProductRequest = {
      name: form.name,
      slug: form.slug,
      description: form.description || null,
      categoryId: Number(form.categoryId),
      brandId: form.brandId ? Number(form.brandId) : null,
      active: form.active,
    };
    const action = editing
      ? updateMutation.mutateAsync({ id: editing.id, body })
      : createMutation.mutateAsync(body);
    action.then(() => setModalOpen(false)).catch(() => {});
  }

  const activeMutation = editing ? updateMutation : createMutation;

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1>Товары</h1>
        <Button size="sm" onClick={openCreate} disabled={!categories || categories.length === 0}>
          <PlusIcon width={16} height={16} />
          Добавить товар
        </Button>
      </div>

      <div className="admin-form-field" style={{ maxWidth: 280, marginBottom: 'var(--space-4)' }}>
        <label htmlFor="product-category-filter">Категория</label>
        <select
          id="product-category-filter"
          className="filter-select"
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(0);
          }}
        >
          <option value="">Все категории</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {isError && <ErrorState description="Не удалось загрузить товары." onRetry={refetch} />}

      {!isError && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Slug</th>
                <th>Категория</th>
                <th>Бренд</th>
                <th>Статус</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pageData?.content.map((product) => (
                <tr key={product.id}>
                  <td className="mono-num">{product.id}</td>
                  <td>{product.name}</td>
                  <td className="mono-num">{product.slug}</td>
                  <td>{categories?.find((c) => c.id === product.categoryId)?.name ?? '—'}</td>
                  <td>{brands?.find((b) => b.id === product.brandId)?.name ?? '—'}</td>
                  <td>
                    <span className={`admin-status-dot ${product.active ? 'admin-status-dot--active' : 'admin-status-dot--inactive'}`}>
                      {product.active ? 'Активен' : 'Скрыт'}
                    </span>
                  </td>
                  <td>
                    <div className="admin-table__actions">
                      <Link to={`/admin/products/${product.id}/variants`} className="admin-table__link-btn">
                        Варианты
                      </Link>
                      <button
                        type="button"
                        className="admin-table__icon-btn touch-target"
                        onClick={() => openEdit(product)}
                        aria-label="Редактировать"
                      >
                        <EditIcon width={16} height={16} />
                      </button>
                      <button
                        type="button"
                        className="admin-table__icon-btn admin-table__icon-btn--danger touch-target"
                        onClick={() => setDeleteTarget(product)}
                        aria-label="Удалить"
                      >
                        <TrashIcon width={16} height={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && pageData?.content.length === 0 && (
            <div className="admin-empty">Товаров пока нет.</div>
          )}
        </div>
      )}

      {pageData && <Pagination page={page} totalPages={pageData.totalPages} onChange={setPage} />}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Редактировать товар' : 'Новый товар'}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Отмена
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={activeMutation.isPending}>
              Сохранить
            </Button>
          </>
        }
      >
        <form className="admin-form" onSubmit={handleSubmit}>
          {formError(activeMutation.error) && (
            <div className="admin-banner-error">{formError(activeMutation.error)}</div>
          )}
          <div className="admin-form-field">
            <label htmlFor="product-name">Название</label>
            <input
              id="product-name"
              className="filter-text-input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            {fieldError(activeMutation.error, 'name') && (
              <span className="admin-form-error">{fieldError(activeMutation.error, 'name')}</span>
            )}
          </div>
          <div className="admin-form-field">
            <label htmlFor="product-slug">Slug</label>
            <input
              id="product-slug"
              className="filter-text-input mono-num"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              required
            />
            {fieldError(activeMutation.error, 'slug') && (
              <span className="admin-form-error">{fieldError(activeMutation.error, 'slug')}</span>
            )}
          </div>
          <div className="admin-form-field">
            <label htmlFor="product-description">Описание</label>
            <textarea
              id="product-description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="product-category">Категория</label>
              <select
                id="product-category"
                className="filter-select"
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                required
              >
                <option value="" disabled>
                  Выберите категорию
                </option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-form-field">
              <label htmlFor="product-brand">Бренд</label>
              <select
                id="product-brand"
                className="filter-select"
                value={form.brandId}
                onChange={(e) => setForm((f) => ({ ...f, brandId: e.target.value }))}
              >
                <option value="">Без бренда</option>
                {brands?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label className="admin-form-checkbox">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            Активен (виден в каталоге)
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Удалить товар?"
        description={`Товар «${deleteTarget?.name}» и все его варианты будут удалены безвозвратно.`}
        onCancel={() => setDeleteTarget(null)}
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
        }}
      />
    </div>
  );
}
