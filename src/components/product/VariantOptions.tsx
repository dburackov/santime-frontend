import Link from 'next/link';
import './VariantOptions.css';
import { formatAttributeValue } from '@/utils/attributes';
import type { VariantDetailAttributeMeta, VariantOptionGroup } from '@/api/types';

interface VariantOptionsProps {
  groups: VariantOptionGroup[];
  metadata: VariantDetailAttributeMeta[];
}

export function VariantOptions({ groups, metadata }: VariantOptionsProps) {
  if (groups.length === 0) return null;

  return (
    <div className="variant-options-list">
      {groups.map((group) => {
        // Тип оси приходит только в метаданных атрибутов: без него BOOLEAN-значение
        // true/false React не печатает вовсе и остаётся пустая плашка.
        const meta = metadata.find((item) => item.slug === group.attributeSlug);

        return (
          <div className="variant-options" key={group.attributeSlug}>
            <div className="variant-options__title">{group.attributeName}</div>
            <div className="variant-options__list">
              {group.options.map((option) => (
                <Link
                  key={option.variantId}
                  href={`/product/${option.variantSlug}`}
                  className={[
                    'variant-options__pill',
                    option.current ? 'variant-options__pill--active' : '',
                    !option.available ? 'variant-options__pill--unavailable' : '',
                    !option.inStock ? 'variant-options__pill--oos' : '',
                  ].join(' ')}
                  aria-current={option.current ? 'true' : undefined}
                >
                  {meta
                    ? formatAttributeValue(meta.type, option.value, meta.unit)
                    : String(option.value)}
                  {!option.available && (
                    <span className="visually-hidden"> (в этом сочетании нет, откроется ближайшее)</span>
                  )}
                  {option.available && !option.inStock && (
                    <span className="visually-hidden"> (нет в наличии)</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
