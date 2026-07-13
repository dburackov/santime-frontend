import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import '@/admin/admin.css';
import '@/components/filters/Filters.css';
import { listAttributes, createAttribute, updateAttribute, deleteAttribute } from '@/api/admin';
import type { AttributeRequest, AttributeResponse, AttributeType } from '@/api/types';
import { useAdminResource } from '@/admin/useAdminResource';
import { Modal } from '@/admin/components/Modal';
import { ConfirmDialog } from '@/admin/components/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Select } from '@/components/ui/Select';
import { fieldError, formError } from '@/admin/formErrors';
import { PlusIcon, EditIcon, TrashIcon } from '@/components/ui/icons';

const QUERY_KEY = ['admin-attributes'];

const TYPE_LABELS: Record<AttributeType, string> = {
  STRING: 'Текст (STRING)',
  NUMBER: 'Число (NUMBER)',
  BOOLEAN: 'Да/нет (BOOLEAN)',
  OPTION: 'Список значений (OPTION)',
};

interface FormState {
  name: string;
  slug: string;
  type: AttributeType;
  unit: string;
}

const EMPTY_FORM: FormState = { name: '', slug: '', type: 'STRING', unit: '' };

export function AttributesPage() {
  const { items, isError, refetch, createMutation, updateMutation, deleteMutation } = useAdminResource<
    AttributeResponse,
    AttributeRequest
  >({
    queryKey: QUERY_KEY,
    list: listAttributes,
    create: createAttribute,
    update: updateAttribute,
    remove: deleteAttribute,
  });

  const [editing, setEditing] = useState<AttributeResponse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<AttributeResponse | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(attribute: AttributeResponse) {
    setEditing(attribute);
    setForm({ name: attribute.name, slug: attribute.slug, type: attribute.type, unit: attribute.unit ?? '' });
    setModalOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const body: AttributeRequest = {
      name: form.name,
      slug: form.slug,
      type: form.type,
      unit: form.unit || null,
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
        <h1>Атрибуты</h1>
        <Button size="sm" onClick={openCreate}>
          <PlusIcon width={16} height={16} />
          Добавить атрибут
        </Button>
      </div>

      {isError && <ErrorState description="Не удалось загрузить атрибуты." onRetry={refetch} />}

      {!isError && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Slug</th>
                <th>Тип</th>
                <th>Ед. изм.</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items?.map((attribute) => (
                <tr key={attribute.id}>
                  <td className="mono-num">{attribute.id}</td>
                  <td>{attribute.name}</td>
                  <td className="mono-num">{attribute.slug}</td>
                  <td>{TYPE_LABELS[attribute.type]}</td>
                  <td className="mono-num">{attribute.unit ?? '—'}</td>
                  <td>
                    <div className="admin-table__actions">
                      {attribute.type === 'OPTION' && (
                        <Link to={`/admin/attributes/${attribute.id}/options`} className="admin-table__link-btn">
                          Значения
                        </Link>
                      )}
                      <button
                        type="button"
                        className="admin-table__icon-btn touch-target"
                        onClick={() => openEdit(attribute)}
                        aria-label="Редактировать"
                      >
                        <EditIcon width={16} height={16} />
                      </button>
                      <button
                        type="button"
                        className="admin-table__icon-btn admin-table__icon-btn--danger touch-target"
                        onClick={() => setDeleteTarget(attribute)}
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
          {items?.length === 0 && <div className="admin-empty">Атрибутов пока нет.</div>}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Редактировать атрибут' : 'Новый атрибут'}
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
            <label htmlFor="attr-name">Название</label>
            <input
              id="attr-name"
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
            <label htmlFor="attr-slug">Slug</label>
            <input
              id="attr-slug"
              className="filter-text-input mono-num"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              required
            />
            {fieldError(activeMutation.error, 'slug') && (
              <span className="admin-form-error">{fieldError(activeMutation.error, 'slug')}</span>
            )}
          </div>
          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="attr-type">Тип</label>
              <Select
                id="attr-type"
                options={(Object.keys(TYPE_LABELS) as AttributeType[]).map((type) => ({
                  value: type,
                  label: TYPE_LABELS[type],
                }))}
                value={form.type}
                onChange={(value) => setForm((f) => ({ ...f, type: value as AttributeType }))}
                portal
              />
            </div>
            <div className="admin-form-field">
              <label htmlFor="attr-unit">Единица измерения</label>
              <input
                id="attr-unit"
                className="filter-text-input"
                placeholder="напр. ГБ, см, кг"
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              />
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Удалить атрибут?"
        description={`Атрибут «${deleteTarget?.name}» будет удалён из всех категорий и товаров.`}
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
