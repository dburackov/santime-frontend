import { useState } from 'react';
import type { FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import '@/admin/admin.css';
import '@/components/filters/Filters.css';
import {
  listProductVariants,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  getProduct,
  listCategoryAttributes,
  listAttributeOptions,
} from '@/api/admin';
import type {
  AttributeOptionResponse,
  AttributeValue,
  CategoryAttributeResponse,
  ProductVariantRequest,
  ProductVariantResponse,
} from '@/api/types';
import { Modal } from '@/admin/components/Modal';
import { ConfirmDialog } from '@/admin/components/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Select } from '@/components/ui/Select';
import { fieldError, formError } from '@/admin/formErrors';
import { PlusIcon, EditIcon, TrashIcon } from '@/components/ui/icons';
import { CurrencySymbol } from '@/components/ui/CurrencySymbol';
import { formatAttributeValue } from '@/utils/attributes';

interface FormState {
  slug: string;
  sku: string;
  price: string;
  stockQuantity: string;
  weightKg: string;
  attributes: Record<string, string>;
}

function buildEmptyForm(bindings: CategoryAttributeResponse[] | undefined): FormState {
  const attributes: Record<string, string> = {};
  for (const binding of bindings ?? []) {
    attributes[binding.attributeSlug] = binding.attributeType === 'BOOLEAN' ? 'false' : '';
  }
  return { slug: '', sku: '', price: '', stockQuantity: '0', weightKg: '', attributes };
}

export function ProductVariantsPage() {
  const { productId: productIdParam } = useParams<{ productId: string }>();
  const productId = Number(productIdParam);
  const queryClient = useQueryClient();

  const { data: product } = useQuery({ queryKey: ['admin-product', productId], queryFn: () => getProduct(productId) });

  const { data: bindings } = useQuery({
    queryKey: ['admin-category-attributes', product?.categoryId],
    queryFn: () => listCategoryAttributes(product!.categoryId),
    enabled: product !== undefined,
  });

  const optionAttributeIds = bindings?.filter((b) => b.attributeType === 'OPTION').map((b) => b.attributeId) ?? [];

  const { data: optionsByAttributeId } = useQuery({
    queryKey: ['admin-attribute-options-bulk', optionAttributeIds],
    queryFn: async () => {
      const entries = await Promise.all(
        optionAttributeIds.map(async (id) => [id, await listAttributeOptions(id)] as const),
      );
      return Object.fromEntries(entries) as Record<number, AttributeOptionResponse[]>;
    },
    enabled: optionAttributeIds.length > 0,
  });

  const {
    data: variants,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin-product-variants', productId],
    queryFn: () => listProductVariants(productId),
  });

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: ['admin-product-variants', productId] });
  }

  const createMutation = useMutation({
    mutationFn: (body: ProductVariantRequest) => createProductVariant(productId, body),
    onSuccess: invalidate,
  });
  const updateMutation = useMutation({
    mutationFn: (vars: { id: number; body: ProductVariantRequest }) =>
      updateProductVariant(productId, vars.id, vars.body),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteProductVariant(productId, id),
    onSuccess: invalidate,
  });

  const [editing, setEditing] = useState<ProductVariantResponse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(() => buildEmptyForm(bindings));
  const [deleteTarget, setDeleteTarget] = useState<ProductVariantResponse | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(buildEmptyForm(bindings));
    setModalOpen(true);
  }

  function openEdit(variant: ProductVariantResponse) {
    setEditing(variant);
    const attributes: Record<string, string> = {};
    for (const binding of bindings ?? []) {
      const value = variant.attributes[binding.attributeSlug];
      attributes[binding.attributeSlug] = value === undefined || value === null ? '' : String(value);
    }
    setForm({
      slug: variant.slug,
      sku: variant.sku,
      price: variant.price.toString(),
      stockQuantity: variant.stockQuantity.toString(),
      weightKg: variant.weightKg?.toString() ?? '',
      attributes,
    });
    setModalOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const attributes: Record<string, AttributeValue> = {};
    for (const binding of bindings ?? []) {
      const raw = form.attributes[binding.attributeSlug];
      if (raw === '' || raw === undefined) continue;
      if (binding.attributeType === 'NUMBER') attributes[binding.attributeSlug] = Number(raw);
      else if (binding.attributeType === 'BOOLEAN') attributes[binding.attributeSlug] = raw === 'true';
      else attributes[binding.attributeSlug] = raw;
    }

    const body: ProductVariantRequest = {
      slug: form.slug,
      sku: form.sku,
      price: Number(form.price),
      stockQuantity: Number(form.stockQuantity) || 0,
      weightKg: form.weightKg ? Number(form.weightKg) : null,
      attributes,
    };

    const action = editing
      ? updateMutation.mutateAsync({ id: editing.id, body })
      : createMutation.mutateAsync(body);
    action.then(() => setModalOpen(false)).catch(() => {});
  }

  const activeMutation = editing ? updateMutation : createMutation;

  return (
    <div className="admin-page">
      <Breadcrumbs items={[{ label: 'Товары', to: '/admin/products' }, { label: product?.name ?? '…' }]} />

      <div className="admin-page__header">
        <h1>Варианты: {product?.name}</h1>
        <Button size="sm" onClick={openCreate} disabled={!bindings}>
          <PlusIcon width={16} height={16} />
          Добавить вариант
        </Button>
      </div>

      {isError && <ErrorState description="Не удалось загрузить варианты." onRetry={refetch} />}

      {!isError && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Slug</th>
                <th>SKU</th>
                <th>Цена</th>
                <th>Остаток</th>
                <th>Атрибуты</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {variants?.map((variant) => (
                <tr key={variant.id}>
                  <td className="mono-num">{variant.id}</td>
                  <td className="mono-num">{variant.slug}</td>
                  <td className="mono-num">{variant.sku}</td>
                  <td className="mono-num">{variant.price}</td>
                  <td className="mono-num">{variant.stockQuantity}</td>
                  <td>
                    {(bindings ?? [])
                      .map((b) => formatAttributeValue(b.attributeType, variant.attributes[b.attributeSlug], null))
                      .filter(Boolean)
                      .join(' · ')}
                  </td>
                  <td>
                    <div className="admin-table__actions">
                      <button
                        type="button"
                        className="admin-table__icon-btn touch-target"
                        onClick={() => openEdit(variant)}
                        aria-label="Редактировать"
                      >
                        <EditIcon width={16} height={16} />
                      </button>
                      <button
                        type="button"
                        className="admin-table__icon-btn admin-table__icon-btn--danger touch-target"
                        onClick={() => setDeleteTarget(variant)}
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
          {!isLoading && variants?.length === 0 && <div className="admin-empty">Вариантов пока нет.</div>}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Редактировать вариант' : 'Новый вариант'}
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

          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="variant-slug">Slug</label>
              <input
                id="variant-slug"
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
              <label htmlFor="variant-sku">SKU</label>
              <input
                id="variant-sku"
                className="filter-text-input mono-num"
                value={form.sku}
                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                required
              />
              {fieldError(activeMutation.error, 'sku') && (
                <span className="admin-form-error">{fieldError(activeMutation.error, 'sku')}</span>
              )}
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="variant-price">
                Цена, <CurrencySymbol />
              </label>
              <input
                id="variant-price"
                type="number"
                step="0.01"
                className="filter-text-input mono-num"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                required
              />
              {fieldError(activeMutation.error, 'price') && (
                <span className="admin-form-error">{fieldError(activeMutation.error, 'price')}</span>
              )}
            </div>
            <div className="admin-form-field">
              <label htmlFor="variant-stock">Остаток, шт.</label>
              <input
                id="variant-stock"
                type="number"
                className="filter-text-input mono-num"
                value={form.stockQuantity}
                onChange={(e) => setForm((f) => ({ ...f, stockQuantity: e.target.value }))}
              />
            </div>
            <div className="admin-form-field">
              <label htmlFor="variant-weight">Вес, кг</label>
              <input
                id="variant-weight"
                type="number"
                step="0.001"
                className="filter-text-input mono-num"
                value={form.weightKg}
                onChange={(e) => setForm((f) => ({ ...f, weightKg: e.target.value }))}
              />
            </div>
          </div>

          {bindings && bindings.length > 0 && (
            <>
              <div className="admin-form-field">
                <label>Характеристики категории</label>
              </div>
              {bindings.map((binding) => (
                <AttributeField
                  key={binding.attributeSlug}
                  binding={binding}
                  value={form.attributes[binding.attributeSlug] ?? ''}
                  options={optionsByAttributeId?.[binding.attributeId]}
                  onChange={(value) =>
                    setForm((f) => ({ ...f, attributes: { ...f.attributes, [binding.attributeSlug]: value } }))
                  }
                  error={fieldError(activeMutation.error, binding.attributeSlug)}
                />
              ))}
            </>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Удалить вариант?"
        description={`Вариант «${deleteTarget?.slug}» будет удалён безвозвратно.`}
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

interface AttributeFieldProps {
  binding: CategoryAttributeResponse;
  value: string;
  options: AttributeOptionResponse[] | undefined;
  onChange: (value: string) => void;
  error?: string;
}

function AttributeField({ binding, value, options, onChange, error }: AttributeFieldProps) {
  const label = `${binding.attributeName}${binding.required ? ' *' : ''}`;

  if (binding.attributeType === 'BOOLEAN') {
    return (
      <label className="admin-form-checkbox">
        <input type="checkbox" checked={value === 'true'} onChange={(e) => onChange(e.target.checked ? 'true' : 'false')} />
        {label}
      </label>
    );
  }

  if (binding.attributeType === 'OPTION') {
    return (
      <div className="admin-form-field">
        <label>{label}</label>
        <Select
          options={[
            { value: '', label: '— не выбрано —' },
            ...(options?.map((option) => ({ value: option.value, label: option.value })) ?? []),
          ]}
          value={value}
          onChange={onChange}
        />
        {error && <span className="admin-form-error">{error}</span>}
      </div>
    );
  }

  return (
    <div className="admin-form-field">
      <label>{label}</label>
      <input
        type={binding.attributeType === 'NUMBER' ? 'number' : 'text'}
        className="filter-text-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <span className="admin-form-error">{error}</span>}
    </div>
  );
}
