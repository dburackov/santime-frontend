import './AttributesTable.css';
import type { AttributeValue, VariantDetailAttributeMeta } from '@/api/types';
import { formatAttributeValue } from '@/utils/attributes';

interface AttributesTableProps {
  metadata: VariantDetailAttributeMeta[];
  attributes: Record<string, AttributeValue>;
}

export function AttributesTable({ metadata, attributes }: AttributesTableProps) {
  const rows = metadata
    .map((meta) => ({ meta, value: formatAttributeValue(meta.type, attributes[meta.slug], meta.unit) }))
    .filter((row): row is { meta: VariantDetailAttributeMeta; value: string } => row.value !== null);

  if (rows.length === 0) return null;

  return (
    <dl className="attrs-table">
      {rows.map(({ meta, value }) => (
        <div className="attrs-table__row" key={meta.slug}>
          <dt>{meta.name}</dt>
          <dd className={meta.type === 'NUMBER' ? 'mono-num' : undefined}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
