import type { AttributeType, AttributeValue } from '@/api/types';

export function formatAttributeValue(
  type: AttributeType,
  value: AttributeValue | undefined,
  unit?: string | null,
): string | null {
  if (value === undefined || value === null || value === '') return null;

  if (type === 'BOOLEAN') {
    return value === true || value === 'true' ? 'Да' : 'Нет';
  }

  if (type === 'NUMBER') {
    return unit ? `${value} ${unit}` : String(value);
  }

  return String(value);
}
