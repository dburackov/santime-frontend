'use client';

import Link from 'next/link';
import './ProductCard.css';
import { ProductPhoto } from '@/components/ui/ProductPhoto';
import { Price } from '@/components/ui/Price';
import { Button } from '@/components/ui/Button';
import { CartIcon } from '@/components/ui/icons';
import type { VariantCardResponse } from '@/api/types';
import { useCartActions } from '@/cart/useCartActions';

interface ProductCardProps {
  variant: VariantCardResponse;
}

export function ProductCard({ variant }: ProductCardProps) {
  const { addItem } = useCartActions();

  return (
    <div className="product-card">
      <ProductPhoto image={variant.images?.[0]} alt={variant.name} size="card" />
      <div className="product-card__body">
        {/* Ссылка обёрнута в заголовок, а не в карточку целиком: кнопка корзины
            не может лежать внутри ссылки. Кликабельность всей карточки даёт
            растянутый ::after у product-card__link. */}
        <h3 className="product-card__title">
          <Link href={`/product/${variant.variantSlug}`} className="product-card__link">
            {variant.name}
          </Link>
        </h3>
        {!variant.inStock && <span className="product-card__oos">Нет в наличии</span>}
        <div className="product-card__footer">
          <Price value={variant.price} oldValue={variant.oldPrice} size="md" stacked />
          <Button
            size="sm"
            className="product-card__cart"
            aria-label="В корзину"
            title="В корзину"
            disabled={!variant.inStock}
            onClick={() =>
              addItem({
                variantId: variant.variantId,
                variantSlug: variant.variantSlug,
                productName: variant.name,
                price: variant.price,
                attributes: variant.attributes,
                image: variant.images?.[0] ?? null,
              })
            }
          >
            <CartIcon width={18} height={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
