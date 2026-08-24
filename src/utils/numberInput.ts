import type { WheelEvent } from 'react';

/**
 * Колесо мыши над сфокусированным `input[type=number]` меняет значение вместо прокрутки страницы.
 * Отменить событие нельзя — React слушает wheel пассивно, — поэтому снимаем фокус.
 */
export function blurOnWheel(event: WheelEvent<HTMLInputElement>) {
  event.currentTarget.blur();
}
