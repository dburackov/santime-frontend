import { useEffect } from 'react';
import type { ReactNode } from 'react';
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
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="admin-modal">
      <div className="admin-modal__backdrop" onClick={onClose} />
      <div className="admin-modal__dialog" role="dialog" aria-modal="true" aria-label={title}>
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
