'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import './HeroKits.css';
import '@/components/ui/Skeleton.css';
import { useKits } from '@/queries/useKits';
import { useCart } from '@/cart/useCart';
import { ProductPhoto } from '@/components/ui/ProductPhoto';
import { Price } from '@/components/ui/Price';
import { Button } from '@/components/ui/Button';
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icons';

const AUTOPLAY_MS = 5000;
const KITS_PATH = '/category/komplekty';

export function HeroKits() {
  const { data: kits } = useKits();
  const { addItem } = useCart();
  const [index, setIndex] = useState(0);

  const count = kits?.length ?? 0;
  // Список мог измениться под сохранённым индексом — нормализуем при рендере,
  // а не эффектом: лишний каскадный рендер не нужен (тот же приём в PromoSlider).
  const safeIndex = count > 0 ? index % count : 0;

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (count < 2 || paused) return;

    // prefers-reduced-motion в reset.css обнуляет только CSS-анимации, таймер надо гасить самим.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const timer = window.setInterval(() => setIndex((prev) => (prev + 1) % count), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [count, paused]);

  if (!kits) return <HeroKitsSkeleton />;
  if (count === 0) return null;

  const kit = kits[safeIndex];

  return (
    <div
      className="hero-kits"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="hero-kits__head">
        <span className="hero-kits__title">Готовые решения</span>
        <Link href={KITS_PATH} className="hero-kits__link">
          Все наборы
          <ArrowRightIcon width={14} height={14} />
        </Link>
      </div>

      <article className="hero-kits__card">
        <Link href={`/product/${kit.variantSlug}`} className="hero-kits__photo">
          {/* size="card" — он тянется по контейнеру, а не фиксирован в 170px, как "row". */}
          <ProductPhoto
            image={kit.images?.[0]}
            alt={kit.productName}
            size="card"
            sizes="150px"
            priority
          />
        </Link>

        <div className="hero-kits__body">
          <Link href={`/product/${kit.variantSlug}`} className="hero-kits__name">
            {kit.productName}
          </Link>

          <div className="hero-kits__buy">
            <Price value={kit.price} oldValue={kit.oldPrice} size="md" stacked />
            <Button
              variant="gold"
              size="sm"
              onClick={() =>
                addItem({
                  variantId: kit.variantId,
                  variantSlug: kit.variantSlug,
                  productName: kit.productName,
                  price: kit.price,
                  attributes: kit.attributes,
                  image: kit.images?.[0] ?? null,
                })
              }
            >
              Купить
            </Button>
          </div>
        </div>
      </article>

      <div className="hero-kits__nav">
        <span className="hero-kits__counter">
          {safeIndex + 1} / {count}
        </span>
        {count > 1 && (
          <div className="hero-kits__arrows">
            <button
              type="button"
              className="hero-kits__arrow"
              onClick={() => goTo(safeIndex - 1)}
              aria-label="Предыдущий комплект"
            >
              <ChevronLeftIcon width={16} height={16} />
            </button>
            <button
              type="button"
              className="hero-kits__arrow"
              onClick={() => goTo(safeIndex + 1)}
              aria-label="Следующий комплект"
            >
              <ChevronRightIcon width={16} height={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function HeroKitsSkeleton() {
  return (
    <div className="hero-kits">
      <div className="hero-kits__head">
        <span className="hero-kits__title">Готовые решения</span>
      </div>
      <div className="hero-kits__card">
        <div className="skeleton-block hero-kits__photo" />
        <div className="hero-kits__body">
          <div className="skeleton-block" style={{ width: '85%', height: 14 }} />
          <div className="skeleton-block" style={{ width: '60%', height: 14 }} />
          <div className="hero-kits__buy">
            <div className="skeleton-block" style={{ width: 110, height: 22 }} />
            <div className="skeleton-block" style={{ width: 88, height: 36 }} />
          </div>
        </div>
      </div>
      <div className="hero-kits__nav" />
    </div>
  );
}
