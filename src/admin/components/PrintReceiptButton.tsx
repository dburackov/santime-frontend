'use client';

import { useMutation } from '@tanstack/react-query';
import { getOrderReceipt } from '@/api/admin';
import { Button } from '@/components/ui/Button';
import { PrinterIcon } from '@/components/ui/icons';
import { saveFile } from '@/utils/downloadFile';

interface PrintReceiptButtonProps {
  orderId: number;
  variant?: 'icon' | 'button';
  onError?: (error: unknown) => void;
}

export function PrintReceiptButton({ orderId, variant = 'button', onError }: PrintReceiptButtonProps) {
  const mutation = useMutation({
    mutationFn: () => getOrderReceipt(orderId),
    onSuccess: (file) => saveFile(file, `Товарный чек № ${orderId}.docx`),
    onError,
  });

  if (variant === 'icon') {
    return (
      <button
        type="button"
        className="admin-table__icon-btn"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        aria-label="Печать товарного чека"
        title="Печать товарного чека"
      >
        <PrinterIcon width={16} height={16} />
      </button>
    );
  }

  return (
    <Button size="sm" variant="secondary" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
      <PrinterIcon width={16} height={16} />
      {mutation.isPending ? 'Готовим…' : 'Печать'}
    </Button>
  );
}
