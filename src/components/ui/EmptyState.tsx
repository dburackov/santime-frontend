'use client';

import './StateCard.css';
import { BoxIcon } from './icons';
import { Button } from './Button';

interface EmptyStateProps {
  title?: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title = 'Ничего не найдено',
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="state-card">
      <BoxIcon width={32} height={32} className="state-card__icon" />
      <h3 className="state-card__title">{title}</h3>
      <p className="state-card__text">{description}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
