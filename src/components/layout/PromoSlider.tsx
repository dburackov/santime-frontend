'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import './PromoSlider.css';
import { usePublicPromoCodes } from '@/queries/usePublicPromoCodes';
import { useCarousel } from '@/hooks/useCarousel';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icons';

const AUTOPLAY_MS = 5000;
/** Порог фиксации оси: пока палец не ушёл на столько по X, жест не считается свайпом. */
const AXIS_LOCK_PX = 10;
/** Вертикальный уход, после которого жест отдаём браузеру под прокрутку. */
const VERTICAL_ABORT_PX = 12;
/** Скорость проезда бегущей строки: длинный текст не должен улетать. */
const MARQUEE_SPEED_PX_PER_S = 45;
/** Доля длительности, которую кейфреймы promo-marquee тратят на проезд в одну сторону.
    Держать в согласии с @keyframes: поменяются проценты там — поменять и здесь. */
const MARQUEE_TRAVEL_FRACTION = 0.35;
/** Пол длительности: текст, вылезающий на пару символов, иначе просто дёргается. */
const MARQUEE_MIN_MS = 1800;

interface GestureState {
  id: number;
  startX: number;
  startY: number;
  axisLocked: boolean;
}

export function PromoSlider() {
  const { data: promoCodes } = usePublicPromoCodes();
  const gesture = useRef<GestureState | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLSpanElement>(null);

  // Насколько текст не помещается в полосу. 0 — помещается, бежать нечему.
  const [shift, setShift] = useState(0);

  const count = promoCodes?.length ?? 0;
  // Пока строка бежит, таймера нет: следующий промокод включает конец прохода.
  const { index, goTo, next, prev, pause, resume } = useCarousel(count, {
    autoplayMs: shift > 0 ? 0 : AUTOPLAY_MS,
  });

  const current = count > 0 ? promoCodes![index] : null;

  useEffect(() => {
    const viewport = viewportRef.current;
    const marquee = marqueeRef.current;
    if (!viewport || !marquee) return;

    const measure = () => {
      const diff = Math.ceil(marquee.scrollWidth - viewport.clientWidth);
      setShift(diff > 1 ? diff : 0);
    };

    measure();
    // Ширина окна и подгрузка шрифта меняют результат замера, поэтому следим за обоими
    // элементами. Петли нет: от shift меняется только transform, а не размеры.
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(marquee);
    return () => observer.disconnect();
  }, [current?.code]);

  if (!current) return null;

  const marqueeMs =
    shift > 0
      ? Math.max(MARQUEE_MIN_MS, ((shift / MARQUEE_SPEED_PX_PER_S) * 1000) / MARQUEE_TRAVEL_FRACTION)
      : 0;
  // Слайд живёт delay + duration, то есть max(таймер, проход). Добираем именно задержкой:
  // растянутая под пять секунд анимация заставила бы текст, вылезающий на десяток пикселей,
  // ползти их почти две секунды.
  const marqueeDelayMs = shift > 0 ? Math.max(0, AUTOPLAY_MS - marqueeMs) : 0;

  function handlePassEnd() {
    // Правило prefers-reduced-motion в reset.css обнуляет длительности анимаций, и без
    // этой проверки animationend выстреливал бы мгновенно, прокручивая карусель на полной
    // скорости. Автопрокрутку при reduced motion не заводит и сам useCarousel.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    next();
  }

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
          ref={viewportRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endGesture}
          onPointerCancel={endGesture}
        >
          {/* Слайды сменяются автоматически, поэтому область не объявлена live-регионом:
              иначе скринридер зачитывал бы промокоды поверх основного контента. */}
          <p
            className={`promo-slider__text${shift > 0 ? ' promo-slider__text--marquee' : ''}`}
            key={current.code}
          >
            {/* Движение вынесено на отдельный узел: на <p> висит promo-slide-in, и с двумя
                анимациями на одном элементе обработчику пришлось бы разбирать animationName. */}
            <span
              className="promo-slider__marquee"
              ref={marqueeRef}
              style={
                {
                  '--promo-shift': `${-shift}px`,
                  '--promo-duration': `${Math.round(marqueeMs)}ms`,
                  '--promo-delay': `${Math.round(marqueeDelayMs)}ms`,
                } as CSSProperties
              }
              onAnimationEnd={handlePassEnd}
            >
              По промокоду <span className="promo-slider__code">{current.code}</span>
              {current.description ? ` ${current.description}` : ''}
            </span>
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
