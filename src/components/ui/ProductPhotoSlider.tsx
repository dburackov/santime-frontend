'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import './ProductPhotoSlider.css';
import { ProductPhoto } from './ProductPhoto';
import type { ProductImageResponse } from '@/api/types';

/** Дальше зона наведения становится уже 40px и курсор начинает перескакивать между кадрами,
 *  а буллеты превращаются в расчёску. Остальные снимки остаются на странице товара. */
const MAX_SLIDES = 8;
/** Порог фиксации оси: пока палец не ушёл на столько по X, жест не считается свайпом. */
const AXIS_LOCK_PX = 10;
/** Вертикальный уход, после которого жест отдаём браузеру под прокрутку. */
const VERTICAL_ABORT_PX = 12;
/** Скорость, на которой короткий флик листает, не дотянув до половины блока. */
const FLICK_PX_PER_MS = 0.5;

interface GestureState {
  id: number;
  startX: number;
  startY: number;
  startTime: number;
  axisLocked: boolean;
}

interface ProductPhotoSliderProps {
  images?: ProductImageResponse[];
  alt: string;
  size: 'card' | 'row';
}

/**
 * Листание фотографий прямо в карточке. На таче — свайп с перетаскиванием, на десктопе область фото
 * поделена на равные зоны наведения. Режимы разведены по возможностям указателя (@media hover), а не
 * по ширине экрана: тач-ноутбук должен получить свайп, а не зоны.
 *
 * Лента кольцевая, поэтому по краям стоят дубли: перед первым кадром — последний, после последнего —
 * первый. Без них палец на крайнем кадре тянул бы пустоту. Позиция после анимации тихо
 * переставляется с дубля на настоящего близнеца, шва при этом не видно.
 *
 * Соседние слайды стоят в разметке сразу — иначе первый свайп пришёлся бы на ещё не смонтированную
 * ленту, — но до первого взаимодействия у них нет src, и карточка стоит ровно столько же сетевых
 * запросов, сколько стоила с одним фото.
 */
