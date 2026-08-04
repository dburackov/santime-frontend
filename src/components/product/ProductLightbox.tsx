'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import './ProductLightbox.css';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '@/components/ui/icons';
import { ProductPhoto } from '@/components/ui/ProductPhoto';
import type { ProductImageResponse } from '@/api/types';

/** Сцена лайтбокса на мобильном занимает всю ширину, на десктопе ограничена высотой
 * экрана. sizes умеет говорить только про ширину, поэтому 80vh — приближение:
 * слегка перезапрашиваем на узких высоких окнах, зато никогда не берём слишком
 * мелкий кандидат (недобор виден как мыло, перебор стоит одну ступень лестницы). */
const LIGHTBOX_SIZES = '(max-width: 767px) 100vw, 80vh';

/** Порог фиксации оси: пока палец не ушёл на столько по X, жест не считается свайпом. */
const AXIS_LOCK_PX = 10;
/** Вертикальный уход, после которого жест отдаём браузеру под прокрутку. */
const VERTICAL_ABORT_PX = 12;

interface GestureState {
  id: number;
  startX: number;
  startY: number;
  axisLocked: boolean;
}

interface ProductLightboxProps {
  /** Непустой — вызывающая сторона не монтирует лайтбокс без фото. */
  images: ProductImageResponse[];
  /** Управляемый индекс, общий с ProductGallery: после закрытия на странице
   * остаётся то фото, которое пользователь смотрел последним. */
  index: number;
  productName: string;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

export function ProductLightbox({ images, index, productName, onIndexChange, onClose }: ProductLightboxProps) {
  const count = images.length;
  // Страховка на случай, если рефетч укоротил массив, пока лайтбокс открыт.
  const safeIndex = Math.min(Math.max(index, 0), count - 1);
  const image = images[safeIndex];
  const multiple = count > 1;

  const dialogRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const activeThumbRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const gestureRef = useRef<GestureState | null>(null);
  const suppressClickRef = useRef(false);
  const [dragX, setDragX] = useState(0);

  const goTo = useCallback(
    (next: number) => {
      onIndexChange(((next % count) + count) % count);
    },
    [count, onIndexChange],
  );

  // Блокировка прокрутки страницы под оверлеем — тот же приём, что в FilterPanel,
  // но без guard'а на open: монтирование и есть открытие.
  useEffect(() => {
    document.body.classList.add('no-scroll');
    return () => document.body.classList.remove('no-scroll');
  }, []);

  // Фокусируем сам контейнер, а не кнопку закрытия — скринридер сначала прочитает
  // заголовок диалога, и первый Tab уже приведёт на «Закрыть».
  useEffect(() => {
    // В StrictMode эффекты идут монтирование → cleanup → монтирование, и на втором
    // проходе activeElement — уже сам диалог. Проверка вложенности не даёт перетереть
    // настоящий триггер ссылкой на оторванный узел.
    const previous = document.activeElement as HTMLElement | null;
    if (previous && !dialogRef.current?.contains(previous)) {
      restoreRef.current = previous;
    }
    dialogRef.current?.focus();

    return () => {
      const target = restoreRef.current;
      // При смене варианта галерея размонтируется целиком — возвращать фокус некуда.
      if (target && document.contains(target)) target.focus();
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowLeft') {
        goTo(safeIndex - 1);
      } else if (event.key === 'ArrowRight') {
        goTo(safeIndex + 1);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [safeIndex, goTo, onClose]);

  // Предзагрузка соседей. Через new Image() с тем же srcset/sizes, а не по zoom
  // напрямую: иначе браузер прогреет кеш одним кандидатом, а отрисует другой.
  useEffect(() => {
    if (count < 2) return;
    const neighbours = new Set([(safeIndex + 1) % count, (safeIndex - 1 + count) % count]);
    for (const neighbour of neighbours) {
      const preloaded = new Image();
      // sizes строго до srcset — часть движков резолвит кандидата в момент
      // присваивания srcset.
      preloaded.sizes = LIGHTBOX_SIZES;
      preloaded.srcset = images[neighbour].srcset;
      preloaded.src = images[neighbour].zoom;
    }
    // Без cleanup: смысл именно в том, чтобы файл остался в HTTP-кеше.
  }, [safeIndex, count, images]);

  useEffect(() => {
    if (!multiple) return;
    // behavior не подчиняется CSS-настройке prefers-reduced-motion, читаем вручную.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    activeThumbRef.current?.scrollIntoView({
      block: 'nearest',
      inline: 'center',
      behavior: reduced ? 'auto' : 'smooth',
    });
  }, [safeIndex, multiple]);

  // Ловушка Tab. Единственное место, где сознательно превышаем практику репозитория:
  // из полноэкранного непрозрачного оверлея фокус уходит на невидимый контент без
  // единого видимого фокус-ринга, и без мыши это невосстановимо.
  function handleTrapKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.isPrimary) return;
    if (gestureRef.current) {
      // Второй палец — вероятно пинч; жест отменяем целиком, чтобы попытка
      // приблизить фото не превратилась в листание.
      gestureRef.current = null;
      setDragX(0);
      return;
    }
    // Захват берём не здесь, а по факту опознания свайпа (см. handlePointerMove):
    // setPointerCapture перенацеливает на элемент захвата и последующий click, из-за
    // чего обычный клик по фотографии приходил бы как клик по сцене и закрывал оверлей.
    gestureRef.current = { id: event.pointerId, startX: event.clientX, startY: event.clientY, axisLocked: false };
    // Сбрасываем именно здесь, а не по click: свайп может вообще не породить
    // click, и флаг залипнет, убив следующее закрытие по фону.
    suppressClickRef.current = false;
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    if (!gesture || gesture.id !== event.pointerId) return;

    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;

