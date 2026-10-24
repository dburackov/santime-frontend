import './StockBadge.css';

const LOW_STOCK = 5;

/** Пилюля наличия: остаток показываем, только когда он уже мал и подталкивает решиться. */
export function StockBadge({ stock }: { stock: number }) {
  return (
    <span className={`stock-badge${stock > 0 ? '' : ' stock-badge--out'}`}>
      <span className="stock-badge__dot" aria-hidden="true" />
      {stock > 0 ? `В наличии${stock <= LOW_STOCK ? ` — осталось ${stock}` : ''}` : 'Нет в наличии'}
    </span>
  );
}
