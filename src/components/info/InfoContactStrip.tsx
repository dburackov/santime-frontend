import './InfoContactStrip.css';
import Link from 'next/link';
import { ArrowRightIcon } from '@/components/ui/icons';

interface InfoContactStripProps {
  title: string;
  text: string;
  /** Внешняя ссылка (tel:, mailto:) — основное действие, золотая кнопка. */
  action: { label: string; href: string };
  /** Переход на соседнюю информационную страницу — контурная кнопка. */
  link: { label: string; to: string };
}

/** Нижняя полоса информационных страниц: вопрос, пояснение и две кнопки. */
export function InfoContactStrip({ title, text, action, link }: InfoContactStripProps) {
  return (
    <section className="info-contact-strip">
      <div className="container info-contact-strip__inner">
        <div className="info-contact-strip__text">
          <h2 className="info-contact-strip__title">{title}</h2>
          <p className="info-contact-strip__lead">{text}</p>
        </div>
        <div className="info-contact-strip__actions">
          <a href={action.href} className="info-contact-strip__button info-contact-strip__button--gold">
            {action.label}
          </a>
          <Link href={link.to} className="info-contact-strip__button info-contact-strip__button--outline">
            {link.label}
            <ArrowRightIcon width={15} height={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
