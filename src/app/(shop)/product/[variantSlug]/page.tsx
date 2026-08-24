import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getCategories, getProductBySlug } from '@/api/catalog';
import { ApiError } from '@/api/client';
import { createServerQueryClient } from '@/app/query-client';
import { buildBreadcrumbJsonLd, buildProductCrumbs, buildProductJsonLd } from '@/utils/productJsonLd';
import { resolveProductMeta } from '@/utils/seo';
import { SITE_NAME } from '@/config/siteInfo';
import { ProductPage } from '@/views/ProductPage';
import type { VariantDetailResponse } from '@/api/types';

export const revalidate = 600;

/**
 * Пустой список — намеренно. Без generateStaticParams вообще Next считает
 * динамический сегмент полностью динамическим и игнорирует revalidate (проверено
 * по заголовку x-nextjs-cache: страница отдавалась с no-store). Пустой массив
 * включает ISR-режим: на билде не пререндерится ничего, каждая карточка
 * генерируется при первом обращении и дальше отдаётся из кэша.
 *
 * Не перечисляем товары специально: иначе Spring должен быть доступен на этапе
 * сборки, что позже сломает CI.
 */
export function generateStaticParams() {
  return [];
}

/**
 * Кэш ISR отдаёт краулеру готовый HTML, а живому пользователю useProductDetail
 * при монтировании обновляет цену и остаток — см. раздел «Свежесть цены» в плане
 * миграции. В заказ цена не передаётся вовсе (её проставляет OrderService),
 * поэтому устаревшее значение здесь не может обернуться неверной суммой.
 */
async function loadVariant(variantSlug: string): Promise<VariantDetailResponse | null> {
  try {
    return await getProductBySlug(variantSlug, { revalidate });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ variantSlug: string }>;
}): Promise<Metadata> {
  const { variantSlug } = await params;
  const variant = await loadVariant(variantSlug);
  if (!variant) return { title: 'Товар не найден' };

  const { title, description } = resolveProductMeta(variant);
  const path = `/product/${variant.variantSlug}`;
  const image = variant.images?.[0]?.zoom;

  return {
    title,
    description,
    // Варианты одного товара считаем самостоятельными страницами: у них разные
    // SKU, цены и характеристики, поэтому каждый канонизируется сам на себя.
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: 'ru_BY',
      // 'product' типизированный API Next не принимает, а для мессенджеров
      // достаточно title/description/image.
      type: 'website',
      ...(image ? { images: [image] } : {}),
    },
    twitter: { card: 'summary_large_image', title, description, ...(image ? { images: [image] } : {}) },
  };
}

export default async function Page({ params }: { params: Promise<{ variantSlug: string }> }) {
  const { variantSlug } = await params;

  // notFound() до любого <Suspense>: как только начался стриминг, статус уже
  // отправлен как 200 и заменить его на 404 нельзя.
  const variant = await loadVariant(variantSlug);
  if (!variant) notFound();

  const queryClient = createServerQueryClient();
  // Ключ обязан совпадать с useProductDetail, иначе клиент сходит за данными
  // заново, а в HTML уедет пустая страница вместо товара.
  queryClient.setQueryData(['product-detail', variantSlug], variant);
  // Категории нужны хлебным крошкам — и разметке, и самой странице.
  const categories = await queryClient.fetchQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories({ revalidate }),
  });

  const { description } = resolveProductMeta(variant);
  const jsonLd = [
    buildProductJsonLd(variant, description),
    buildBreadcrumbJsonLd(buildProductCrumbs(variant, categories)),
  ];

  return (
    <>
      {jsonLd.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ProductPage />
      </HydrationBoundary>
    </>
  );
}
