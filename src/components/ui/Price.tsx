import './Price.css';
import { CurrencySymbol } from './CurrencySymbol';
import { formatPrice } from '@/utils/price';

interface PriceProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Price({ value, size = 'md', className }: PriceProps) {
  return (
    <span className={`price price--${size} ${className ?? ''}`}>
      {formatPrice(value)} <CurrencySymbol />
    </span>
  );
}
