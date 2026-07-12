import './CurrencySymbol.css';

const BYN_GLYPH = '';

export function CurrencySymbol({ className }: { className?: string }) {
  return (
    <span className={`currency-symbol ${className ?? ''}`} aria-label="белорусский рубль">
      {BYN_GLYPH}
    </span>
  );
}
