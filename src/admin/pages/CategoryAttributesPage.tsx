'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouteParams } from '@/hooks/useRouteParams';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import '@/admin/admin.css';
import '@/admin/dragOrder.css';
import '@/components/filters/Filters.css';
import './CategoryAttributesPage.css';
import {
  listCategories,
  listAttributes,
  listCategoryAttributes,
  createCategoryAttribute,
  updateCategoryAttribute,
  deleteCategoryAttribute,
  reorderCategoryAttributes,
} from '@/api/admin';
import type { CategoryAttributeResponse, CategoryAttributeUpdateRequest } from '@/api/types';
import { Modal } from '@/admin/components/Modal';
import { ConfirmDialog } from '@/admin/components/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Select } from '@/components/ui/Select';
import { formError } from '@/admin/formErrors';
import { useDragOrder } from '@/admin/useDragOrder';
import { DragHandleIcon, PlusIcon, EditIcon, TrashIcon } from '@/components/ui/icons';

interface FlagsFormState {
  required: boolean;
  isFilter: boolean;
}

const EMPTY_FLAGS: FlagsFormState = { required: false, isFilter: false };

export function CategoryAttributesPage() {
  const { categoryId: categoryIdParam } = useRouteParams<{ categoryId: string }>();
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

  const reorderMutation = useMutation({
    mutationFn: (ids: number[]) => reorderCategoryAttributes(categoryId, ids),
    onSuccess: invalidate,
  });

  const { items: orderedBindings, itemProps, handleProps } = useDragOrder(
    bindings,
    (binding) => binding.attributeId,
    (ids) => reorderMutation.mutate(ids),
  );

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
            <colgroup>
              <col className="category-attributes-page__col--grip" />
              <col className="category-attributes-page__col--name" />
              <col className="category-attributes-page__col--slug" />
              <col className="category-attributes-page__col--type" />
              <col className="category-attributes-page__col--required" />
              <col className="category-attributes-page__col--filter" />
              <col className="category-attributes-page__col--actions" />
            </colgroup>
            <thead>
              <tr>
                <th />
                <th>Название</th>
                <th>Slug</th>
                <th>Тип</th>
                <th>Обязателен</th>
                <th>Фильтр</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {orderedBindings.map((binding) => (
                <tr key={binding.attributeId} {...itemProps(binding.attributeId)}>
                  <td className="drag-handle" {...handleProps(binding.attributeId)}>
                    <DragHandleIcon width={16} height={16} />
                  </td>
                  <td>{binding.attributeName}</td>
                  <td className="mono-num">{binding.attributeSlug}</td>
                  <td>{binding.attributeType}</td>
                  <td>{binding.required ? 'Да' : 'Нет'}</td>
                  <td>{binding.isFilter ? 'Да' : 'Нет'}</td>
                  <td>
                    <div className="admin-table__actions">
                      <button
                        type="button"
                        className="admin-table__icon-btn"
                        onClick={() => openEdit(binding)}
                        aria-label="Редактировать"
                      >
                        <EditIcon width={16} height={16} />
                      </button>
                      <button
                        type="button"
                        className="admin-table__icon-btn admin-table__icon-btn--danger"
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
                portal
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
