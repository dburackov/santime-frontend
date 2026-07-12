import { useState } from 'react';
import type { FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import '@/admin/admin.css';
import '@/components/filters/Filters.css';
import {
  listAttributeOptions,
  createAttributeOption,
  updateAttributeOption,
  deleteAttributeOption,
  listAttributes,
} from '@/api/admin';
import type { AttributeOptionRequest, AttributeOptionResponse } from '@/api/types';
import { useAdminResource } from '@/admin/useAdminResource';
import { Modal } from '@/admin/components/Modal';
import { ConfirmDialog } from '@/admin/components/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { fieldError, formError } from '@/admin/formErrors';
import { PlusIcon, EditIcon, TrashIcon } from '@/components/ui/icons';

export function AttributeOptionsPage() {
  const { attributeId: attributeIdParam } = useParams<{ attributeId: string }>();
  const attributeId = Number(attributeIdParam);

  const { data: attributes } = useQuery({ queryKey: ['admin-attributes'], queryFn: listAttributes });
  const attribute = attributes?.find((a) => a.id === attributeId);

  const { items, isError, refetch, createMutation, updateMutation, deleteMutation } = useAdminResource<
    AttributeOptionResponse,
    AttributeOptionRequest
  >({
    queryKey: ['admin-attribute-options', attributeId],
    list: () => listAttributeOptions(attributeId),
    create: (body) => createAttributeOption(attributeId, body),
    update: (id, body) => updateAttributeOption(attributeId, id, body),
    remove: (id) => deleteAttributeOption(attributeId, id),
  });

  const [editing, setEditing] = useState<AttributeOptionResponse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [value, setValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AttributeOptionResponse | null>(null);

  function openCreate() {
    setEditing(null);
    setValue('');
    setModalOpen(true);
  }

  function openEdit(option: AttributeOptionResponse) {
    setEditing(option);
    setValue(option.value);
    setModalOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const body: AttributeOptionRequest = { value };
    const action = editing
      ? updateMutation.mutateAsync({ id: editing.id, body })
      : createMutation.mutateAsync(body);
    action.then(() => setModalOpen(false)).catch(() => {});
  }

  const activeMutation = editing ? updateMutation : createMutation;

  return (
    <div className="admin-page">
      <Breadcrumbs
        items={[{ label: 'Атрибуты', to: '/admin/attributes' }, { label: attribute?.name ?? '…' }]}
      />

      <div className="admin-page__header">
        <h1>Значения: {attribute?.name}</h1>
        <Button size="sm" onClick={openCreate}>
          <PlusIcon width={16} height={16} />
          Добавить значение
        </Button>
      </div>

      {isError && <ErrorState description="Не удалось загрузить значения." onRetry={refetch} />}

      {!isError && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Значение</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items?.map((option) => (
                <tr key={option.id}>
                  <td className="mono-num">{option.id}</td>
                  <td>{option.value}</td>
                  <td>
                    <div className="admin-table__actions">
                      <button
                        type="button"
                        className="admin-table__icon-btn touch-target"
                        onClick={() => openEdit(option)}
                        aria-label="Редактировать"
                      >
                        <EditIcon width={16} height={16} />
                      </button>
                      <button
                        type="button"
                        className="admin-table__icon-btn admin-table__icon-btn--danger touch-target"
                        onClick={() => setDeleteTarget(option)}
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
          {items?.length === 0 && <div className="admin-empty">Значений пока нет.</div>}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Редактировать значение' : 'Новое значение'}
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
            <label htmlFor="option-value">Значение</label>
            <input
              id="option-value"
              className="filter-text-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            />
            {fieldError(activeMutation.error, 'value') && (
              <span className="admin-form-error">{fieldError(activeMutation.error, 'value')}</span>
            )}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Удалить значение?"
        description={`Значение «${deleteTarget?.value}» будет удалено.`}
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
