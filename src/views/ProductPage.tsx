'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRouteParams } from '@/hooks/useRouteParams';
import './ProductPage.css';
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
import { buildCategoryPath } from '@/utils/categoryTree';
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
  const { items, addItem } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);

  const categoryPath = useMemo(
    () => (categories && variant ? buildCategoryPath(categories, variant.categoryId) : []),
    [categories, variant],
  );

  const descriptionParagraphs = useMemo(
    () =>
      (variant?.description ?? '')
        .split(/\r?\n\s*\r?\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean),
    [variant],
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

  if (isLoading || !variant) return null;

  /**
   * Состояние кнопки выводится из самой корзины, а не из факта клика: так она
   * остаётся верной и после перезагрузки страницы, и при переключении на соседнее
   * исполнение, и после удаления товара из корзины.
   */
  const inCart = items.some((i) => i.variantId === variant.variantId);

  function handleBuy() {
    if (!variant) return;
    if (inCart) {
      router.push('/cart');
      return;
    }
    // Диалога здесь нет — отклик даёт сама кнопка, шапке остаётся пульс.
    addItem(
      {
        variantId: variant.variantId,
        variantSlug: variant.variantSlug,
        productName: variant.name,
        price: variant.price,
        attributes: variant.attributes,
        image: variant.images?.[0] ?? null,
      },
      Math.min(quantity, variant.stockQuantity),
      { silent: true },
    );
  }

  return (
    <div className="container product-page">
      <Breadcrumbs
        items={[
          { label: 'Каталог', to: '/catalog' },
          ...categoryPath.map((item) => ({ label: item.name, to: `/category/${item.slug}` })),
          { label: variant.name },
        ]}
      />

      <div className="product-page__layout">
        <ProductGallery key={variant.variantId} images={images} productName={variant.name} />

        <div className="product-page__info">
          <h1 className="product-page__title">{variant.name}</h1>
          <div className="product-page__sku mono-num">Артикул: {variant.sku}</div>

          <VariantOptions groups={variant.variantOptions} metadata={variant.attributeMetadata} />

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
              <div
                className={`product-page__qty ${inCart ? 'product-page__qty--disabled' : ''}`}
                role="group"
                aria-label="Количество"
              >
                <button
                  type="button"
                  className="product-page__qty-btn touch-target"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={inCart}
                  aria-label="Уменьшить количество"
                >
                  −
                </button>
                <span className="product-page__qty-value mono-num">{quantity}</span>
                <button
                  type="button"
                  className="product-page__qty-btn touch-target"
                  onClick={() => setQuantity((q) => Math.min(variant.stockQuantity, q + 1))}
                  disabled={inCart || quantity >= variant.stockQuantity}
                  aria-label="Увеличить количество"
                >
                  +
                </button>
              </div>

              <Button
                disabled={variant.stockQuantity === 0}
                className={inCart ? 'product-page__buy--in-cart' : ''}
                onClick={handleBuy}
              >
                {inCart ? 'В корзине' : 'Купить'}
              </Button>
            </div>
          </div>

          {variant.weightKg && (
            <div className="product-page__weight mono-num">Вес: {variant.weightKg} кг</div>
          )}

          <AttributesTable metadata={variant.attributeMetadata} attributes={variant.attributes} />

          {descriptionParagraphs.length > 0 && (
            <div className="product-page__description">
              {descriptionParagraphs.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
