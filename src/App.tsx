import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HomePage } from '@/pages/HomePage';
import { CategoryPage } from '@/pages/CategoryPage';
import { ProductPage } from '@/pages/ProductPage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { OrderConfirmationPage } from '@/pages/OrderConfirmationPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { AdminLayout } from '@/admin/AdminLayout';
import { CategoriesPage } from '@/admin/pages/CategoriesPage';
import { CategoryAttributesPage } from '@/admin/pages/CategoryAttributesPage';
import { BrandsPage } from '@/admin/pages/BrandsPage';
import { AttributesPage } from '@/admin/pages/AttributesPage';
import { AttributeOptionsPage } from '@/admin/pages/AttributeOptionsPage';
import { ProductsPage } from '@/admin/pages/ProductsPage';
import { ProductVariantsPage } from '@/admin/pages/ProductVariantsPage';
import { OrdersPage } from '@/admin/pages/OrdersPage';
import { OrderDetailPage } from '@/admin/pages/OrderDetailPage';

function StorefrontLayout() {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-shell__main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="categories" replace />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="categories/:categoryId/attributes" element={<CategoryAttributesPage />} />
        <Route path="brands" element={<BrandsPage />} />
        <Route path="attributes" element={<AttributesPage />} />
        <Route path="attributes/:attributeId/options" element={<AttributeOptionsPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:productId/variants" element={<ProductVariantsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:orderId" element={<OrderDetailPage />} />
      </Route>

      <Route element={<StorefrontLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/product/:variantSlug" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
