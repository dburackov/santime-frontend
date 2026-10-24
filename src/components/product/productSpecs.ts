import { formatAttributeValue } from '@/utils/attributes';
import type { VariantDetailResponse } from '@/api/types';

export interface SpecRow {
  key: string;
  name: string;
  value: string;
  /** Как характеристика звучит в строке-сводке; null — в сводку не попадает. */
  summary: string | null;
}

/** Характеристики исполнения в порядке метаданных категории, пустые отброшены, вес — последним. */
export function buildSpecRows(variant: VariantDetailResponse): SpecRow[] {
  const rows: SpecRow[] = [];
  for (const meta of variant.attributeMetadata) {
    const raw = variant.attributes[meta.slug];
    const value = formatAttributeValue(meta.type, raw, meta.unit);
    if (value === null) continue;
    // «Да» без названия в сводке ничего не говорит, поэтому булевы звучат названием
    // («однорычажный»), а «нет» в сводку не идёт вовсе.
    const isTrue = raw === true || raw === 'true';
    const summary = meta.type === 'BOOLEAN' ? (isTrue ? meta.name.toLowerCase() : null) : value;
    rows.push({ key: meta.slug, name: meta.name, value, summary });
  }
  if (variant.weightKg) {
    const value = `${variant.weightKg} кг`;
    rows.push({ key: 'weight', name: 'Вес', value, summary: value });
  }
  return rows;
}

/** Описание приходит одной строкой, абзацы разделены пустой строкой. */
export function splitDescription(description: string | null | undefined): string[] {
  return (description ?? '')
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
