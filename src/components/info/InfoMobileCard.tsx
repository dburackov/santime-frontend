import './InfoMobileCard.css';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronRightIcon } from '@/components/ui/icons';

interface InfoMobileCardProps {
  /** Полная страница условий, на неё ведёт стрелка справа. */
  to: string;
  moreLabel: string;
  children: ReactNode;
}

/**
 * Мобильная карточка-сводка: содержимое слева, стрелка на всю высоту справа. Стрелка —
 * отдельная ссылка, а не вся карточка: внутри бывают свои кнопки (вкладки доставки).
 */
export function InfoMobileCard({ to, moreLabel, children }: InfoMobileCardProps) {
  return (
    <div className="info-mobile-card">
      <div className="info-mobile-card__content">{children}</div>
      <Link href={to} className="info-mobile-card__more" aria-label={moreLabel}>
        <ChevronRightIcon width={20} height={20} />
      </Link>
    </div>
  );
}
