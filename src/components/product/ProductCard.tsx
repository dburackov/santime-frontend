'use client';

import Link from 'next/link';
import './ProductCard.css';
import { ProductPhotoSlider } from '@/components/ui/ProductPhotoSlider';
import { Price } from '@/components/ui/Price';
import { CartToggleButton } from '@/components/cart/CartToggleButton';
import type { VariantCardResponse } from '@/api/types';

interface ProductCardProps {
  variant: VariantCardResponse;
}

export function ProductCard({ variant }: ProductCardProps) {
  return (
    <div className="product-card">
      {/* Своя ссылка у фото, а не растянутый ::after: зоны наведения слайдера обязаны лежать
          выше него, иначе указатель достаётся псевдоэлементу и mouseenter до зон не доходит.
          Клик по зоне всплывает до этой ссылки, так что фото по-прежнему ведёт в товар.
          tabIndex/aria-hidden — чтобы у карточки не появилось второй остановки табуляции. */}
      <Link
        href={`/product/${variant.variantSlug}`}
        className="product-card__photo"
        tabIndex={-1}
        aria-hidden="true"
      >
        <ProductPhotoSlider images={variant.images} alt={variant.name} size="card" />
      </Link>
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