export function ProductPhotoSlider({ images, alt, size }: ProductPhotoSliderProps) {
  const slides = (images ?? []).slice(0, MAX_SLIDES);
  const count = slides.length;

  /** Позиция в расширенной ленте (0 и count+1 — дубли), единственный источник правды. */
  const [pos, setPos] = useState(1);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [armed, setArmed] = useState(false);
  /** Перестановка через край кольца: на один кадр снимаем анимацию, иначе лента поехала бы
   *  назад через все промежуточные кадры. */
  const [jump, setJump] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<GestureState | null>(null);
  /** Свайп заканчивается обычным click, а фото завёрнуто в ссылку на товар — гасим переход. */
  const suppressClick = useRef(false);

  useEffect(() => {
    if (!jump) return;
    const frame = requestAnimationFrame(() => setJump(false));
    return () => cancelAnimationFrame(frame);
  }, [jump]);

  if (count <= 1) {
    return <ProductPhoto image={slides[0]} alt={alt} size={size} />;
  }

  // Дубли по краям: последний кадр перед первым и первый после последнего.
  const track = [slides[count - 1], ...slides, slides[0]];
  const realIndex = (pos - 1 + count) % count;

  /** Переставить позицию без анимации — с дубля на его настоящего близнеца. */
  function settle(nextPos: number) {
    setJump(true);
    setPos(nextPos);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    setArmed(true);
    suppressClick.current = false;
    if (event.pointerType === 'mouse') return;

    // Свайп поверх ещё не доехавшей анимации: позиция может стоять на дубле, и следующий шаг
    // увёл бы её за пределы ленты. Сначала возвращаем её на настоящий кадр.
    if (pos === 0) settle(count);
    else if (pos === count + 1) settle(1);

    gesture.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startTime: event.timeStamp,
      axisLocked: false,
    };
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const state = gesture.current;
    if (!state || state.id !== event.pointerId) return;

    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;

    // Подавляем клик при заметном сдвиге по любой оси: отменённый вертикальный жест доезжает до
    // pointerup, браузер синтезирует click — и карточка ушла бы в товар, хотя пользователь просто
    // повёл пальцем.
    if (Math.abs(dx) > AXIS_LOCK_PX || Math.abs(dy) > AXIS_LOCK_PX) {
      suppressClick.current = true;
    }

    if (!state.axisLocked) {
      // Вертикальный жест — это прокрутка страницы, слайдер в неё не вмешивается.
      if (Math.abs(dy) > VERTICAL_ABORT_PX && Math.abs(dy) > Math.abs(dx) * 1.5) {
        gesture.current = null;
        setDragging(false);
        setDragX(0);
        return;
      }
      if (Math.abs(dx) <= AXIS_LOCK_PX) return;
      state.axisLocked = true;
      // Захват берём только сейчас, а не в pointerdown: setPointerCapture перенацеливает
      // последующий click, и обычный тап по фото перестал бы открывать товар.
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
    }

    setDragX(dx);
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const state = gesture.current;
    gesture.current = null;
    setDragging(false);
    setDragX(0);
    if (!state || state.id !== event.pointerId || !state.axisLocked) return;

    const dx = event.clientX - state.startX;
    const width = rootRef.current?.clientWidth ?? 0;
    const velocity = Math.abs(dx) / Math.max(1, event.timeStamp - state.startTime);

    // Либо кадр ушёл больше чем на половину блока, либо это был короткий быстрый флик.
    if (width > 0 && (Math.abs(dx) > width / 2 || velocity > FLICK_PX_PER_MS)) {
      setPos(pos + (dx < 0 ? 1 : -1));
    }
  }

  function handlePointerCancel() {
    gesture.current = null;
    setDragging(false);
    setDragX(0);
  }

  /** Доехали до дубля — молча встаём на настоящий кадр с тем же изображением. */
  function handleTransitionEnd(event: React.TransitionEvent<HTMLDivElement>) {
    if (event.propertyName !== 'transform') return;
    if (pos === 0) settle(count);
    else if (pos === count + 1) settle(1);
  }

  function handleClickCapture(event: React.MouseEvent<HTMLDivElement>) {
    if (!suppressClick.current) return;
    suppressClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <div
      ref={rootRef}
      className={`photo-slider photo-slider--${size}${armed ? ' photo-slider--armed' : ''}`}
      onPointerEnter={() => setArmed(true)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClickCapture={handleClickCapture}
      // pointerleave с проверкой типа, а не mouseleave: мобильные браузеры синтезируют мышиные
      // события после тапа, и карточка возвращалась бы на первый кадр сразу после свайпа.
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') setPos(1);
      }}
    >
      {/* Позиция и сдвиг уезжают в кастомные свойства, а не в готовый transform: так медиазапрос
          для десктопа отменяет сдвиг обычным правилом, не борясь с инлайновым стилем. */}
      <div
        className={`photo-slider__track${dragging ? ' photo-slider__track--dragging' : ''}${jump ? ' photo-slider__track--jump' : ''}`}
        style={{ '--pos': pos, '--drag-x': `${dragX}px` } as CSSProperties}
        onTransitionEnd={handleTransitionEnd}
      >
        {track.map((image, i) => (
          // Ключ — позиция в ленте, а не image.id: у дублей id совпадает с оригиналом.
          <ProductPhoto
            key={i}
            image={image}
            alt={alt}
            size={size}
            deferred={!armed && i !== pos}
            className={`photo-slider__slide${i === pos ? ' photo-slider__slide--active' : ''}`}
          />
        ))}
      </div>

      {/* Зоны и буллеты — обычные div: интерактивные элементы нельзя вкладывать в ссылку,
          которой обёрнуто фото, а эти вкладывать можно, и клик по ним всплывает до неё. */}
      <div className="photo-slider__zones" aria-hidden="true">
        {slides.map((image, i) => (
          <div key={image.id} className="photo-slider__zone" onMouseEnter={() => setPos(i + 1)} />
        ))}
      </div>

      <div className="photo-slider__bullets" aria-hidden="true">
        {slides.map((image, i) => (
          <span
            key={image.id}
            className={`photo-slider__bullet${i === realIndex ? ' photo-slider__bullet--active' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}
