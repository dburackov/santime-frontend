'use client';

import { useState } from 'react';
import './ProductPhoto.css';
import { BoxIcon } from './icons';
import type { CategoryImageResponse, ProductImageResponse } from '@/api/types';

type PhotoSize = 'menu' | 'thumb' | 'tile' | 'row' | 'card' | 'detail';

/** Компонент читает только srcset/fallback/alt, поэтому фото категории (без id) ему тоже подходит. */
type PhotoImage = Omit<ProductImageResponse, 'id'> | CategoryImageResponse;

/** Примерные габариты контейнера по месту использования — только для CLS, не из реального разрешения файла. */
const DIMENSIONS: Record<PhotoSize, { width: number; height: number }> = {
  menu: { width: 48, height: 48 },
  thumb: { width: 60, height: 60 },
  tile: { width: 104, height: 104 },
  row: { width: 170, height: 170 },
  card: { width: 282, height: 282 },
  detail: { width: 420, height: 420 },
};

/** sizes по умолчанию на случай, если конкретное место использования его не переопределяет. */
const DEFAULT_SIZES: Record<PhotoSize, string> = {
  menu: '48px',
  thumb: '60px',
  tile: '104px',
  row: '170px',
  card: '(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw',
  detail: '(max-width: 767px) 100vw, 420px',
};

interface ProductPhotoProps {
  /** Готовый набор srcset/fallback/alt с бэкенда (см. IMAGE-PIPELINE-SPEC.md, 5.3). Пока фото не загружено — плейсхолдер. */
  image?: PhotoImage | null;
  alt: string;
  size?: PhotoSize;
  /** Переопределяет sizes по умолчанию для данного места использования. */
  sizes?: string;
  /** Первое/hero-изображение страницы — без lazy, с высоким приоритетом загрузки (влияет на LCP). */
  priority?: boolean;
  /** Отложить загрузку: бокс и его габариты те же, но src/srcset не проставляются. Нужно слайдеру
   *  карточки — соседние слайды не должны стоить сети, пока товар не начали листать. Плейсхолдер
   *  при этом не показывается: иначе на первом кадре свайпа мигнёт иконка вместо фото. */
  deferred?: boolean;
  className?: string;
}

export function ProductPhoto({
  image,
  alt,
  size = 'card',
  sizes,
  priority = false,
  deferred = false,
  className,
}: ProductPhotoProps) {
  const { width, height } = DIMENSIONS[size];
  const [failed, setFailed] = useState(false);

  const showPlaceholder = (!image || failed) && !deferred;

  return (
    <div
      className={`product-photo product-photo--${size}${showPlaceholder ? ' product-photo--empty' : ''}${className ? ` ${className}` : ''}`}
    >
      {image && !failed ? (
        <img
          // Битая картинка из кеша к моменту гидратации уже complete, и onError по ней
          // не выстрелит — распознаём её по нулевой natural-ширине. Отложенный слайд под это
          // описание подходит буквально (src ещё нет), поэтому его проверка не касается.
          ref={(node) => {
            if (!deferred && node?.complete && node.naturalWidth === 0) setFailed(true);
          }}
          srcSet={deferred ? undefined : image.srcset}
          sizes={sizes ?? DEFAULT_SIZES[size]}
          src={deferred ? undefined : image.fallback}
          // Пустой alt у отложенного слайда — без src браузер нарисовал бы вместо картинки
          // альтернативный текст.
          alt={deferred ? '' : image.alt || alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          onError={() => setFailed(true)}
        />
      ) : (
        <BoxIcon className="product-photo__placeholder" aria-label={alt} />
      )}
    </div>
  );
}
