'use client';

import { Modal } from './Modal';
import { Button } from '@/components/ui/Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Удалить',
  onConfirm,
  onCancel,
  isPending,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Отмена
          </Button>
          <Button size="sm" onClick={onConfirm} disabled={isPending}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate)' }}>{description}</p>
    </Modal>
  );
}
