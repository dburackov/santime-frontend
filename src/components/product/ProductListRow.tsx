'use client';

import Link from 'next/link';
import './ProductListRow.css';
import { ProductPhoto } from '@/components/ui/ProductPhoto';
import { Price } from '@/components/ui/Price';
import { Button } from '@/components/ui/Button';
import type { CatalogFilterAttributeResponse, VariantCardResponse } from '@/api/types';
import { formatAttributeLine } from '@/utils/attributes';
import { useCart } from '@/cart/useCart';

interface ProductListRowProps {
  variant: VariantCardResponse;
  displayAttributes?: CatalogFilterAttributeResponse[];
}

export function ProductListRow({ variant, displayAttributes = [] }: ProductListRowProps) {
  const { addItem } = useCart();

  const attrLines = displayAttributes
    .map((attr) => ({ slug: attr.slug, text: formatAttributeLine(attr, variant.attributes[attr.slug]) }))
    .filter((line): line is { slug: string; text: string } => Boolean(line.text));

  return (
    <div className="product-row">
      <Link href={`/product/${variant.variantSlug}`} className="product-row__link">
        <ProductPhoto image={variant.images?.[0]} alt={variant.productName} size="row" />
        <div className="product-row__main">
          <div className="product-row__title">{variant.productName}</div>
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
        <Price value={variant.price} size="md" />
        <Button
          size="sm"
          disabled={!variant.inStock}
          onClick={() =>
            addItem({
              variantId: variant.variantId,
              variantSlug: variant.variantSlug,
              productName: variant.productName,
              price: variant.price,
              attributes: variant.attributes,
              image: variant.images?.[0] ?? null,
            })
          }
        >
          В корзину
        </Button>
      </div>
    </div>
  );
}
