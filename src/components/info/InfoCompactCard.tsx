import './InfoCompactCard.css';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRightIcon } from '@/components/ui/icons';

interface InfoCompactCardProps {
  icon: ReactNode;
  title: string;
  more: { label: string; to: string };
  children: ReactNode;
}

/** Карточка-сводка на странице товара (десктоп и планшет; на телефоне — InfoMobileCard). */
export function InfoCompactCard({ icon, title, more, children }: InfoCompactCardProps) {
  return (
    <div className="info-compact">
      <h3 className="info-compact__head">
        <span className="info-compact__icon">{icon}</span>
        <span className="info-compact__title">{title}</span>
      </h3>
      <div className="info-compact__body">
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
