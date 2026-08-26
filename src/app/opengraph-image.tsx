import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SITE_PHONES } from '@/config/siteInfo';

export const alt = 'Santime — интернет-магазин сантехники';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Карточка для соцсетей и мессенджеров.
 *
 * Файл в корне app даёт маршрут /opengraph-image и автоматически подхватывается
 * только теми страницами, которые не задают openGraph сами (корзина, оформление,
 * 404). Метаданные сливаются поверхностно: страница со своим openGraph затирает
 * родительский вместе с картинкой, и файловая конвенция её туда не возвращает.
 * Поэтому остальные страницы подставляют адрес явно — через OG_IMAGE.
 *
 * Шрифт берётся из node_modules, а не копией в репозитории: satori не понимает
 * woff2, а .woff у fontsource уже лежит. Читать оттуда безопасно, потому что
 * маршрут пререндеривается на сборке (`○ /opengraph-image` в выводе next build)
 * и PNG запекается в артефакт — в рантайме файл уже не нужен. Отсюда же запрет:
 * маршрут обязан остаться статическим. Появится здесь request-time API — при
 * `output: 'standalone'` (флаг BUILD_STANDALONE из Dockerfile) трассировка
 * обрежет node_modules, и чтение упадёт уже на проде.
 *
 * Onest разбит по подмножествам, поэтому латиница и кириллица подключаются
 * отдельными записями с одним именем семейства.
 */
const FONT_DIR = join(process.cwd(), 'node_modules/@fontsource/onest/files');

async function loadFonts() {
  const [latinBold, latinRegular, cyrillicBold, cyrillicRegular] = await Promise.all([
    readFile(join(FONT_DIR, 'onest-latin-700-normal.woff')),
    readFile(join(FONT_DIR, 'onest-latin-400-normal.woff')),
    readFile(join(FONT_DIR, 'onest-cyrillic-700-normal.woff')),
    readFile(join(FONT_DIR, 'onest-cyrillic-400-normal.woff')),
  ]);

  return [
    { name: 'Onest', data: latinBold, weight: 700 as const, style: 'normal' as const },
    { name: 'Onest', data: cyrillicBold, weight: 700 as const, style: 'normal' as const },
    { name: 'Onest', data: latinRegular, weight: 400 as const, style: 'normal' as const },
    { name: 'Onest', data: cyrillicRegular, weight: 400 as const, style: 'normal' as const },
  ];
}

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: 'linear-gradient(135deg, #1D3F5E 0%, #16324B 55%, #0E2137 100%)',
          fontFamily: 'Onest',
          color: '#FFFFFF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 64, fontWeight: 700, letterSpacing: '-0.03em' }}>santime</span>
          <span
            style={{ width: 14, height: 14, borderRadius: 999, background: '#E3C491', marginTop: 22 }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Строки заголовка — отдельными элементами: satori не переносит по <br />,
              весь текст склеился бы в одну строку без пробела. */}
          <span
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: 70,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
            }}
          >
            <span>Интернет-магазин</span>
            <span>сантехники</span>
          </span>
          <span style={{ width: 96, height: 5, background: '#B08D57', margin: '40px 0 32px' }} />
          <span style={{ fontSize: 30, fontWeight: 400, color: 'rgba(255, 255, 255, 0.78)' }}>
            Гарантия на каждый товар. Доставка по Минску и всей Беларуси
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 30,
            color: '#E3C491',
          }}
        >
          <span style={{ fontWeight: 700 }}>santime.by</span>
          <span style={{ fontWeight: 400 }}>{SITE_PHONES[0].display}</span>
        </div>
      </div>
    ),
    { ...size, fonts: await loadFonts() },
  );
}
