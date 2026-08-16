'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import './SubcategoryChips.css';
import type { CategoryResponse } from '@/api/types';

interface SubcategoryChipsProps {
  categories: CategoryResponse[];
}

export function SubcategoryChips({ categories }: SubcategoryChipsProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  // Затухание края держим состоянием, а не постоянной маской: долистанная до конца
  // лента иначе выглядит обрезанной. Начальное значение — без затуханий, чтобы
  // серверный и первый клиентский рендер совпали.
  const [edges, setEdges] = useState({ start: false, end: false });

  const syncEdges = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const start = track.scrollLeft > 1;
    const end = track.scrollLeft + track.clientWidth < track.scrollWidth - 1;
    // Возвращаем прежний объект, когда ничего не изменилось: иначе React
    // перерисовывал бы список на каждом событии прокрутки, хотя затухания
    // переключаются пару раз за весь свайп.
    setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  }, []);

  useEffect(() => {
    syncEdges();

    const track = trackRef.current;
    if (!track) return;

    // Вертикальное колесо мыши браузер сам в горизонтальный скролл не переводит —
    // без этого лента на десктопе не листается ничем, кроме Shift+колеса. Слушатель
    // вешаем руками: React регистрирует onWheel на корне пассивно, и preventDefault
    // в нём не сработал бы.
    const onWheel = (event: WheelEvent) => {
      if (event.deltaX !== 0 || event.deltaY === 0) return;

      const max = track.scrollWidth - track.clientWidth;
      if (max <= 0) return;

      // Колесо мыши приходит в строках, а не в пикселях: без пересчёта шаг был бы ~3px.
      const step = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? event.deltaY * 16 : event.deltaY;
      const atEdge =
        (step < 0 && track.scrollLeft <= 0) || (step > 0 && track.scrollLeft >= max - 1);
      // На краю ленту отпускаем: дальше страница должна листаться вертикально.
      if (atEdge) return;

      event.preventDefault();
      track.scrollLeft += step;
    };

    track.addEventListener('wheel', onWheel, { passive: false });

    // Наблюдаем и за треком, и за первой плашкой: на скролл-контейнере
    // ResizeObserver видит только его собственный бокс, а лента перерастает
    // ширину уже после подмены шрифта — и затухание не появлялось бы до скролла.
    const observer = new ResizeObserver(syncEdges);
    observer.observe(track);
    if (track.firstElementChild) observer.observe(track.firstElementChild);

    return () => {
      track.removeEventListener('wheel', onWheel);
      observer.disconnect();
    };
  }, [syncEdges, categories]);

  return (
    <nav className="subcategory-chips" aria-label="Подкатегории">
      <ul
        ref={trackRef}
        onScroll={syncEdges}
        className={`subcategory-chips__track${
          edges.start ? ' subcategory-chips__track--fade-start' : ''
        }${edges.end ? ' subcategory-chips__track--fade-end' : ''}`}
      >
        {categories.map((category) => (
          <li key={category.id}>
            <Link href={`/category/${category.slug}`} className="subcategory-chips__link">
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
