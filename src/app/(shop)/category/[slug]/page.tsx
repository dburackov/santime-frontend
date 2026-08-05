import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getCategories, getCategoryBrands, getCategoryFilters, getProducts } from '@/api/catalog';
import { buildCatalogQuery } from '@/hooks/catalogQuery';
import { buildBreadcrumbJsonLd } from '@/utils/productJsonLd';
import { resolveCategoryMeta } from '@/utils/seo';
import { SITE_NAME } from '@/config/siteInfo';
import { createServerQueryClient } from '@/app/query-client';
import { VIEW_MODE_COOKIE, parseViewMode } from '@/hooks/viewMode';
import { CategoryPage } from '@/views/CategoryPage';
import type { CategoryResponse } from '@/api/types';

/**
 * Единственная страница витрины, которая рендерится динамически, а не через ISR.
 *
 * Причина принципиальная: весь её контент — функция query-string, а
 * `useSearchParams` в клиентском компоненте под статическим рендером уводит
 * поддерево в CSR-фолбэк (ошибка missing-suspense-with-csr-bailout). То есть при
 * ISR список товаров физически не попал бы в HTML — ровно то, ради чего
 * затевался переезд. Динамика отдаёт краулеру готовую разметку и заодно делает
 * серверными даже отфильтрованные URL.
 *
 * Нагрузка на Spring при этом не выше нынешней: SPA и так делает этот запрос на
 * каждое открытие категории.
 */
export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

async function findCategory(slug: string): Promise<CategoryResponse | undefined> {
  // Эндпоинта «категория по слагу» у бэкенда нет, а полный список категорий всё
  // равно нужен для хлебных крошек — так что отдельный запрос ничего не сэкономил бы.
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug);
}

/** searchParams приходят как объект, а разбор фильтров работает с URLSearchParams. */
function toURLSearchParams(input: SearchParams): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
    else if (value !== undefined) params.set(key, value);
  }
  return params;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await findCategory(slug);
  if (!category) return { title: 'Категория не найдена' };

  const { title, description } = resolveCategoryMeta(category);
  const path = `/category/${category.slug}`;

  // Комбинаций фильтров бесконечно много, а контент у них почти одинаковый.
  // Пагинация — исключение: это разные товары, её оставляем индексируемой
  // (то же исключение продублировано в app/robots.ts).
  const hasFilters = Object.keys(await searchParams).some((key) => key !== 'page');

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: SITE_NAME, locale: 'ru_BY', type: 'website' },
    ...(hasFilters ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;

  const category = await findCategory(slug);
  if (!category) notFound();

  const queryClient = createServerQueryClient();

  // Фильтры категории нужны прямо здесь: без них не разобрать атрибутные
  // параметры из URL, а значит не собрать тот же объект запроса, что построит
  // клиент. Заодно они и бренды уезжают в кэш — CategoryPage получит их
  // из гидрации, без второго похода в сеть.
  const [filters] = await Promise.all([
    queryClient.fetchQuery({
      queryKey: ['category-filters', category.id],
      queryFn: () => getCategoryFilters(category.id),
    }),
    queryClient.prefetchQuery({
      queryKey: ['categories'],
      queryFn: () => getCategories(),
    }),
    queryClient.prefetchQuery({
      queryKey: ['brands', category.id],
      queryFn: () => getCategoryBrands(category.id),
    }),
  ]);

  const query = buildCatalogQuery(category.id, toURLSearchParams(await searchParams), filters);

  // Режим отображения нужен уже здесь: сетка и список — разные компоненты, и
  // без него сервер отдал бы сетку, а клиент перерисовал бы её в список после
  // гидрации. Динамике страницы чтение куки ничего не стоит — она и так
  // force-dynamic.
  const viewMode = parseViewMode((await cookies()).get(VIEW_MODE_COOKIE)?.value);

  await queryClient.prefetchQuery({
    queryKey: ['catalog-products', query],
    queryFn: () => getProducts(query),
  });

  const crumbs = buildBreadcrumbJsonLd([
    { name: 'Главная', path: '/' },
    { name: 'Каталог', path: '/catalog' },
    { name: category.name, path: `/category/${category.slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <CategoryPage initialViewMode={viewMode} />
      </HydrationBoundary>
    </>
  );
}
