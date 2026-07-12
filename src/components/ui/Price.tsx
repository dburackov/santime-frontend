import './Price.css';
import { CurrencySymbol } from './CurrencySymbol';

const formatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

interface PriceProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Price({ value, size = 'md', className }: PriceProps) {
  return (
    <span className={`price price--${size} ${className ?? ''}`}>
      {formatter.format(value)} <CurrencySymbol />
    </span>
  );
}
