'use client';

import { useMemo, useState } from 'react';
import { useRouteParams } from '@/hooks/useRouteParams';
import './ProductPage.css';
import '@/components/ui/Skeleton.css';
import { useProductDetail } from '@/queries/useProductDetail';
import { useCategories } from '@/queries/useCategories';
import { useCart } from '@/cart/useCart';
import { ProductPhoto } from '@/components/ui/ProductPhoto';
import { Price } from '@/components/ui/Price';
import { Button } from '@/components/ui/Button';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ErrorState } from '@/components/ui/ErrorState';
import { VariantOptions } from '@/components/product/VariantOptions';
import { AttributesTable } from '@/components/product/AttributesTable';
import { ProductLightbox } from '@/components/product/ProductLightbox';
import type { ProductImageResponse } from '@/api/types';

interface ProductGalleryProps {
  images: ProductImageResponse[];
  productName: string;
}

/** key={variant.variantId} на месте использования сбрасывает activeIndex при смене
 * варианта (другой цвет — свой набор фото) через ремонт компонента, без лишнего эффекта.
 * Он же закрывает открытый лайтбокс: тот размонтируется вместе с галереей. */
function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const activeImage = images[activeIndex] ?? images[0];
  const hasImages = images.length > 0;

  const photo = <ProductPhoto image={activeImage} alt={productName} size="detail" priority />;

  return (
    <div className="product-page__gallery">
      {/* Кнопка-обёртка, а не onClick на ProductPhoto: у него шесть мест использования,
          клик нужен одному. Без фото кнопки нет — открывать нечего. */}
      {hasImages ? (
        <button
          type="button"
          className="product-page__zoom"
          onClick={() => setLightboxOpen(true)}
          aria-label="Открыть фото на весь экран"
        >
          {photo}
        </button>
      ) : (
        photo
      )}

      {images.length > 1 && (
        <div className="product-page__thumbs" role="tablist" aria-label="Фото товара">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Фото ${index + 1}`}
              className={`product-page__thumb${index === activeIndex ? ' product-page__thumb--active' : ''}`}
              onClick={() => setActiveIndex(index)}
            >
              <ProductPhoto image={image} alt={productName} size="thumb" />
            </button>
          ))}
        </div>
      )}

      {/* position: fixed — вне потока, gap галереи его не задевает. */}
      {lightboxOpen && hasImages && (
        <ProductLightbox
          images={images}
          index={activeIndex}
          productName={productName}
          onIndexChange={setActiveIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}

export function ProductPage() {
  const { variantSlug } = useRouteParams<{ variantSlug: string }>();
  const { data: variant, isLoading, isError, refetch } = useProductDetail(variantSlug);
  const { data: categories } = useCategories();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const category = useMemo(
    () => categories?.find((c) => c.id === variant?.categoryId),
    [categories, variant],
  );

  const images = variant?.images ?? [];

  // JSON-LD раньше собиралась здесь в useEffect и дописывалась в document.head —
  // то есть была невидима для краулера, не исполняющего JS. Теперь её рендерит
  // серверный компонент страницы (app/(shop)/product/[variantSlug]/page.tsx),
  // см. buildProductJsonLd в @/utils/productJsonLd.

  if (isError) {
    return (
      <div className="container" style={{ padding: 'var(--space-16) 0' }}>
        <ErrorState description="Не удалось загрузить товар." onRetry={refetch} />
      </div>
    );
  }

  if (isLoading || !variant) {
    return (
      <div className="container product-page">
        <div className="product-page__layout">
          <div className="skeleton-block" style={{ height: 320, borderRadius: 'var(--radius)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div className="skeleton-block" style={{ height: 28, width: '70%' }} />
            <div className="skeleton-block" style={{ height: 20, width: '40%' }} />
            <div className="skeleton-block" style={{ height: 44, width: '100%' }} />
          </div>
        </div>
      </div>
    );
  }

  function handleAddToCart() {
    if (!variant) return;
    addItem(
      {
        variantId: variant.variantId,
        variantSlug: variant.variantSlug,
        productName: variant.name,
        price: variant.price,
        attributes: variant.attributes,
        image: variant.images?.[0] ?? null,
      },
      quantity,
    );
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 2000);
  }

  return (
    <div className="container product-page">
      <Breadcrumbs
        items={[
          { label: 'Каталог', to: '/catalog' },
          ...(category ? [{ label: category.name, to: `/category/${category.slug}` }] : []),
          { label: variant.name },
        ]}
      />

      <div className="product-page__layout">
        <ProductGallery key={variant.variantId} images={images} productName={variant.name} />

        <div className="product-page__info">
          <h1 className="product-page__title">{variant.name}</h1>
          <div className="product-page__sku mono-num">Артикул: {variant.sku}</div>

          {variant.description && <p className="product-page__description">{variant.description}</p>}

          <VariantOptions groups={variant.variantOptions} />

          <div className="product-page__purchase">
            <Price value={variant.price} oldValue={variant.oldPrice} size="lg" />

            {variant.stockQuantity > 0 ? (
              <span className="product-page__stock product-page__stock--in">
                В наличии{variant.stockQuantity <= 5 ? ` — осталось ${variant.stockQuantity}` : ''}
              </span>
            ) : (
              <span className="product-page__stock product-page__stock--out">Нет в наличии</span>
            )}

            <div className="product-page__cart-row">
              <div className="product-page__qty" role="group" aria-label="Количество">
                <button
                  type="button"
                  className="product-page__qty-btn touch-target"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Уменьшить количество"
                >
                  −
                </button>
                <span className="product-page__qty-value mono-num">{quantity}</span>
                <button
                  type="button"
                  className="product-page__qty-btn touch-target"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Увеличить количество"
                >
                  +
                </button>
              </div>

              <Button disabled={variant.stockQuantity === 0} onClick={handleAddToCart}>
                {justAdded ? 'Добавлено' : 'В корзину'}
              </Button>
            </div>
          </div>

          {variant.weightKg && (
            <div className="product-page__weight mono-num">Вес: {variant.weightKg} кг</div>
          )}

          <AttributesTable metadata={variant.attributeMetadata} attributes={variant.attributes} />
        </div>
      </div>
    </div>
  );
}
