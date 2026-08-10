import './Price.css';
import { CurrencySymbol } from './CurrencySymbol';
import { formatPrice } from '@/utils/price';

interface PriceProps {
  value: number;
  oldValue?: number | null;
  size?: 'sm' | 'md' | 'lg';
  stacked?: boolean;
  className?: string;
}

export function Price({ value, oldValue, size = 'md', stacked = false, className }: PriceProps) {
  const discounted = oldValue != null && oldValue > value;

  const priceSpan = (
    <span className={`price price--${size} ${discounted ? 'price--discounted' : ''} ${className ?? ''}`}>
      {formatPrice(value)} <CurrencySymbol />
    </span>
  );

  if (!discounted) return priceSpan;

  return (
    <span className={`price-group ${stacked ? 'price-group--stacked' : ''}`}>
      {priceSpan}
      <span className="price__old">
        <span className="price__old-value">{formatPrice(oldValue)}</span> <CurrencySymbol />
      </span>
    </span>
  );
}
