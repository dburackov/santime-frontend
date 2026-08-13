'use client';

import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useRouteParams } from '@/hooks/useRouteParams';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import '@/admin/admin.css';
import '@/admin/dragOrder.css';
import './ProductImagesPage.css';
import {
  listProductImages,
  uploadProductImage,
  updateProductImageAlt,
  deleteProductImage,
  reorderProductImages,
  getProduct,
} from '@/api/admin';
import type { ProductImageAdminResponse } from '@/api/types';
import { ConfirmDialog } from '@/admin/components/ConfirmDialog';
import { ImageAltEditor } from '@/admin/components/ImageAltEditor';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PlusIcon, TrashIcon } from '@/components/ui/icons';
import { useDragOrder } from '@/admin/useDragOrder';
import { formError } from '@/admin/formErrors';

export function ProductImagesPage() {
  const { productId: productIdParam } = useRouteParams<{ productId: string }>();
  const productId = Number(productIdParam);
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: product } = useQuery({
    queryKey: ['admin-product', productId],
    queryFn: () => getProduct(productId),
  });

  const {
    data: images,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin-product-images', productId],
    queryFn: () => listProductImages(productId),
  });

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: ['admin-product-images', productId] });
  }

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadProductImage(productId, file),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: (imageId: number) => deleteProductImage(productId, imageId),
    onSuccess: invalidate,
  });
  const reorderMutation = useMutation({
    mutationFn: (ids: number[]) => reorderProductImages(productId, ids),
    onSuccess: invalidate,
  });

  const { items: orderedImages, itemProps, handleProps } = useDragOrder(
    images,
    (image) => image.id,
    (ids) => reorderMutation.mutate(ids),
  );

  const [editingImage, setEditingImage] = useState<ProductImageAdminResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductImageAdminResponse | null>(null);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    uploadMutation.mutate(file);
  }

  return (
    <div className="admin-page">
      <Breadcrumbs items={[{ label: 'Товары', to: '/admin/products' }, { label: product?.name ?? '…' }]} />

      <div className="admin-page__header">
        <h1>Фото: {product?.name}</h1>
        <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}>
          <PlusIcon width={16} height={16} />
          Загрузить фото
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={handleFileChange}
        />
      </div>

      {formError(uploadMutation.error) && (
        <div className="admin-banner-error">{formError(uploadMutation.error)}</div>
      )}

      {isError && <ErrorState description="Не удалось загрузить фото." onRetry={refetch} />}

      {!isError && (
        <div className="product-images-grid">
          {orderedImages.map((image) => (
            <div className="product-image-card" key={image.id} {...itemProps(image.id)}>
              <div className="product-image-card__thumb drag-handle" {...handleProps(image.id)}>
                <img src={image.originalUrl} alt={image.altText ?? ''} draggable={false} />
              </div>
              <div className="product-image-card__actions">
                <button type="button" className="admin-table__link-btn" onClick={() => setEditingImage(image)}>
                  Редактировать
                </button>
                <button
                  type="button"
                  className="admin-table__icon-btn admin-table__icon-btn--danger touch-target"
                  onClick={() => setDeleteTarget(image)}
                  aria-label="Удалить"
                >
                  <TrashIcon width={16} height={16} />
                </button>
              </div>
            </div>
          ))}
          {!isLoading && images?.length === 0 && <div className="admin-empty">Фото пока нет.</div>}
        </div>
      )}

      {editingImage && (
        <ImageAltEditor
          image={editingImage}
          onSave={(body) => updateProductImageAlt(productId, editingImage.id, body)}
          onClose={() => setEditingImage(null)}
          onSaved={() => {
            invalidate();
            setEditingImage(null);
          }}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Удалить фото?"
        description="Фото будет удалено безвозвратно."
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
