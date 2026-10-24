import './ProductCharacteristics.css';
import { buildSpecRows, splitDescription } from './productSpecs';
import type { VariantDetailResponse } from '@/api/types';

interface ProductCharacteristicsProps {
  id: string;
  variant: VariantDetailResponse;
}

/** Характеристики и описание в две колонки. На телефоне их показывает шторка «О товаре». */
export function ProductCharacteristics({ id, variant }: ProductCharacteristicsProps) {
  const rows = buildSpecRows(variant);
  const paragraphs = splitDescription(variant.description);

  if (rows.length === 0 && paragraphs.length === 0) return null;

  return (
    <section id={id} className="product-characteristics">
      <div className="container product-characteristics__inner">
        {rows.length > 0 && (
          <div className="product-characteristics__col">
            <h2 className="product-section-title">Характеристики</h2>
            <dl className="product-characteristics__list">
              {rows.map((row) => (
                <div key={row.key} className="product-characteristics__row">
                  <dt>{row.name}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {paragraphs.length > 0 && (
          <div className="product-characteristics__col">
            <h2 className="product-section-title product-section-title--gold">Описание</h2>
            <div className="product-characteristics__description">
              {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
