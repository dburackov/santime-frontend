'use client';

import { useRef } from 'react';
import './PromoSlider.css';
import { usePublicPromoCodes } from '@/queries/usePublicPromoCodes';
import { useCarousel } from '@/hooks/useCarousel';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icons';

const AUTOPLAY_MS = 5000;
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

export function PromoSlider() {
  const { data: promoCodes } = usePublicPromoCodes();
  const gesture = useRef<GestureState | null>(null);

  const count = promoCodes?.length ?? 0;
  const { index, goTo, next, prev, pause, resume } = useCarousel(count, { autoplayMs: AUTOPLAY_MS });

  if (count === 0) return null;

  const current = promoCodes![index];

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (count < 2 || event.pointerType === 'mouse') return;
    gesture.current = { id: event.pointerId, startX: event.clientX, startY: event.clientY, axisLocked: false };
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const state = gesture.current;
    if (!state || state.id !== event.pointerId || state.axisLocked) return;

    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;

    // Вертикальный жест — это прокрутка страницы, слайдер в неё не вмешивается.
    if (Math.abs(dy) > VERTICAL_ABORT_PX && Math.abs(dy) > Math.abs(dx)) {
      gesture.current = null;
      return;
    }

    if (Math.abs(dx) > AXIS_LOCK_PX) {
      state.axisLocked = true;
      goTo(index + (dx < 0 ? 1 : -1));
      gesture.current = null;
    }
  }

  function endGesture() {
    gesture.current = null;
  }

  return (
    <section
      className="promo-slider"
      aria-label="Действующие промокоды"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
    >
      <div className="container promo-slider__inner">
        {count > 1 && (
          <button
            type="button"
            className="promo-slider__arrow touch-target"
            onClick={prev}
            aria-label="Предыдущий промокод"
          >
            <ChevronLeftIcon width={16} height={16} />
          </button>
        )}

        <div
          className="promo-slider__viewport"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endGesture}
          onPointerCancel={endGesture}
        >
          {/* Слайды сменяются автоматически, поэтому область не объявлена live-регионом:
              иначе скринридер зачитывал бы промокоды поверх основного контента. */}
          <p className="promo-slider__text" key={current.code}>
            По промокоду <span className="promo-slider__code">{current.code}</span>
            {current.description ? ` ${current.description}` : ''}
          </p>
        </div>

        {count > 1 && (
          <button
            type="button"
            className="promo-slider__arrow touch-target"
            onClick={next}
            aria-label="Следующий промокод"
          >
            <ChevronRightIcon width={16} height={16} />
          </button>
        )}
      </div>
    </section>
  );
}
