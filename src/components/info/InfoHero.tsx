import './InfoHero.css';
import Link from 'next/link';
import { ChevronRightIcon } from '@/components/ui/icons';

interface InfoHeroProps {
  title: string;
  subtitle: string;
}

/** Тёмная шапка информационных страниц: крошки «Главная › …», заголовок и подзаголовок. */
export function InfoHero({ title, subtitle }: InfoHeroProps) {
  return (
    <section className="info-hero">
      <div className="container info-hero__inner">
        <nav aria-label="Хлебные крошки">
          <ol className="info-hero__crumbs">
            <li>
              <Link href="/">Главная</Link>
            </li>
            <li aria-hidden="true">
              <ChevronRightIcon width={14} height={14} />
            </li>
            <li aria-current="page">{title}</li>
          </ol>
        </nav>
        <h1 className="info-hero__title">{title}</h1>
        <p className="info-hero__subtitle">{subtitle}</p>
      </div>
    </section>
  );
}
