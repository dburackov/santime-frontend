import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import './FocalPointEditor.css';
import { Modal } from './Modal';
import { Button } from '@/components/ui/Button';
import type { ProductImageAdminResponse, ProductImageFocalPointRequest } from '@/api/types';
import { formError } from '@/admin/formErrors';

interface FocalPointEditorProps {
  image: ProductImageAdminResponse;
  /** Сохраняет точку фокуса/alt — вызывающая сторона решает, товар это фото или фото варианта (api.md, 2.8/2.9). */
  onSave: (body: ProductImageFocalPointRequest) => Promise<ProductImageAdminResponse>;
  onClose: () => void;
  onSaved: () => void;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

const PREVIEW_SHAPES = [{ modifier: 'tile', label: 'Плитка каталога' }] as const;

/** Виджет выбора точки фокуса с живым превью (IMAGE-PIPELINE-SPEC.md, 9.2). */
export function FocalPointEditor({ image, onSave, onClose, onSaved }: FocalPointEditorProps) {
  const [focal, setFocal] = useState({ x: image.focalX, y: image.focalY });
  const [altText, setAltText] = useState(image.altText ?? '');
  const imgRef = useRef<HTMLImageElement>(null);

  const saveMutation = useMutation({
    mutationFn: () => onSave({ focalX: focal.x, focalY: focal.y, altText: altText || null }),
    onSuccess: onSaved,
  });

  function updateFromPointer(e: ReactPointerEvent<HTMLDivElement>) {
    // считаем координаты относительно самого фото, а не обёртки — у обёртки
    // есть min-height на случай, если фото ещё не загрузилось, и клик в этом
    // "пустом" запасе высоты не должен давать точку за пределами фото
    const rect = imgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    setFocal({
      x: clamp01((e.clientX - rect.left) / rect.width),
      y: clamp01((e.clientY - rect.top) / rect.height),
    });
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromPointer(e);
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.buttons !== 1) return;
    updateFromPointer(e);
  }

  const objectPosition = `${focal.x * 100}% ${focal.y * 100}%`;

  return (
    <Modal
      open
      onClose={onClose}
      title="Точка фокуса"
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

      <p className="focal-editor__hint">
        Кликните или перетащите точку на фото — она останется в центре кадра на плитке и в карточке товара.
      </p>

      <div
        className="focal-editor__picker"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      >
        <img ref={imgRef} src={image.originalUrl} alt="" draggable={false} />
        <div className="focal-editor__marker" style={{ left: `${focal.x * 100}%`, top: `${focal.y * 100}%` }} />
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

      <div className="focal-editor__previews">
        {PREVIEW_SHAPES.map((shape) => (
          <div key={shape.modifier} className={`focal-editor__preview focal-editor__preview--${shape.modifier}`}>
            <img src={image.originalUrl} alt="" style={{ objectPosition }} />
            <span>{shape.label}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}
