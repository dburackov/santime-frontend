import './InfoContactStrip.css';
import Link from 'next/link';
import { ArrowRightIcon } from '@/components/ui/icons';

type StripLink = { label: string; href: string } | { label: string; to: string };

interface InfoContactStripProps {
  title: string;
  text: string;
  /** plain — нижняя полоса информационных страниц, promo — золотая полоса на странице товара. */
  tone?: 'plain' | 'promo';
  /** Внешняя ссылка (tel:, mailto:) — основное действие, золотая кнопка. */
  action: { label: string; href: string };
  /** Контурная кнопка: внешняя ссылка (href) или переход внутри сайта (to, со стрелкой). */
  link: StripLink;
}

/** Полоса «вопрос, пояснение и две кнопки» внизу информационных страниц и страницы товара. */
export function InfoContactStrip({ title, text, tone = 'plain', action, link }: InfoContactStripProps) {
  return (
    <section className={`info-contact-strip${tone === 'promo' ? ' info-contact-strip--promo' : ''}`}>
      <div className="container info-contact-strip__inner">
        <div className="info-contact-strip__text">
          <h2 className="info-contact-strip__title">{title}</h2>
          <p className="info-contact-strip__lead">{text}</p>
        </div>
        <div className="info-contact-strip__actions">
          <a href={action.href} className="info-contact-strip__button info-contact-strip__button--gold">
            {action.label}
          </a>
          {'to' in link ? (
            <Link href={link.to} className="info-contact-strip__button info-contact-strip__button--outline">
              {link.label}
              <ArrowRightIcon width={15} height={15} />
            </Link>
          ) : (
            <a href={link.href} className="info-contact-strip__button info-contact-strip__button--outline">
              {link.label}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
