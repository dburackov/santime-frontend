'use client';

import './InfoCompactCard.css';
import Link from 'next/link';
import { useId, useState, type ReactNode } from 'react';
import { ArrowRightIcon, ChevronDownIcon } from '@/components/ui/icons';

interface InfoCompactCardProps {
  icon: ReactNode;
  title: string;
  more: { label: string; to: string };
  children: ReactNode;
}

/**
 * Карточка-сводка на странице товара. На десктопе всегда раскрыта, на телефоне шапка
 * работает как аккордеон: по умолчанию закрыто, чтобы две карточки не растягивали страницу.
 */
export function InfoCompactCard({ icon, title, more, children }: InfoCompactCardProps) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();

  return (
    <div className="info-compact" data-open={open}>
      <h3 className="info-compact__heading">
        <button
          type="button"
          className="info-compact__head"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen((isOpen) => !isOpen)}
        >
          <span className="info-compact__icon">{icon}</span>
          <span className="info-compact__title">{title}</span>
          <ChevronDownIcon className="info-compact__chevron" width={18} height={18} />
        </button>
      </h3>
      <div id={bodyId} className="info-compact__body">
        <div className="info-compact__rows">{children}</div>
        <Link href={more.to} className="info-compact__more">
          {more.label}
          <ArrowRightIcon width={15} height={15} />
        </Link>
      </div>
    </div>
  );
}

interface InfoCompactRowProps {
  title: string;
  note: string;
  aside?: ReactNode;
}

export function InfoCompactRow({ title, note, aside }: InfoCompactRowProps) {
  return (
    <div className="info-compact__row">
      <span className="info-compact__row-main">
        <span className="info-compact__row-title">{title}</span>
        <span className="info-compact__row-note">{note}</span>
      </span>
      {aside && <span className="info-compact__row-aside">{aside}</span>}
    </div>
  );
}
