'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouteParams } from '@/hooks/useRouteParams';
import './ProductPage.css';
import { useProductDetail } from '@/queries/useProductDetail';
import { useCategories } from '@/queries/useCategories';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ErrorState } from '@/components/ui/ErrorState';
import { ArrowLeftIcon } from '@/components/ui/icons';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductBuyBox } from '@/components/product/ProductBuyBox';
import { ProductCharacteristics } from '@/components/product/ProductCharacteristics';
import { ProductMobileDetails } from '@/components/product/ProductMobileDetails';
import { StickyBuyBar } from '@/components/product/StickyBuyBar';
import { SimilarProducts } from '@/components/product/SimilarProducts';
import { useProductCart } from '@/components/product/useProductCart';
import { DeliveryInfoCompact } from '@/components/info/DeliveryInfoCompact';
import { PaymentInfoCompact } from '@/components/info/PaymentInfoCompact';
import { InfoContactStrip } from '@/components/info/InfoContactStrip';
import { buildCategoryPath } from '@/utils/categoryTree';
import { SITE_EMAIL, SITE_PHONES } from '@/config/siteInfo';
import type { VariantDetailResponse } from '@/api/types';

const SECTION_IDS = { characteristics: 'characteristics', delivery: 'delivery-and-payment' } as const;

function jumpTo(section: keyof typeof SECTION_IDS) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document
    .getElementById(SECTION_IDS[section])
    ?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
}

export function ProductPage() {
  const { variantSlug } = useRouteParams<{ variantSlug: string }>();
  const { data: variant, isLoading, isError, refetch } = useProductDetail(variantSlug);

  // JSON-LD рендерит серверный компонент страницы (app/(shop)/product/[variantSlug]/page.tsx),
  // см. buildProductJsonLd в @/utils/productJsonLd.

  if (isError) {
    return (
      <div className="container" style={{ padding: 'var(--space-16) 0' }}>
        <ErrorState description="Не удалось загрузить товар." onRetry={refetch} />
      </div>
    );
  }

  if (isLoading || !variant) return null;

  // key сбрасывает черновик количества, кадр галереи и лайтбокс при переходе на соседнее исполнение.
  return <ProductView key={variant.variantId} variant={variant} />;
}

function ProductView({ variant }: { variant: VariantDetailResponse }) {
  const { data: categories } = useCategories();
  const cart = useProductCart(variant);

  const categoryPath = useMemo(
    () => (categories ? buildCategoryPath(categories, variant.categoryId) : []),
    [categories, variant.categoryId],
  );
  const category = categoryPath.at(-1);

  // Бар — снаружи .product-page: у неё анимация появления (.page-in) с transform, а под transform
  // position: fixed считается от родителя, и бар на время анимации уезжал под низ страницы.
  return (
    <>
      <div className="product-page page-in">
        <div className="container product-page__crumbs">
          <Breadcrumbs
            items={[
              { label: 'Каталог', to: '/catalog' },
              ...categoryPath.map((item) => ({ label: item.name, to: `/category/${item.slug}` })),
              { label: variant.name },
            ]}
          />
        </div>

        <section className="container product-page__main">
          <Link
            href={category ? `/category/${category.slug}` : '/catalog'}
            className="product-page__back"
            aria-label={`Назад: ${category?.name ?? 'Каталог'}`}
          >
            <ArrowLeftIcon width={20} height={20} />
            <span className="product-page__back-label">{category?.name ?? 'Каталог'}</span>
          </Link>

          <ProductGallery images={variant.images ?? []} productName={variant.name} />
          <ProductBuyBox variant={variant} cart={cart} onJump={jumpTo} />
          <ProductMobileDetails variant={variant} cart={cart} />
        </section>

        <ProductCharacteristics id={SECTION_IDS.characteristics} variant={variant} />

        <section id={SECTION_IDS.delivery} className="container product-page__shipping">
          <h2 className="product-section-title product-section-title--gold product-page__shipping-title">Доставка и оплата</h2>
          <div className="product-page__shipping-grid">
            <DeliveryInfoCompact orderTotal={cart.total} />
            <PaymentInfoCompact />
          </div>
        </section>

        <SimilarProducts variantSlug={variant.variantSlug} category={category} />

        <InfoContactStrip
          tone="promo"
          title="Не уверены, что Вам подойдёт?"
          text="Подскажем по размерам, установке и комплектации."
          action={{ label: SITE_PHONES[0].display, href: SITE_PHONES[0].href }}
          link={{ label: SITE_EMAIL.display, href: SITE_EMAIL.href }}
        />
      </div>

      <StickyBuyBar cart={cart} />
    </>
  );
}
