import Link from 'next/link';
import './CategoryTile.css';
import { ChevronRightIcon } from '@/components/ui/icons';
import type { CategoryResponse } from '@/api/types';

interface CategoryTileProps {
  category: CategoryResponse;
}

export function CategoryTile({ category }: CategoryTileProps) {
  return (
    <Link href={`/category/${category.slug}`} className="home-category-tile">
      <span className="home-category-tile__text">
        <span className="home-category-tile__name">{category.name}</span>
        {category.productCount != null && (
          <span className="home-category-tile__count">{category.productCount} товаров</span>
        )}
      </span>
      <ChevronRightIcon className="home-category-tile__chevron" width={18} height={18} />
    </Link>
  );
}
