import './ProductPhoto.css';
import { BoxIcon } from './icons';
import type { ProductImageResponse } from '@/api/types';

type PhotoSize = 'thumb' | 'row' | 'card' | 'detail';

/** Примерные габариты контейнера по месту использования — только для CLS, не из реального разрешения файла. */
const DIMENSIONS: Record<PhotoSize, { width: number; height: number }> = {
  thumb: { width: 60, height: 60 },
  row: { width: 170, height: 170 },
  card: { width: 282, height: 282 },
  detail: { width: 420, height: 420 },
};

/** sizes по умолчанию на случай, если конкретное место использования его не переопределяет. */
const DEFAULT_SIZES: Record<PhotoSize, string> = {
  thumb: '60px',
  row: '170px',
  card: '(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw',
  detail: '(max-width: 767px) 100vw, 420px',
};

interface ProductPhotoProps {
  /** Готовый набор srcset/fallback/alt с бэкенда (см. IMAGE-PIPELINE-SPEC.md, 5.3). Пока фото не загружено — плейсхолдер. */
  image?: ProductImageResponse | null;
  alt: string;
  size?: PhotoSize;
  /** Переопределяет sizes по умолчанию для данного места использования. */
  sizes?: string;
  /** Первое/hero-изображение страницы — без lazy, с высоким приоритетом загрузки (влияет на LCP). */
  priority?: boolean;
}

export function ProductPhoto({ image, alt, size = 'card', sizes, priority = false }: ProductPhotoProps) {
  const { width, height } = DIMENSIONS[size];

  return (
    <div className={`product-photo product-photo--${size}`}>
      {image ? (
        <img
          srcSet={image.srcset}
          sizes={sizes ?? DEFAULT_SIZES[size]}
          src={image.fallback}
          alt={image.alt || alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
        />
      ) : (
        <BoxIcon className="product-photo__placeholder" aria-label={alt} />
      )}
    </div>
  );
}
