'use client';

import { useEffect, useState } from 'react';
import './ScrollTopButton.css';
import { ArrowUpIcon } from './icons';
import { scrollToTop } from '@/utils/scrollToTop';

const SHOW_AFTER = 300;

export function ScrollTopButton() {
  // scrollY нельзя читать в инициализаторе: первый рендер обязан совпасть с серверным.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function update() {
      setVisible(window.scrollY > SHOW_AFTER);
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <button
      type="button"
      className={`scroll-top ${visible ? 'scroll-top--visible' : ''}`}
      onClick={scrollToTop}
      aria-label="Наверх"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
    >
      <ArrowUpIcon width={20} height={20} />
    </button>
  );
}
