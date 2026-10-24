'use client';

import './ProductMobileDetails.css';
import { useState } from 'react';
import { Price } from '@/components/ui/Price';
import { DeliveryInfoMobile } from '@/components/info/DeliveryInfoMobile';
import { PaymentInfoMobile } from '@/components/info/PaymentInfoMobile';
import { ProductAboutSheet } from './ProductAboutSheet';
import { SkuCopy } from './SkuCopy';
import { StockBadge } from './StockBadge';
import { VariantOptions } from './VariantOptions';
import { buildSpecRows, splitDescription } from './productSpecs';
import type { ProductCartState } from './useProductCart';
import type { VariantDetailResponse } from '@/api/types';

interface ProductMobileDetailsProps {
  variant: VariantDetailResponse;
  cart: ProductCartState;
}

/**
 * Телефонная замена блока покупки, характеристик и доставки с оплатой. Это отдельная
 * раскладка, а не адаптив десктопа; переключение между ними — media query в CSS, чтобы
 * сервер отдавал обе и страница не прыгала при гидрации. Покупает нижний бар StickyBuyBar.
 */
export function ProductMobileDetails({ variant, cart }: ProductMobileDetailsProps) {
  const [aboutOpen, setAboutOpen] = useState(false);
  const rows = buildSpecRows(variant);
  const paragraphs = splitDescription(variant.description);
  // Без характеристик карточка показывает начало описания — шторка всё равно откроет его целиком.
  const summary = rows.map((row) => row.summary).filter(Boolean).join(' · ') || paragraphs[0];

  return (
    <div className="product-mobile">
      <div className="product-mobile__summary">
        <div className="product-mobile__meta">
          <StockBadge stock={variant.stockQuantity} />
          <SkuCopy sku={variant.sku} tooltipAlign="end" />
        </div>
        <h1 className="product-mobile__title">{variant.name}</h1>
        <Price value={variant.price} oldValue={variant.oldPrice} size="lg" className="product-mobile__price" />
      </div>

      <VariantOptions groups={variant.variantOptions} metadata={variant.attributeMetadata} />

      {summary && (
        <button
          type="button"
          className="product-mobile__about"
          aria-label="О товаре: характеристики и описание"
          aria-haspopup="dialog"
          onClick={() => setAboutOpen(true)}
        >
          <span className="product-mobile__about-text">{summary}</span>
          <span className="product-mobile__about-more">о товаре</span>
        </button>
      )}

      <DeliveryInfoMobile orderTotal={variant.price * cart.quantity} />
      <PaymentInfoMobile />

      {aboutOpen && <ProductAboutSheet rows={rows} paragraphs={paragraphs} onClose={() => setAboutOpen(false)} />}
    </div>
  );
}
