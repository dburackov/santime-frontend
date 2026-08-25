'use client';

import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import './CategoryImageModal.css';
import { Modal } from './Modal';
import { ConfirmDialog } from './ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { uploadCategoryImage, deleteCategoryImage } from '@/api/admin';
import type { CategoryResponse } from '@/api/types';
import { formError } from '@/admin/formErrors';

interface CategoryImageModalProps {
  category: CategoryResponse;
  queryKey: readonly unknown[];
  onClose: () => void;
}

/**
 * Фото у категории ровно одно, поэтому ни порядка, ни alt здесь нет: alt бэкенд
 * берёт из названия категории. Превью показывается по fallback из srcset-набора —
 * отдельного URL оригинала для категории API не отдаёт.
 */
export function CategoryImageModal({ category, queryKey, onClose }: CategoryImageModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey });
  }

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadCategoryImage(category.id, file),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCategoryImage(category.id),
    onSuccess: () => {
      setConfirmingDelete(false);
      return invalidate();
    },
  });

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) uploadMutation.mutate(file);
  }

  const isPending = uploadMutation.isPending || deleteMutation.isPending;

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={`Фото: ${category.name}`}
        footer={
          <Button variant="secondary" size="sm" onClick={onClose}>
            Закрыть
          </Button>
        }
      >
        {formError(uploadMutation.error) && (
          <div className="admin-banner-error">{formError(uploadMutation.error)}</div>
        )}
        {formError(deleteMutation.error) && (
          <div className="admin-banner-error">{formError(deleteMutation.error)}</div>
        )}

        <div className="category-image-modal__preview">
          {category.image ? (
            <img src={category.image.fallback} alt="" draggable={false} />
          ) : (
            <span className="category-image-modal__empty">Фото пока нет</span>
          )}
        </div>

        <p className="admin-form-hint">
          Загрузите снимок на белом фоне, примерно 1200 px по длинной стороне — все размеры для
          витрины бэкенд нарежет сам.
        </p>

        <div className="category-image-modal__actions">
          <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={isPending}>
            {category.image ? 'Заменить фото' : 'Загрузить фото'}
          </Button>
          {category.image && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmingDelete(true)}
              disabled={isPending}
            >
              Удалить
            </Button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={handleFileChange}
        />
      </Modal>

      <ConfirmDialog
        open={confirmingDelete}
        title="Удалить фото категории?"
        description="Фото будет удалено безвозвратно."
        onCancel={() => setConfirmingDelete(false)}
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </>
  );
}
