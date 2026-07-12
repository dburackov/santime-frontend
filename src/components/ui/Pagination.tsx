import './Pagination.css';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageWindow(page, totalPages);

  return (
    <nav className="pagination" aria-label="Пагинация">
      <button
        type="button"
        className="pagination__nav touch-target"
        onClick={() => onChange(page - 1)}
        disabled={page <= 0}
        aria-label="Предыдущая страница"
      >
        <ChevronLeftIcon width={16} height={16} />
      </button>

      {pages.map((p, i) =>
        p === null ? (
          <span key={`ellipsis-${i}`} className="pagination__ellipsis">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            className={`pagination__page touch-target ${p === page ? 'pagination__page--active' : ''}`}
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
          >
            {p + 1}
          </button>
        ),
      )}

      <button
        type="button"
        className="pagination__nav touch-target"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages - 1}
        aria-label="Следующая страница"
      >
        <ChevronRightIcon width={16} height={16} />
      </button>
    </nav>
  );
}

function getPageWindow(page: number, totalPages: number): (number | null)[] {
  const window = 1;
  const pages: (number | null)[] = [];
  for (let i = 0; i < totalPages; i++) {
    if (i === 0 || i === totalPages - 1 || Math.abs(i - page) <= window) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== null) {
      pages.push(null);
    }
  }
  return pages;
}
