import { Link } from 'react-router-dom';
import './VariantOptions.css';
import type { VariantOptionGroup } from '@/api/types';

export function VariantOptions({ groups }: { groups: VariantOptionGroup[] }) {
  if (groups.length === 0) return null;

  return (
    <div className="variant-options-list">
      {groups.map((group) => (
        <div className="variant-options" key={group.attributeSlug}>
          <div className="variant-options__title">{group.attributeName}</div>
          <div className="variant-options__list">
            {group.options.map((option) => (
              <Link
                key={option.variantId}
                to={`/product/${option.variantSlug}`}
                className={[
                  'variant-options__pill',
                  option.current ? 'variant-options__pill--active' : '',
                  !option.inStock ? 'variant-options__pill--oos' : '',
                ].join(' ')}
                aria-current={option.current ? 'true' : undefined}
              >
                {option.value}
                {!option.inStock && <span className="visually-hidden"> (нет в наличии)</span>}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
