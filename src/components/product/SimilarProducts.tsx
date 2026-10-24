'use client';

import './SimilarProducts.css';
import Link from 'next/link';
import { ProductCard } from './ProductCard';
import { ArrowRightIcon } from '@/components/ui/icons';
import { useSimilarProducts } from '@/queries/useSimilarProducts';

interface SimilarProductsProps {
  variantSlug: string;
  category?: { name: string; slug: string };
}

export function SimilarProducts({ variantSlug, category }: SimilarProductsProps) {
  const { data } = useSimilarProducts(variantSlug);
  if (!data || data.length === 0) return null;

  return (
    <section className="container similar-products">
      <div className="similar-products__head">
        <h2 className="product-section-title">Похожие товары</h2>
        {category && (
          <Link href={`/category/${category.slug}`} className="similar-products__all">
            Все {category.name.charAt(0).toLowerCase() + category.name.slice(1)}
            <ArrowRightIcon width={14} height={14} />
          </Link>
        )}
      </div>
      <div className="similar-products__grid">
        {data.map((variant) => (
          <ProductCard key={variant.variantId} variant={variant} />
        ))}
      </div>
    </section>
  );
}
