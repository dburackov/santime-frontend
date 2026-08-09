'use client';

import Link from 'next/link';
import './HomePage.css';
import '@/components/ui/Skeleton.css';
import { useCategories } from '@/queries/useCategories';
import { useCatalogProducts } from '@/queries/useCatalogProducts';
import { ErrorState } from '@/components/ui/ErrorState';
import { ProductCard } from '@/components/product/ProductCard';
import { CategoryTile, CategoryTileSkeleton } from '@/components/catalog/CategoryTile';
import { SkeletonCard } from '@/components/ui/Skeleton';
import {
  ArrowRightIcon,
  BoxIcon,
  CardIcon,
  HeadsetIcon,
  ShieldIcon,
  TruckIcon,
} from '@/components/ui/icons';

const TRUST_ITEMS = [
  { icon: TruckIcon, title: 'Быстрая доставка', description: 'По Минску и всей Беларуси', to: '/dostavka' },
  { icon: ShieldIcon, title: 'Гарантия', description: 'На все товары каталога' },
  { icon: CardIcon, title: 'Удобная оплата', description: 'Наличными, картой или на р/с', to: '/oplata' },
  { icon: HeadsetIcon, title: 'Поддержка', description: 'Проконсультируем перед покупкой' },
];

/** Слоты коллажа в hero. Пока фотографий нет — рисуется тот же плейсхолдер, что и в ProductPhoto. */
const HERO_SLOTS = [
  { modifier: 'main', label: 'Интерьерная сцена: современная ванная' },
  { modifier: 'detail', label: 'Макро-деталь: фактура металла' },
  { modifier: 'detail', label: 'Раковина крупным планом' },
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
        <span className="hero__shine" aria-hidden="true" />

        <div className="container hero__content">
          <div className="hero__intro">
            <span className="hero__eyebrow">
              <span className="hero__eyebrow-dot" aria-hidden="true" />
              Сантехника для дома · Минск
            </span>

            <h1 className="hero__title">
              Сантехника, которой можно <span className="hero__title-accent">доверять</span>
            </h1>

            <p className="hero__subtitle">
              с гарантией, доставкой по Минску и всей Беларуси.
            </p>

            <Link href="/catalog" className="btn btn--gold btn--md hero__cta">
              Смотреть каталог
              <ArrowRightIcon width={16} height={16} />
            </Link>
          </div>

          <div className="hero__media">
            <div className="hero__panel">
              {HERO_SLOTS.map((slot, i) => (
                <div key={i} className={`hero__photo-slot hero__photo-slot--${slot.modifier}`}>
                  <BoxIcon className="hero__photo-placeholder" aria-label={slot.label} />
                </div>
              ))}
            </div>

            <div className="hero__badge">
              <span className="hero__badge-icon">
                <ShieldIcon width={18} height={18} />
              </span>
              <span className="hero__badge-text">
                <span className="hero__badge-title">Гарантия на каждый товар</span>
                <span className="hero__badge-note">из каталога</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="container home-categories" id="categories">
        <div className="home-section-head">
          <h2 className="home-section-head__title">
            <span className="home-section-head__bar" aria-hidden="true" />
            Категории
          </h2>
          <Link href="/catalog" className="home-section-head__link">
            Весь каталог
            <ArrowRightIcon width={14} height={14} />
          </Link>
        </div>

        {isError && <ErrorState description="Не удалось загрузить категории." onRetry={refetch} />}

        {isLoading && (
          <div className="home-categories__grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <CategoryTileSkeleton key={i} />
            ))}
          </div>
        )}

        {categories && (
          <div className="home-categories__grid">
            {categories.map((category) => (
              <CategoryTile key={category.id} category={category} />
            ))}
          </div>
        )}
      </section>

      <section className="home-section">
        <div className="container home-section__inner">
          <div className="home-section-head">
            <h2 className="home-section-head__title">
              <span className="home-section-head__bar home-section-head__bar--accent" aria-hidden="true" />
              Хиты продаж
            </h2>
            <Link href="/catalog" className="home-section-head__link">
              Все товары
              <ArrowRightIcon width={14} height={14} />
            </Link>
          </div>

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
        </div>
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
              <Link key={item.title} href={item.to} className="home-trust__item home-trust__item--link">
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
