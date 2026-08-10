'use client';

import Link from 'next/link';
import './HomePage.css';
import '@/components/ui/Skeleton.css';
import { useCategories } from '@/queries/useCategories';
import { useCatalogProducts } from '@/queries/useCatalogProducts';
import { useBestsellers } from '@/queries/useBestsellers';
import { DISCOUNTS_QUERY } from '@/queries/discountsQuery';
import { ErrorState } from '@/components/ui/ErrorState';
import { ProductCard } from '@/components/product/ProductCard';
import { CategoryTile, CategoryTileSkeleton } from '@/components/catalog/CategoryTile';
import { HeroKits } from '@/components/home/HeroKits';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ArrowRightIcon, CardIcon, HeadsetIcon, ShieldIcon, TruckIcon } from '@/components/ui/icons';

const TRUST_ITEMS = [
  { icon: TruckIcon, title: 'Быстрая доставка', description: 'По Минску и всей Беларуси', to: '/dostavka' },
  { icon: ShieldIcon, title: 'Гарантия', description: 'На все товары каталога' },
  { icon: CardIcon, title: 'Удобная оплата', description: 'Наличными, картой или на р/с', to: '/oplata' },
  { icon: HeadsetIcon, title: 'Поддержка', description: 'Проконсультируем перед покупкой' },
];

export function HomePage() {
  const { data: categories, isLoading, isError, refetch } = useCategories();
  const { data: discountsPage, isLoading: discountsLoading } = useCatalogProducts(DISCOUNTS_QUERY);
  const { data: hits, isLoading: hitsLoading } = useBestsellers();

  const discounts = discountsPage?.content ?? [];

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
            <HeroKits />
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

      {(discountsLoading || discounts.length > 0) && (
        <section className="home-section home-section--tinted">
          <div className="container home-section__inner">
            <div className="home-section-head">
              <h2 className="home-section-head__title">
                <span className="home-section-head__bar home-section-head__bar--danger" aria-hidden="true" />
                Скидки
              </h2>
              <Link href="/discounts" className="home-section-head__link">
                Все скидки
                <ArrowRightIcon width={14} height={14} />
              </Link>
            </div>

            <div className="home-section__grid">
              {discountsLoading && discounts.length === 0
                ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                : discounts.map((variant) => <ProductCard key={variant.variantId} variant={variant} />)}
            </div>
          </div>
        </section>
      )}

      {(hitsLoading || (hits && hits.length > 0)) && (
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

            <div className="home-section__grid">
              {hitsLoading && !hits
                ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                : (hits ?? []).map((variant) => <ProductCard key={variant.variantId} variant={variant} />)}
            </div>
          </div>
        </section>
      )}

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