    // Подавляем клик при любом заметном сдвиге, а не только при горизонтальном:
    // иначе отменённый вертикальный жест доезжает до pointerup, браузер синтезирует
    // click по сцене — и оверлей закрывается, хотя пользователь просто повёл пальцем.
    if (Math.abs(dx) > AXIS_LOCK_PX || Math.abs(dy) > AXIS_LOCK_PX) {
      suppressClickRef.current = true;
    }

    if (!gesture.axisLocked) {
      if (Math.abs(dy) > VERTICAL_ABORT_PX && Math.abs(dy) > Math.abs(dx) * 1.5) {
        gestureRef.current = null;
        setDragX(0);
        return;
      }
      if (Math.abs(dx) <= AXIS_LOCK_PX) return;
      gesture.axisLocked = true;
      // Свайп опознан — теперь захват уместен: остаток жеста дойдёт до нас,
      // даже если палец ушёл за пределы сцены.
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    setDragX(dx);
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    gestureRef.current = null;
    setDragX(0);
    if (!gesture || gesture.id !== event.pointerId || !gesture.axisLocked) return;

    const dx = event.clientX - gesture.startX;
    const stageWidth = stageRef.current?.clientWidth ?? 0;
    const threshold = Math.min(80, stageWidth * 0.2);
    if (dx <= -threshold) goTo(safeIndex + 1);
    else if (dx >= threshold) goTo(safeIndex - 1);
  }

  function handlePointerCancel() {
    gestureRef.current = null;
    setDragX(0);
  }

  // Закрытие по клику мимо картинки. Вешается и на viewport (кольцо паддинга),
  // и на stage (тёмные поля вокруг фото) — проверка target === currentTarget
  // отсекает клики по самому изображению.
  function handleBackdropClick(event: ReactMouseEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    if (suppressClickRef.current) return;
    onClose();
  }

  return (
    <div
      ref={dialogRef}
      className="product-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`Фото товара: ${productName}`}
      tabIndex={-1}
      onKeyDown={handleTrapKeyDown}
    >
      <div className="product-lightbox__backdrop" />

      <button
        type="button"
        className="product-lightbox__close touch-target"
        onClick={onClose}
        aria-label="Закрыть"
      >
        <CloseIcon width={22} height={22} />
      </button>

      {multiple && (
        <>
          {/* Счётчик скрыт от скринридеров — он прочитал бы «3 слэш 7»; вместо него
              рядом живёт live-регион с человеческой формулировкой. */}
          <div className="product-lightbox__counter mono-num" aria-hidden="true">
            {safeIndex + 1} / {count}
          </div>
          <span className="visually-hidden" aria-live="polite">
            Фото {safeIndex + 1} из {count}
          </span>
        </>
      )}

      <div className="product-lightbox__viewport" onClick={handleBackdropClick}>
        {multiple && (
          <button
            type="button"
            className="product-lightbox__nav product-lightbox__nav--prev touch-target"
            onClick={() => goTo(safeIndex - 1)}
            aria-label="Предыдущее фото"
          >
            <ChevronLeftIcon width={22} height={22} />
          </button>
        )}

        <div
          ref={stageRef}
          className="product-lightbox__stage"
          onClick={handleBackdropClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        >
          {/* Без key на img: React меняет src/srcSet на месте, и браузер держит
              предыдущий кадр до декодирования нового — нет белой вспышки, не нужен
              спиннер. src={zoom} — канонический крупный вариант и фолбэк для
              браузеров без srcset. */}
          <img
            className={`product-lightbox__image${dragX !== 0 ? ' product-lightbox__image--dragging' : ''}`}
            srcSet={image.srcset}
            sizes={LIGHTBOX_SIZES}
            src={image.zoom}
            alt={image.alt || productName}
            draggable={false}
            style={dragX !== 0 ? { transform: `translateX(${dragX}px)` } : undefined}
          />
        </div>

        {multiple && (
          <button
            type="button"
            className="product-lightbox__nav product-lightbox__nav--next touch-target"
            onClick={() => goTo(safeIndex + 1)}
            aria-label="Следующее фото"
          >
            <ChevronRightIcon width={22} height={22} />
          </button>
        )}
      </div>

      {multiple && (
        <div className="product-lightbox__thumbs" role="tablist" aria-label="Фото товара">
          {images.map((thumb, thumbIndex) => (
            <button
              key={thumb.id}
              ref={thumbIndex === safeIndex ? activeThumbRef : undefined}
              type="button"
              role="tab"
              aria-selected={thumbIndex === safeIndex}
              aria-label={`Фото ${thumbIndex + 1}`}
              className={`product-lightbox__thumb${thumbIndex === safeIndex ? ' product-lightbox__thumb--active' : ''}`}
              onClick={() => onIndexChange(thumbIndex)}
            >
              <ProductPhoto image={thumb} alt={productName} size="thumb" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
