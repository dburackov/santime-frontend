import type { ReactNode } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

/** Бывший StorefrontLayout из App.tsx: <Outlet/> заменён на children. */
export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-shell__main">{children}</main>
      <Footer />
    </div>
  );
}
