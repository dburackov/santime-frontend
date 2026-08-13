/**
 * Единственный источник транслитерации для slug'ов админки.
 *
 * Таблица собрана «как принято в русских URL», а не по ГОСТу: щ → sch, ц → c,
 * ъ и ь просто выпадают. Хочется другого написания — правится здесь, разом для
 * всех форм.
 */
const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

/** «Смеситель для кухни Grohe» → «smesitel-dlya-kuhni-grohe». */
export function slugify(value: string): string {
  const transliterated = value
    .toLowerCase()
    .split('')
    .map((char) => TRANSLIT[char] ?? char)
    .join('');

  return transliterated
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
