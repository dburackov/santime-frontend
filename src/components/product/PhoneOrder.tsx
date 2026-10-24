'use client';

import './PhoneOrder.css';
import { useId, useState } from 'react';
import { PhoneIcon } from '@/components/ui/icons';
import { SITE_PHONES } from '@/config/siteInfo';

/**
 * «Заказ по телефону» в блоке покупки. На десктопе tel:-ссылке звонить нечем, поэтому
 * кнопка раскрывает оба номера прямо в карточке — их видно и можно набрать с телефона.
 * Номера остаются ссылками: на планшете и с софтфоном по ним звонят сразу.
 */
export function PhoneOrder() {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="phone-order" data-open={open}>
      <button
        type="button"
        className="phone-order__toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <PhoneIcon width={15} height={15} strokeWidth={1.8} />
        Заказ по телефону
      </button>
      {open && (
        <div id={panelId} className="phone-order__panel">
          <ul className="phone-order__numbers">
            {SITE_PHONES.map((phone) => (
              <li key={phone.href}>
                <a href={phone.href} className="phone-order__number">
                  {phone.display}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
