'use client';

import './ProductCharacteristics.css';
import { useState, type ReactNode } from 'react';
import { ChevronDownIcon } from '@/components/ui/icons';
import { useClampOverflow } from '@/hooks/useClampOverflow';
import { formatAttributeValue } from '@/utils/attributes';
import type { VariantDetailResponse } from '@/api/types';

interface ProductCharacteristicsProps {
  id: string;
  variant: VariantDetailResponse;
}

/** Характеристики и описание — две колонки, на телефоне свёрнуты до превью. */
export function ProductCharacteristics({ id, variant }: ProductCharacteristicsProps) {
  const rows = variant.attributeMetadata
    .map((meta) => ({
      key: meta.slug,
      name: meta.name,
      value: formatAttributeValue(meta.type, variant.attributes[meta.slug], meta.unit),
    }))
    .filter((row): row is { key: string; name: string; value: string } => row.value !== null);
  if (variant.weightKg) rows.push({ key: 'weight', name: 'Вес', value: `${variant.weightKg} кг` });

  const paragraphs = (variant.description ?? '')
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (rows.length === 0 && paragraphs.length === 0) return null;

  return (
    <section id={id} className="product-characteristics">
      <div className="container product-characteristics__inner">
        {rows.length > 0 && (
          <div className="product-characteristics__col">
            <h2 className="product-section-title">Характеристики</h2>
            <Collapsible variant="characteristics">
              <dl className="product-characteristics__list">
                {rows.map((row) => (
                  <div key={row.key} className="product-characteristics__row">
                    <dt>{row.name}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </Collapsible>
          </div>
        )}

        {paragraphs.length > 0 && (
          <div className="product-characteristics__col">
            <h2 className="product-section-title product-section-title--gold">Описание</h2>
            <Collapsible variant="description">
              <div className="product-characteristics__description">
                {paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </Collapsible>
          </div>
        )}
      </div>
    </section>
  );
}

function Collapsible({ variant, children }: { variant: 'characteristics' | 'description'; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { ref, overflowing } = useClampOverflow<HTMLDivElement>();
  const toggle = () => setOpen((isOpen) => !isOpen);

  return (
    <>
      <div ref={ref} className={`product-characteristics__clamp product-characteristics__clamp--${variant}`} data-open={open}>
        {children}
        {overflowing && !open && <span className="product-characteristics__fade" onClick={toggle} aria-hidden="true" />}
      </div>
      {overflowing && (
        <button type="button" className="product-characteristics__more" onClick={toggle} aria-expanded={open}>
          {open ? 'Свернуть' : 'Подробнее'}
          <ChevronDownIcon width={14} height={14} />
        </button>
      )}
    </>
  );
}
