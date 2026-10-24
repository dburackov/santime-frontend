'use client';

import './ProductAboutSheet.css';
import { useEffect, useId, useRef, useState, type KeyboardEvent, type TouchEvent } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from '@/components/ui/icons';
import { useScrollEnd } from '@/hooks/useScrollEnd';
import type { SpecRow } from './productSpecs';

/** Свайп вниз по шапке длиннее этого закрывает шторку. */
const SWIPE_CLOSE_PX = 60;
/** Описание считается текущим разделом, когда его верх подошёл к верху тела ближе этого. */
const SECTION_SWITCH_PX = 60;

type Section = 'specs' | 'description';

interface ProductAboutSheetProps {
  rows: SpecRow[];
  paragraphs: string[];
  onClose: () => void;
}

/** Шторка «О товаре» на телефоне: характеристики и описание одним скроллом, чипы-якоря сверху. */
export function ProductAboutSheet({ rows, paragraphs, onClose }: ProductAboutSheetProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const swipeStartRef = useRef<number | null>(null);
  // Пока едем к разделу по нажатию на чип, прокрутка проходит через чужой раздел —
  // следить за ней нельзя, иначе чип мигнёт обратно.
  const programmaticRef = useRef(false);
  const scrollEnd = useScrollEnd();
  const hasSpecs = rows.length > 0;
  const hasDescription = paragraphs.length > 0;
  const [section, setSection] = useState<Section>(hasSpecs ? 'specs' : 'description');

  // Монтирование и есть открытие — блокируем прокрутку страницы под оверлеем, как лайтбокс.
  useEffect(() => {
    document.body.classList.add('no-scroll');
    return () => document.body.classList.remove('no-scroll');
  }, []);

  useEffect(() => {
    // StrictMode монтирует дважды: на втором проходе activeElement — уже сама шторка.
    const previous = document.activeElement as HTMLElement | null;
    if (previous && !dialogRef.current?.contains(previous)) restoreRef.current = previous;
    dialogRef.current?.focus();
    return () => {
      const target = restoreRef.current;
      if (target && document.contains(target)) target.focus();
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape' && !event.defaultPrevented) onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const descriptionOffset = () => {
    const body = bodyRef.current;
    const description = descriptionRef.current;
    if (!body || !description) return 0;
    return description.getBoundingClientRect().top - body.getBoundingClientRect().top;
  };

  const goTo = (target: Section) => {
    const body = bodyRef.current;
    if (!body) return;
    setSection(target);
    const maxTop = body.scrollHeight - body.clientHeight;
    const top = target === 'description' ? Math.min(body.scrollTop + descriptionOffset(), maxTop) : 0;
    // Уже на месте — прокрутки и её конца не будет, ждать нечего.
    if (Math.abs(top - body.scrollTop) < 1) return;
    programmaticRef.current = true;
    scrollEnd.wait(body, () => {
      programmaticRef.current = false;
    });
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    body.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
  };

  const handleScroll = () => {
    if (!hasSpecs || !hasDescription || programmaticRef.current) return;
    setSection(descriptionOffset() <= SECTION_SWITCH_PX ? 'description' : 'specs');
  };

  const handleTouchStart = (event: TouchEvent) => {
    swipeStartRef.current = event.touches[0].clientY;
  };

  const handleTouchEnd = (event: TouchEvent) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (start !== null && event.changedTouches[0].clientY - start > SWIPE_CLOSE_PX) onClose();
  };

  // Фокус не уходит со шторки на страницу под затемнением.
  const handleTrapKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href]');
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div className="about-sheet">
      <div className="about-sheet__scrim" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        className="about-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleTrapKeyDown}
      >
        <div className="about-sheet__head" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <span className="about-sheet__grabber" aria-hidden="true" />
          <div className="about-sheet__title-row">
            <h2 id={titleId} className="about-sheet__title">
              О товаре
            </h2>
            <button type="button" className="about-sheet__close" aria-label="Закрыть" onClick={onClose}>
              <CloseIcon width={20} height={20} />
            </button>
          </div>
          {hasSpecs && hasDescription && (
            <div className="about-sheet__chips">
              <button
                type="button"
                className="about-sheet__chip"
                aria-current={section === 'specs'}
                onClick={() => goTo('specs')}
              >
                Характеристики
              </button>
              <button
                type="button"
                className="about-sheet__chip"
                aria-current={section === 'description'}
                onClick={() => goTo('description')}
              >
                Описание
              </button>
            </div>
          )}
        </div>

        <div ref={bodyRef} className="about-sheet__body" onScroll={handleScroll}>
          {hasSpecs && (
            <dl className="about-sheet__specs">
              {rows.map((row) => (
                <div key={row.key} className="about-sheet__spec">
                  <dt>{row.name}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {hasDescription && (
            <div
              ref={descriptionRef}
              className={`about-sheet__description${hasSpecs ? ' about-sheet__description--anchored' : ''}`}
            >
              <h3 className="about-sheet__description-title">Описание</h3>
              {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
