/**
 * Достаёт URL конкретного брейкпоинта из готового srcset, отданного бэкендом
 * (IMAGE-PIPELINE-SPEC.md, 5.3). Не строит и не подписывает URL сам — только
 * выбирает уже готовую строку, бэкенд остаётся единственным местом, которое
 * знает про imgproxy.
 */
export function pickSrcsetUrl(srcset: string, width: number): string | undefined {
  const target = `${width}w`;
  for (const entry of srcset.split(',')) {
    const [url, descriptor] = entry.trim().split(/\s+/);
    if (descriptor === target) return url;
  }
  return undefined;
}
