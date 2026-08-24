'use client';

import Link from 'next/link';
import './ProductCard.css';
import { ProductPhoto } from '@/components/ui/ProductPhoto';
import { Price } from '@/components/ui/Price';
import { CartToggleButton } from '@/components/cart/CartToggleButton';
import type { VariantCardResponse } from '@/api/types';

interface ProductCardProps {
  variant: VariantCardResponse;
}

export function ProductCard({ variant }: ProductCardProps) {
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
          <CartToggleButton variant={variant} className="product-card__cart" />
        </div>
      </div>
    </div>
  );
}
