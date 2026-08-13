'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import './ImageAltEditor.css';
import { Modal } from './Modal';
import { Button } from '@/components/ui/Button';
import type { ProductImageAdminResponse, ProductImageAltRequest } from '@/api/types';
import { formError } from '@/admin/formErrors';

interface ImageAltEditorProps {
  image: ProductImageAdminResponse;
  /** Сохраняет alt — вызывающая сторона решает, товар это фото или фото варианта (api.md, 2.8/2.9). */
  onSave: (body: ProductImageAltRequest) => Promise<ProductImageAdminResponse>;
  onClose: () => void;
  onSaved: () => void;
}

export function ImageAltEditor({ image, onSave, onClose, onSaved }: ImageAltEditorProps) {
  const [altText, setAltText] = useState(image.altText ?? '');

  const saveMutation = useMutation({
    mutationFn: () => onSave({ altText: altText || null }),
    onSuccess: onSaved,
  });

  return (
    <Modal
      open
      onClose={onClose}
      title="Alt-текст"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Отмена
          </Button>
          <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            Сохранить
          </Button>
        </>
      }
    >
      {formError(saveMutation.error) && (
        <div className="admin-banner-error">{formError(saveMutation.error)}</div>
      )}

      <div className="image-alt-editor__preview">
        <img src={image.originalUrl} alt="" draggable={false} />
      </div>

      <div className="admin-form-field">
        <label htmlFor="image-alt">Alt-текст</label>
        <input
          id="image-alt"
          className="filter-text-input"
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          placeholder="Если пусто — сгенерируется автоматически"
        />
      </div>
    </Modal>
  );
}
