const yearPluralRules = new Intl.PluralRules('ru');

export function formatWarrantyYears(years: number): string {
  const plural = yearPluralRules.select(years);
  const unit = plural === 'one' ? 'год' : plural === 'few' ? 'года' : 'лет';
  return `${years} ${unit}`;
}
