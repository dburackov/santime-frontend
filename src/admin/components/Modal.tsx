'use client';

import { useEffect, useRef } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';
import './Modal.css';
import { CloseIcon } from '@/components/ui/icons';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Фокусируем сам контейнер, а не первое поле: скринридер прочитает заголовок,
  // а на мобильном не выскочит клавиатура. Тот же приём, что в ProductLightbox,
  // но с guard'ом на open — Modal остаётся в дереве и закрытым.
  useEffect(() => {
    if (!open) return;
    // В StrictMode эффекты идут монтирование → cleanup → монтирование, и на втором
    // проходе activeElement — уже сам диалог. Проверка вложенности не даёт перетереть
    // настоящий триггер.
    const previous = document.activeElement as HTMLElement | null;
    if (previous && !dialogRef.current?.contains(previous)) {
      restoreRef.current = previous;
    }
    dialogRef.current?.focus();

    return () => {
      const target = restoreRef.current;
      if (target && document.contains(target)) target.focus();
    };
  }, [open]);

  // Ловушка Tab: без неё фокус уходит на невидимый контент под оверлеем, а браузер
  // доскролливает каждый такой элемент в видимую область.
  function handleTrapKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Tab' || !dialogRef.current) return;
    // Панель SearchableSelect с портала живёт вне диалога, но её события всплывают
    // сюда по React-дереву. Пока фокус там, ловушка не вмешивается.
    if (!dialogRef.current.contains(document.activeElement)) return;
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  if (!open) return null;

  return (
    <div className="admin-modal">
      <div className="admin-modal__backdrop" onClick={onClose} />
      <div
        ref={dialogRef}
        className="admin-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onKeyDown={handleTrapKeyDown}
      >
        <div className="admin-modal__header">
          <h2>{title}</h2>
          <button
            type="button"
            className="admin-modal__close touch-target"
            onClick={onClose}
            aria-label="Закрыть"
          >
            <CloseIcon width={18} height={18} />
          </button>
        </div>
        <div className="admin-modal__body">{children}</div>
        {footer && <div className="admin-modal__footer">{footer}</div>}
      </div>
    </div>
  );
}
