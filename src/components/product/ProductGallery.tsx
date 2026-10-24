'use client';

import './ProductGallery.css';
import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react';
import { ProductPhoto } from '@/components/ui/ProductPhoto';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon } from '@/components/ui/icons';
import { ProductLightbox } from './ProductLightbox';
import type { ProductImageResponse } from '@/api/types';

const MAIN_SIZES = '(max-width: 1023px) 100vw, 680px';
const THUMBNAIL_SIZES = '88px';
const SWIPE_MIN_DISTANCE = 40;
const SWIPE_AXIS_RATIO = 1.2;
const THUMBNAILS_PAGE = 0.8;

interface ProductGalleryProps {
  images: ProductImageResponse[];
  productName: string;
}

/** Кадр и лайтбокс сбрасывает key исполнения у родителя: у другого цвета свой набор фото. */
export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const count = images.length;
  const multiple = count > 1;
  const [active, setActive] = useState(0);
  // Кадры грузятся по мере листания: соседи текущего — заранее, чтобы кроссфейд не
  // показывал пустой бокс, остальные не стоят сети, пока до них не дошли.
  const [loaded, setLoaded] = useState(() => new Set([0, 1, count - 1]));
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [thumbnailEdges, setThumbnailEdges] = useState({ start: false, end: false });
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  const swipeRef = useRef<{ x: number; y: number } | null>(null);

  const select = useCallback(
    (next: number) => {
      const index = ((next % count) + count) % count;
      setActive(index);
      setLoaded((previous) => {
        const neighbours = [index - 1, index, index + 1].map((neighbour) => (neighbour + count) % count);
        if (neighbours.every((neighbour) => previous.has(neighbour))) return previous;
        return new Set([...previous, ...neighbours]);
      });
    },
    [count],
  );

  const updateThumbnailEdges = useCallback(() => {
    const element = thumbnailsRef.current;
    if (!element) return;
    const scrollLimit = element.scrollHeight - element.clientHeight;
    setThumbnailEdges({ start: element.scrollTop > 1, end: element.scrollTop < scrollLimit - 1 });
  }, []);

  useEffect(() => {
    const element = thumbnailsRef.current;
    if (!element) return;
    const observer = new ResizeObserver(updateThumbnailEdges);
    observer.observe(element);
    return () => observer.disconnect();
  }, [updateThumbnailEdges]);

  // Лента едет к активной миниатюре сама, но только внутри себя: scrollIntoView
  // заодно прокрутил бы и страницу.
  useEffect(() => {
    const element = thumbnailsRef.current;
    const thumbnail = element?.children[active] as HTMLElement | undefined;
    if (!element || !thumbnail) return;
    element.scrollTo({
      top: thumbnail.offsetTop - (element.clientHeight - thumbnail.offsetHeight) / 2,
      behavior: 'smooth',
    });
  }, [active]);

  const scrollThumbnails = (direction: 1 | -1) => {
    const element = thumbnailsRef.current;
    if (!element) return;
    element.scrollBy({ top: direction * element.clientHeight * THUMBNAILS_PAGE, behavior: 'smooth' });
  };

  const onTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0];
    swipeRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd = (event: TouchEvent) => {
    const start = swipeRef.current;
    swipeRef.current = null;
    if (!start || !multiple) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) > SWIPE_MIN_DISTANCE && Math.abs(deltaX) > Math.abs(deltaY) * SWIPE_AXIS_RATIO) {
      select(active + (deltaX < 0 ? 1 : -1));
    }
  };

  return (
    <div className={`product-gallery${multiple ? '' : ' product-gallery--single'}`}>
      <div className="product-gallery__main" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {count > 0 ? (
          <button
            type="button"
            className="product-gallery__zoom"
            onClick={() => setLightboxOpen(true)}
            aria-label="Открыть фото на весь экран"
          >
            {images.map((image, index) => (
              <span
                key={image.id}
                className={`product-gallery__slide${index === active ? ' product-gallery__slide--active' : ''}`}
                aria-hidden={index !== active}
              >
                <ProductPhoto
                  image={image}
                  alt={productName}
                  size="detail"
                  sizes={MAIN_SIZES}
                  priority={index === 0}
                  deferred={!loaded.has(index)}
                />
              </span>
            ))}
          </button>
        ) : (
          <ProductPhoto image={null} alt={productName} size="detail" />
        )}

        {multiple && (
          <>
            <button
              type="button"
              className="product-gallery__arrow product-gallery__arrow--previous"
              onClick={() => select(active - 1)}
              aria-label="Предыдущее фото"
            >
              <ChevronLeftIcon width={16} height={16} />
            </button>
            <button
              type="button"
              className="product-gallery__arrow product-gallery__arrow--next"
              onClick={() => select(active + 1)}
              aria-label="Следующее фото"
            >
              <ChevronRightIcon width={16} height={16} />
            </button>
            <span className="product-gallery__counter">
              {active + 1} / {count}
            </span>
          </>
        )}
      </div>

      {multiple && (
        <div className="product-gallery__rail">
          <button
            type="button"
            className="product-gallery__rail-arrow product-gallery__rail-arrow--up"
            onClick={() => scrollThumbnails(-1)}
            aria-label="Прокрутить миниатюры вверх"
            hidden={!thumbnailEdges.start}
          >
            <ChevronUpIcon width={16} height={16} />
          </button>
          <div
            ref={thumbnailsRef}
            className="product-gallery__thumbnails"
            role="tablist"
            aria-label="Фото товара"
            onScroll={updateThumbnailEdges}
          >
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                role="tab"
                aria-selected={index === active}
                aria-label={`Фото ${index + 1}`}
                className={`product-gallery__thumbnail${index === active ? ' product-gallery__thumbnail--active' : ''}`}
                onClick={() => select(index)}
              >
                <ProductPhoto image={image} alt={productName} size="thumb" sizes={THUMBNAIL_SIZES} />
              </button>
            ))}
          </div>
          <button
            type="button"
            className="product-gallery__rail-arrow product-gallery__rail-arrow--down"
            onClick={() => scrollThumbnails(1)}
            aria-label="Прокрутить миниатюры вниз"
            hidden={!thumbnailEdges.end}
          >
            <ChevronDownIcon width={16} height={16} />
          </button>
        </div>
      )}

      {lightboxOpen && count > 0 && (
        <ProductLightbox
          images={images}
          index={active}
          productName={productName}
          onIndexChange={select}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
