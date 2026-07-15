import { Link } from 'react-router-dom';
import './ProductCard.css';
import { ProductPhoto } from '@/components/ui/ProductPhoto';
import { Price } from '@/components/ui/Price';
import type { CatalogFilterAttributeResponse, VariantCardResponse } from '@/api/types';
import { formatAttributeValue } from '@/utils/attributes';

interface ProductCardProps {
  variant: VariantCardResponse;
  displayAttributes?: CatalogFilterAttributeResponse[];
}

export function ProductCard({ variant, displayAttributes = [] }: ProductCardProps) {
  const attrLine = displayAttributes
    .map((attr) => formatAttributeValue(attr.type, variant.attributes[attr.slug], attr.unit))
    .filter((v): v is string => Boolean(v))
    .slice(0, 2)
    .join(' · ');

  return (
    <Link to={`/product/${variant.variantSlug}`} className="product-card">
      <ProductPhoto image={variant.images?.[0]} alt={variant.productName} size="card" />
      <div className="product-card__body">
        <h3 className="product-card__title">{variant.productName}</h3>
        {attrLine && <p className="product-card__attrs">{attrLine}</p>}
        <div className="product-card__footer">
          <Price value={variant.price} size="md" />
          {!variant.inStock && <span className="product-card__oos">Нет в наличии</span>}
        </div>
      </div>
    </Link>
  );
}
