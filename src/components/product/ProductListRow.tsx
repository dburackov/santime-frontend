import { Link } from 'react-router-dom';
import './ProductListRow.css';
import { ProductPhoto } from '@/components/ui/ProductPhoto';
import { Price } from '@/components/ui/Price';
import { Button } from '@/components/ui/Button';
import type { CatalogFilterAttributeResponse, VariantCardResponse } from '@/api/types';
import { formatAttributeValue } from '@/utils/attributes';
import { useCart } from '@/cart/useCart';

interface ProductListRowProps {
  variant: VariantCardResponse;
  displayAttributes?: CatalogFilterAttributeResponse[];
}

export function ProductListRow({ variant, displayAttributes = [] }: ProductListRowProps) {
  const { addItem } = useCart();

  const attrLine = displayAttributes
    .map((attr) => formatAttributeValue(attr.type, variant.attributes[attr.slug], attr.unit))
    .filter((v): v is string => Boolean(v))
    .join(' · ');

  return (
    <div className="product-row">
      <Link to={`/product/${variant.variantSlug}`} className="product-row__link">
        <ProductPhoto image={variant.images?.[0]} alt={variant.productName} size="thumb" />
        <div className="product-row__main">
          <div className="product-row__title">{variant.productName}</div>
          {attrLine && <div className="product-row__attrs">{attrLine}</div>}
          {!variant.inStock && <div className="product-row__oos">Нет в наличии</div>}
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
