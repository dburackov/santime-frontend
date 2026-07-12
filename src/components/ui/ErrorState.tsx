import './StateCard.css';
import { AlertIcon } from './icons';
import { Button } from './Button';

interface ErrorStateProps {
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  description = 'Не удалось загрузить товары.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="state-card">
      <AlertIcon width={32} height={32} className="state-card__icon state-card__icon--danger" />
      <p className="state-card__text">{description}</p>
      {onRetry && (
        <Button variant="primary" size="sm" onClick={onRetry}>
          Повторить попытку
        </Button>
      )}
    </div>
  );
}
