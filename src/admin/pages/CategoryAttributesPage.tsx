import { useState } from 'react';
import type { FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import '@/admin/admin.css';
import '@/components/filters/Filters.css';
import {
  listCategories,
  listAttributes,
  listCategoryAttributes,
  createCategoryAttribute,
  updateCategoryAttribute,
  deleteCategoryAttribute,
} from '@/api/admin';
import type { CategoryAttributeResponse, CategoryAttributeUpdateRequest } from '@/api/types';
import { Modal } from '@/admin/components/Modal';
import { ConfirmDialog } from '@/admin/components/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Select } from '@/components/ui/Select';
import { formError } from '@/admin/formErrors';
import { PlusIcon, EditIcon, TrashIcon } from '@/components/ui/icons';

interface FlagsFormState {
  required: boolean;
  isFilter: boolean;
  isVariant: boolean;
  sortOrder: string;
}

const EMPTY_FLAGS: FlagsFormState = { required: false, isFilter: false, isVariant: false, sortOrder: '0' };

export function CategoryAttributesPage() {
  const { categoryId: categoryIdParam } = useParams<{ categoryId: string }>();
  const categoryId = Number(categoryIdParam);
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({ queryKey: ['admin-categories'], queryFn: () => listCategories() });
  const category = categories?.find((c) => c.id === categoryId);

  const { data: allAttributes } = useQuery({ queryKey: ['admin-attributes'], queryFn: listAttributes });

  const {
    data: bindings,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin-category-attributes', categoryId],
    queryFn: () => listCategoryAttributes(categoryId),
  });

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: ['admin-category-attributes', categoryId] });
  }

  const createMutation = useMutation({
    mutationFn: (vars: { attributeId: number; flags: FlagsFormState }) =>
      createCategoryAttribute(categoryId, {
        attributeId: vars.attributeId,
        required: vars.flags.required,
        isFilter: vars.flags.isFilter,
        isVariant: vars.flags.isVariant,
        sortOrder: Number(vars.flags.sortOrder) || 0,
      }),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { attributeId: number; body: CategoryAttributeUpdateRequest }) =>
      updateCategoryAttribute(categoryId, vars.attributeId, vars.body),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (attributeId: number) => deleteCategoryAttribute(categoryId, attributeId),
    onSuccess: invalidate,
  });

  const [editing, setEditing] = useState<CategoryAttributeResponse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAttributeId, setSelectedAttributeId] = useState('');
  const [flags, setFlags] = useState<FlagsFormState>(EMPTY_FLAGS);
  const [deleteTarget, setDeleteTarget] = useState<CategoryAttributeResponse | null>(null);

  const unboundAttributes = allAttributes?.filter(
    (a) => !bindings?.some((b) => b.attributeId === a.id),
  );

  function openCreate() {
    setEditing(null);
    setSelectedAttributeId(unboundAttributes?.[0]?.id.toString() ?? '');
    setFlags(EMPTY_FLAGS);
    setModalOpen(true);
  }

  function openEdit(binding: CategoryAttributeResponse) {
    setEditing(binding);
    setSelectedAttributeId(binding.attributeId.toString());
    setFlags({
      required: binding.required,
      isFilter: binding.isFilter,
      isVariant: binding.isVariant,
      sortOrder: binding.sortOrder.toString(),
    });
    setModalOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const action = editing
      ? updateMutation.mutateAsync({
          attributeId: editing.attributeId,
          body: {
            required: flags.required,
            isFilter: flags.isFilter,
            isVariant: flags.isVariant,
            sortOrder: Number(flags.sortOrder) || 0,
          },
        })
      : createMutation.mutateAsync({ attributeId: Number(selectedAttributeId), flags });
    action.then(() => setModalOpen(false)).catch(() => {});
  }

  const activeMutation = editing ? updateMutation : createMutation;

  return (
    <div className="admin-page">
      <Breadcrumbs items={[{ label: 'Категории', to: '/admin/categories' }, { label: category?.name ?? '…' }]} />

      <div className="admin-page__header">
        <h1>Атрибуты категории: {category?.name}</h1>
        <Button size="sm" onClick={openCreate} disabled={!unboundAttributes || unboundAttributes.length === 0}>
          <PlusIcon width={16} height={16} />
          Привязать атрибут
        </Button>
      </div>

      {isError && <ErrorState description="Не удалось загрузить привязки." onRetry={refetch} />}

      {!isError && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Slug</th>
                <th>Тип</th>
                <th>Обязателен</th>
                <th>Фильтр</th>
                <th>Вариант</th>
                <th>Порядок</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {bindings?.map((binding) => (
                <tr key={binding.attributeId}>
                  <td>{binding.attributeName}</td>
                  <td className="mono-num">{binding.attributeSlug}</td>
                  <td>{binding.attributeType}</td>
                  <td>{binding.required ? 'Да' : 'Нет'}</td>
                  <td>{binding.isFilter ? 'Да' : 'Нет'}</td>
                  <td>{binding.isVariant ? 'Да' : 'Нет'}</td>
                  <td className="mono-num">{binding.sortOrder}</td>
                  <td>
                    <div className="admin-table__actions">
                      <button
                        type="button"
                        className="admin-table__icon-btn touch-target"
                        onClick={() => openEdit(binding)}
                        aria-label="Редактировать"
                      >
                        <EditIcon width={16} height={16} />
                      </button>
                      <button
                        type="button"
                        className="admin-table__icon-btn admin-table__icon-btn--danger touch-target"
                        onClick={() => setDeleteTarget(binding)}
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
          {!isLoading && bindings?.length === 0 && (
            <div className="admin-empty">К этой категории пока не привязано ни одного атрибута.</div>
          )}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Атрибут: ${editing.attributeName}` : 'Привязать атрибут'}
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

          {!editing && (
            <div className="admin-form-field">
              <label htmlFor="ca-attribute">Атрибут</label>
              <Select
                id="ca-attribute"
                options={unboundAttributes?.map((a) => ({ value: String(a.id), label: `${a.name} (${a.type})` })) ?? []}
                value={selectedAttributeId}
                onChange={setSelectedAttributeId}
              />
            </div>
          )}

          <label className="admin-form-checkbox">
            <input
              type="checkbox"
              checked={flags.required}
              onChange={(e) => setFlags((f) => ({ ...f, required: e.target.checked }))}
            />
            Обязательный атрибут
          </label>
          <label className="admin-form-checkbox">
            <input
              type="checkbox"
              checked={flags.isFilter}
              onChange={(e) => setFlags((f) => ({ ...f, isFilter: e.target.checked }))}
            />
            Участвует в фильтрах
          </label>
          <label className="admin-form-checkbox">
            <input
              type="checkbox"
              checked={flags.isVariant}
              onChange={(e) => setFlags((f) => ({ ...f, isVariant: e.target.checked }))}
            />
            Различает варианты товара
          </label>

          <div className="admin-form-field">
            <label htmlFor="ca-sort">Порядок отображения</label>
            <input
              id="ca-sort"
              type="number"
              className="filter-text-input mono-num"
              value={flags.sortOrder}
              onChange={(e) => setFlags((f) => ({ ...f, sortOrder: e.target.value }))}
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Отвязать атрибут?"
        description={`Атрибут «${deleteTarget?.attributeName}» будет отвязан от категории «${category?.name}».`}
        onCancel={() => setDeleteTarget(null)}
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(deleteTarget.attributeId, { onSuccess: () => setDeleteTarget(null) });
        }}
      />
    </div>
  );
}
