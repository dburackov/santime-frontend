'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import './CookieNotice.css';

const STORAGE_KEY = 'santime-cookie-notice';

type NoticeState = 'hidden' | 'shown' | 'leaving';

export function CookieNotice() {
  const [state, setState] = useState<NoticeState>('hidden');

  useEffect(() => {
    let seen = false;
    try {
      seen = window.localStorage.getItem(STORAGE_KEY) !== null;
    } catch {
      // хранилище недоступно — показываем, отметку всё равно не сохранить
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!seen) setState('shown');
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // приватный режим — уведомление просто покажется в следующий раз
    }
    setState('leaving');
  }

  if (state === 'hidden') return null;

  return (
    <div
      className={`cookie-notice ${state === 'leaving' ? 'cookie-notice--leaving' : ''}`}
      role="region"
      aria-label="Уведомление о cookie"
      onAnimationEnd={() => {
        if (state === 'leaving') setState('hidden');
      }}
    >
      <p className="cookie-notice__text">
        Наш сайт использует cookies.{' '}
        <Link href="/privacy#cookies" className="cookie-notice__link">
          Подробнее
        </Link>
      </p>
      <button type="button" className="cookie-notice__action" onClick={dismiss}>
        Понятно
      </button>
    </div>
  );
}
