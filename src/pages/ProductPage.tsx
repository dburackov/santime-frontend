import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
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

export function ProductPage() {
  const { variantSlug } = useParams<{ variantSlug: string }>();
  const { data: variant, isLoading, isError, refetch } = useProductDetail(variantSlug);
  const { data: categories } = useCategories();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const category = useMemo(
    () => categories?.find((c) => c.id === variant?.categoryId),
    [categories, variant],
  );

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
        productName: variant.productName,
        price: variant.price,
        attributes: variant.attributes,
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
          { label: variant.productName },
        ]}
      />

      <div className="product-page__layout">
        <ProductPhoto alt={variant.productName} size="detail" />

        <div className="product-page__info">
          <h1 className="product-page__title">{variant.productName}</h1>
          <div className="product-page__sku mono-num">SKU: {variant.sku}</div>

          {variant.description && <p className="product-page__description">{variant.description}</p>}

          <VariantOptions groups={variant.variantOptions} />

          <div className="product-page__purchase">
            <Price value={variant.price} size="lg" />

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
