import { Link } from 'react-router-dom';
import './HomePage.css';
import '@/components/ui/Skeleton.css';
import { useCategories } from '@/queries/useCategories';
import { useCatalogProducts } from '@/queries/useCatalogProducts';
import { ErrorState } from '@/components/ui/ErrorState';
import { ProductCard } from '@/components/product/ProductCard';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { CardIcon, HeadsetIcon, ShieldIcon, TruckIcon } from '@/components/ui/icons';

const TRUST_ITEMS = [
  { icon: TruckIcon, title: 'Быстрая доставка', description: 'По Минску и всей Беларуси', to: '/dostavka' },
  { icon: ShieldIcon, title: 'Гарантия', description: 'На все товары каталога' },
  { icon: CardIcon, title: 'Удобная оплата', description: 'Наличными, картой или на р/с', to: '/oplata' },
  { icon: HeadsetIcon, title: 'Поддержка', description: 'Проконсультируем перед покупкой' },
];

export function HomePage() {
  const { data: categories, isLoading, isError, refetch } = useCategories();
  const {
    data: hitsPage,
    isLoading: hitsLoading,
    isError: hitsError,
  } = useCatalogProducts({ sort: 'NAME_ASC', size: 8 });

  return (
    <div>
      <section className="hero">
        <div className="container hero__content">
          <h1 className="hero__title">Сантехника, которой можно доверять</h1>
          <p className="hero__subtitle">
            Каталог с точными характеристиками и понятными фильтрами, доставка по Минску и области, гарантия на
            каждый товар.
          </p>
          <Link to="/catalog" className="btn btn--primary btn--md hero__cta">
            Смотреть каталог
          </Link>
        </div>
      </section>

      <section className="container home-categories" id="categories">
        <h2 className="home-categories__title">Категории</h2>

        {isError && <ErrorState description="Не удалось загрузить категории." onRetry={refetch} />}

        {isLoading && (
          <div className="home-categories__grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton-block home-category-tile home-category-tile--skeleton" />
            ))}
          </div>
        )}

        {categories && (
          <div className="home-categories__grid">
            {categories.map((category) => (
              <Link key={category.id} to={`/category/${category.slug}`} className="home-category-tile">
                <span className="home-category-tile__name">{category.name}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="container home-section">
        <h2 className="home-section__title">Хиты продаж</h2>

        {hitsError && <ErrorState description="Не удалось загрузить товары." />}

        {hitsLoading && !hitsPage && (
          <div className="home-section__grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {hitsPage && hitsPage.content.length > 0 && (
          <div className="home-section__grid">
            {hitsPage.content.map((variant) => (
              <ProductCard key={variant.variantId} variant={variant} />
            ))}
          </div>
        )}
      </section>

      <section className="home-trust">
        <div className="container home-trust__grid">
          {TRUST_ITEMS.map((item) => {
            const Icon = item.icon;
            const content = (
              <>
                <span className="home-trust__icon">
                  <Icon width={22} height={22} />
                </span>
                <span className="home-trust__title">{item.title}</span>
                <span className="home-trust__description">{item.description}</span>
              </>
            );
            return item.to ? (
              <Link key={item.title} to={item.to} className="home-trust__item home-trust__item--link">
                {content}
              </Link>
            ) : (
              <div key={item.title} className="home-trust__item">
                {content}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
