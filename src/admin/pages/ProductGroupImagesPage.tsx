'use client';

import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useRouteParams } from '@/hooks/useRouteParams';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import '@/admin/admin.css';
import '@/admin/dragOrder.css';
import '@/admin/imagesGrid.css';
import {
  listGroupImages,
  uploadGroupImage,
  updateGroupImageAlt,
  deleteGroupImage,
  reorderGroupImages,
  getProductGroup,
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

/** Общие фото модели: на витрине идут в галерее каждого исполнения после его собственных. */
export function ProductGroupImagesPage() {
  const groupId = Number(useRouteParams<{ groupId: string }>().groupId);
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: group } = useQuery({
    queryKey: ['admin-product-group', groupId],
    queryFn: () => getProductGroup(groupId),
  });

  // Своего имени у модели нет — берём имя базового исполнения, как и alt по умолчанию на бэке.
  const title = group?.variants[0]?.name;

  const {
    data: images,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin-group-images', groupId],
    queryFn: () => listGroupImages(groupId),
  });

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: ['admin-group-images', groupId] });
  }

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadGroupImage(groupId, file),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: (imageId: number) => deleteGroupImage(groupId, imageId),
    onSuccess: invalidate,
  });
  const reorderMutation = useMutation({
    mutationFn: (ids: number[]) => reorderGroupImages(groupId, ids),
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
      <Breadcrumbs items={[{ label: 'Товары', to: '/admin/products' }, { label: title ?? '…' }]} />

      <div className="admin-page__header">
        <h1>Общие фото: {title}</h1>
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

      <p className="admin-form-hint">
        Эти фото видны у всех исполнений модели — после собственных фото исполнения.
      </p>

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
          onSave={(body) => updateGroupImageAlt(groupId, editingImage.id, body)}
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
