import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import '@/admin/admin.css';
import '@/components/filters/Filters.css';
import { listCategories, createCategory, updateCategory, deleteCategory } from '@/api/admin';
import type { CategoryRequest, CategoryResponse } from '@/api/types';
import { useAdminResource } from '@/admin/useAdminResource';
import { Modal } from '@/admin/components/Modal';
import { ConfirmDialog } from '@/admin/components/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { fieldError, formError } from '@/admin/formErrors';
import { PlusIcon, EditIcon, TrashIcon } from '@/components/ui/icons';

const QUERY_KEY = ['admin-categories'];

interface FormState {
  name: string;
  slug: string;
  parentCategoryId: string;
}

const EMPTY_FORM: FormState = { name: '', slug: '', parentCategoryId: '' };

export function CategoriesPage() {
  const { items, isLoading, isError, refetch, createMutation, updateMutation, deleteMutation } =
    useAdminResource<CategoryResponse, CategoryRequest>({
      queryKey: QUERY_KEY,
      list: () => listCategories(),
      create: createCategory,
      update: updateCategory,
      remove: deleteCategory,
    });

  const [editing, setEditing] = useState<CategoryResponse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<CategoryResponse | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(category: CategoryResponse) {
    setEditing(category);
    setForm({
      name: category.name,
      slug: category.slug,
      parentCategoryId: category.parentCategoryId?.toString() ?? '',
    });
    setModalOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const body: CategoryRequest = {
      name: form.name,
      slug: form.slug,
      parentCategoryId: form.parentCategoryId ? Number(form.parentCategoryId) : null,
    };

    const action = editing
      ? updateMutation.mutateAsync({ id: editing.id, body })
      : createMutation.mutateAsync(body);

    action
      .then(() => setModalOpen(false))
      .catch(() => {
        /* ошибка отображается через activeMutation.error ниже */
      });
  }

  const activeMutation = editing ? updateMutation : createMutation;

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1>Категории</h1>
        <Button size="sm" onClick={openCreate}>
          <PlusIcon width={16} height={16} />
          Добавить категорию
        </Button>
      </div>

      {isError && <ErrorState description="Не удалось загрузить категории." onRetry={refetch} />}

      {!isError && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Slug</th>
                <th>Родительская категория</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items?.map((category) => (
                <tr key={category.id}>
                  <td className="mono-num">{category.id}</td>
                  <td>{category.name}</td>
                  <td className="mono-num">{category.slug}</td>
                  <td>{items.find((c) => c.id === category.parentCategoryId)?.name ?? '—'}</td>
                  <td>
                    <div className="admin-table__actions">
                      <Link to={`/admin/categories/${category.id}/attributes`} className="admin-table__link-btn">
                        Атрибуты
                      </Link>
                      <button
                        type="button"
                        className="admin-table__icon-btn touch-target"
                        onClick={() => openEdit(category)}
                        aria-label="Редактировать"
                      >
                        <EditIcon width={16} height={16} />
                      </button>
                      <button
                        type="button"
                        className="admin-table__icon-btn admin-table__icon-btn--danger touch-target"
                        onClick={() => setDeleteTarget(category)}
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
          {!isLoading && items?.length === 0 && <div className="admin-empty">Категорий пока нет.</div>}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Редактировать категорию' : 'Новая категория'}
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
        <form className="admin-form" onSubmit={handleSubmit} id="category-form">
          {formError(activeMutation.error) && (
            <div className="admin-banner-error">{formError(activeMutation.error)}</div>
          )}
          <div className="admin-form-field">
            <label htmlFor="cat-name">Название</label>
            <input
              id="cat-name"
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
            <label htmlFor="cat-slug">Slug</label>
            <input
              id="cat-slug"
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
            <label htmlFor="cat-parent">Родительская категория</label>
            <select
              id="cat-parent"
              className="filter-select"
              value={form.parentCategoryId}
              onChange={(e) => setForm((f) => ({ ...f, parentCategoryId: e.target.value }))}
            >
              <option value="">Нет (корневая категория)</option>
              {items
                ?.filter((c) => c.id !== editing?.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Удалить категорию?"
        description={`Категория «${deleteTarget?.name}» и все её товары будут удалены безвозвратно.`}
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
