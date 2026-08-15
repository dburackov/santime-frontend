'use client';

import Link from 'next/link';
import './HeroKits.css';
import '@/components/ui/Skeleton.css';
import { useKits } from '@/queries/useKits';
import { useCarousel } from '@/hooks/useCarousel';
import { useCart } from '@/cart/useCart';
import { ProductPhoto } from '@/components/ui/ProductPhoto';
import { Price } from '@/components/ui/Price';
import { Button } from '@/components/ui/Button';
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icons';

const AUTOPLAY_MS = 5000;
const KITS_PATH = '/category/komplekty';

export function HeroKits() {
  const { data: kits, isPending } = useKits();
  const { addItem } = useCart();

  const count = kits?.length ?? 0;
  const { index, next, prev, pause, resume } = useCarousel(count, { autoplayMs: AUTOPLAY_MS });

  // Скелетон только пока запрос идёт: на ошибке kits так и остаётся undefined,
  // и по `!kits` он висел бы вечно. Ошибка и пустой ответ — молча без блока.
  if (isPending) return <HeroKitsSkeleton />;
  if (count === 0) return null;

  const kit = kits![index];

  return (
    <div
      className="hero-kits"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
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
          <ProductPhoto
            image={kit.images?.[0]}
            alt={kit.name}
            size="card"
            sizes="(max-width: 639px) 110px, 150px"
            priority
          />
        </Link>

        <div className="hero-kits__body">
          <Link href={`/product/${kit.variantSlug}`} className="hero-kits__name">
            {kit.name}
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
                  productName: kit.name,
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
          {index + 1} / {count}
        </span>
        {count > 1 && (
          <div className="hero-kits__arrows">
            <button
              type="button"
              className="hero-kits__arrow"
              onClick={prev}
              aria-label="Предыдущий комплект"
            >
              <ChevronLeftIcon width={16} height={16} />
            </button>
            <button
              type="button"
              className="hero-kits__arrow"
              onClick={next}
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
