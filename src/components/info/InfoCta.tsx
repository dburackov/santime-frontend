import './InfoCta.css';
import Link from 'next/link';
import { ArrowRightIcon } from '@/components/ui/icons';

interface InfoCtaProps {
  title: string;
  text: string;
  /** Внешняя ссылка (tel:, mailto:) — основное действие, золотая кнопка. */
  action: { label: string; href: string };
  /** Переход на соседнюю информационную страницу — контурная кнопка. */
  link: { label: string; to: string };
}

/** Нижняя полоса информационных страниц: вопрос, пояснение и две кнопки. */
export function InfoCta({ title, text, action, link }: InfoCtaProps) {
  return (
    <section className="info-cta">
      <div className="container info-cta__inner">
        <div className="info-cta__text">
          <h2 className="info-cta__title">{title}</h2>
          <p className="info-cta__lead">{text}</p>
        </div>
        <div className="info-cta__actions">
          <a href={action.href} className="info-cta__btn info-cta__btn--gold">
            {action.label}
          </a>
          <Link href={link.to} className="info-cta__btn info-cta__btn--outline">
            {link.label}
            <ArrowRightIcon width={15} height={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
