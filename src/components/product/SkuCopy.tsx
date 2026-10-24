'use client';

import './SkuCopy.css';
import { useEffect, useRef, useState } from 'react';
import { CheckIcon, CopyIcon } from '@/components/ui/icons';

const FEEDBACK_MS = 1600;

interface SkuCopyProps {
  sku: string;
  /** У правого края экрана подсказку «Скопировано» прижимаем вправо, иначе она уедет за край. */
  tooltipAlign?: 'center' | 'end';
}

export function SkuCopy({ sku, tooltipAlign = 'center' }: SkuCopyProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sku);
    } catch {
      return;
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), FEEDBACK_MS);
  };

  return (
    <span className={`sku-copy${tooltipAlign === 'end' ? ' sku-copy--end' : ''}`}>
      Артикул:
      <button type="button" className="sku-copy__button" onClick={copy} title="Скопировать артикул">
        <span className="mono-num">{sku}</span>
        {copied ? (
          <CheckIcon className="sku-copy__icon sku-copy__icon--done" width={14} height={14} strokeWidth={2.4} />
        ) : (
          <CopyIcon className="sku-copy__icon" width={14} height={14} />
        )}
        {copied && (
          <span className="sku-copy__tooltip" role="status">
            Скопировано
          </span>
        )}
      </button>
    </span>
  );
}
