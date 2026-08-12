'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import '@/admin/admin.css';
import '@/components/filters/Filters.css';
import './BrandsPage.css';
import { listBrands, createBrand, updateBrand, deleteBrand } from '@/api/admin';
import type { BrandRequest, BrandResponse } from '@/api/types';
import { useAdminResource } from '@/admin/useAdminResource';
import { Modal } from '@/admin/components/Modal';
import { ConfirmDialog } from '@/admin/components/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { fieldError, formError } from '@/admin/formErrors';
import { PlusIcon, EditIcon, TrashIcon } from '@/components/ui/icons';

const QUERY_KEY = ['admin-brands'];

interface FormState {
  name: string;
  slug: string;
}

const EMPTY_FORM: FormState = { name: '', slug: '' };

export function BrandsPage() {
  const { items, isError, refetch, createMutation, updateMutation, deleteMutation } = useAdminResource<
    BrandResponse,
    BrandRequest
  >({
    queryKey: QUERY_KEY,
    list: listBrands,
    create: createBrand,
    update: updateBrand,
    remove: deleteBrand,
  });

  const [editing, setEditing] = useState<BrandResponse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<BrandResponse | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(brand: BrandResponse) {
    setEditing(brand);
    setForm({ name: brand.name, slug: brand.slug });
    setModalOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const body: BrandRequest = { name: form.name, slug: form.slug };
    const action = editing
      ? updateMutation.mutateAsync({ id: editing.id, body })
      : createMutation.mutateAsync(body);
    action.then(() => setModalOpen(false)).catch(() => {});
  }

  const activeMutation = editing ? updateMutation : createMutation;

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1>Бренды</h1>
        <Button size="sm" onClick={openCreate}>
          <PlusIcon width={16} height={16} />
          Добавить бренд
        </Button>
      </div>

      {isError && <ErrorState description="Не удалось загрузить бренды." onRetry={refetch} />}

      {!isError && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <colgroup>
              <col className="brands-page__col--id" />
              <col className="brands-page__col--name" />
              <col className="brands-page__col--slug" />
              <col className="brands-page__col--actions" />
            </colgroup>
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Slug</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items?.map((brand) => (
                <tr key={brand.id}>
                  <td className="mono-num">{brand.id}</td>
                  <td>{brand.name}</td>
                  <td className="mono-num">{brand.slug}</td>
                  <td>
                    <div className="admin-table__actions">
                      <button
                        type="button"
                        className="admin-table__icon-btn"
                        onClick={() => openEdit(brand)}
                        aria-label="Редактировать"
                      >
                        <EditIcon width={16} height={16} />
                      </button>
                      <button
                        type="button"
                        className="admin-table__icon-btn admin-table__icon-btn--danger"
                        onClick={() => setDeleteTarget(brand)}
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
          {items?.length === 0 && <div className="admin-empty">Брендов пока нет.</div>}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Редактировать бренд' : 'Новый бренд'}
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
            <label htmlFor="brand-name">Название</label>
            <input
              id="brand-name"
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
            <label htmlFor="brand-slug">Slug</label>
            <input
              id="brand-slug"
              className="filter-text-input mono-num"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              required
            />
            {fieldError(activeMutation.error, 'slug') && (
              <span className="admin-form-error">{fieldError(activeMutation.error, 'slug')}</span>
            )}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Удалить бренд?"
        description={`Бренд «${deleteTarget?.name}» будет удалён безвозвратно.`}
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
