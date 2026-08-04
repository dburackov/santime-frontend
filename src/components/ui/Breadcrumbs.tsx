import './Breadcrumbs.css';
import Link from 'next/link';
import { ChevronRightIcon } from './icons';

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="breadcrumbs" aria-label="Хлебные крошки">
      <ol>
        {items.map((item, i) => (
          <li key={i}>
            {item.to ? <Link href={item.to}>{item.label}</Link> : <span>{item.label}</span>}
            {i < items.length - 1 && <ChevronRightIcon width={14} height={14} />}
          </li>
        ))}
      </ol>
    </nav>
  );
}
