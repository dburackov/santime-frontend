import type { ReactNode } from 'react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ScrollTopButton } from '@/components/ui/ScrollTopButton';
import { CartAddedDialog } from '@/components/cart/CartAddedDialog';
import { CookieNotice } from '@/components/ui/CookieNotice';
import { createServerQueryClient } from '@/app/query-client';
import { getCategories } from '@/api/catalog';

/** Совпадает с revalidate страниц витрины: фетч должен попасть в кэш данных Next, иначе роут станет динамическим. */
const CATEGORIES_REVALIDATE = 3600;

/** Бывший StorefrontLayout из App.tsx: <Outlet/> заменён на children. */
export default async function ShopLayout({ children }: { children: ReactNode }) {
  // Категории нужны выпадающему меню в шапке на любой странице витрины, а не только
  // в каталоге. prefetchQuery не бросает: если API недоступен, меню догрузится на клиенте.
  const queryClient = createServerQueryClient();
  await queryClient.prefetchQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories({ revalidate: CATEGORIES_REVALIDATE }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="app-shell">
        <Header />
        <main className="app-shell__main">{children}</main>
        <Footer />
        <ScrollTopButton />
        <CartAddedDialog />
        <CookieNotice />
      </div>
    </HydrationBoundary>
  );
}
