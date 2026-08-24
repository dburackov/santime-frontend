'use client';

import Link from 'next/link';
import './ProductListRow.css';
import { ProductPhoto } from '@/components/ui/ProductPhoto';
import { Price } from '@/components/ui/Price';
import { CartToggleButton } from '@/components/cart/CartToggleButton';
import type { CatalogFilterAttributeResponse, VariantCardResponse } from '@/api/types';
import { formatAttributeLine } from '@/utils/attributes';

interface ProductListRowProps {
  variant: VariantCardResponse;
  displayAttributes?: CatalogFilterAttributeResponse[];
}

export function ProductListRow({ variant, displayAttributes = [] }: ProductListRowProps) {
  const attrLines = displayAttributes
    .map((attr) => ({ slug: attr.slug, text: formatAttributeLine(attr, variant.attributes[attr.slug]) }))
    .filter((line): line is { slug: string; text: string } => Boolean(line.text));

  return (
    <div className="product-row">
      <Link href={`/product/${variant.variantSlug}`} className="product-row__link">
        <ProductPhoto image={variant.images?.[0]} alt={variant.name} size="row" />
        <div className="product-row__main">
          {/* h3, а не div — тот же уровень, что у product-card__title в сетке:
              иначе при переключении вида товары пропадали из навигации по
              заголовкам. Визуально ничего не меняется: reset.css обнуляет
              отступы у h1–h4, а размер и насыщенность задаёт сам класс. */}
          <h3 className="product-row__title">{variant.name}</h3>
          {!variant.inStock && <div className="product-row__oos">Нет в наличии</div>}
          {attrLines.length > 0 && (
            <ul className="product-row__attrs">
              {attrLines.map((line) => (
                <li key={line.slug}>{line.text}</li>
              ))}
            </ul>
          )}
        </div>
      </Link>

      <div className="product-row__end">
        <Price value={variant.price} oldValue={variant.oldPrice} size="md" stacked />
        <CartToggleButton variant={variant} showLabel />
      </div>
    </div>
  );
}
