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

/**
 * Строка для построчного списка характеристик (список каталога, 9.1): в отличие от
 * formatAttributeValue (для однострочного "black · латунь · 10 см"), каждый тип
 * форматируется по-своему, т.к. на отдельной строке без соседних значений для
 * контекста голое число неотличимо от единиц измерения другого атрибута.
 * - BOOLEAN: при false характеристика скрывается целиком (null), при true — название
 *   атрибута само по себе читается как утверждение ("С термостатом").
 * - OPTION: значение самодостаточно (название цвета/материала), название атрибута не нужно.
 * - NUMBER: голое число неинформативно без подписи — "Высота излива: 10 см".
 */
export function formatAttributeLine(
  attr: { name: string; type: AttributeType; unit: string | null },
  value: AttributeValue | undefined,
): string | null {
  if (value === undefined || value === null || value === '') return null;

  if (attr.type === 'BOOLEAN') {
    return value === true || value === 'true' ? attr.name : null;
  }

  if (attr.type === 'NUMBER') {
    return attr.unit ? `${attr.name}: ${value} ${attr.unit}` : `${attr.name}: ${value}`;
  }

  return String(value);
}
