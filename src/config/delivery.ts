/**
 * Условия доставки и пункт самовывоза. Вынесены из разметки, потому что те же
 * цифры повторяет компактный блок на карточке товара — расходиться им нельзя.
 */
export const COURIER = {
  zone: 'Минск + 10 км от МКАД',
  price: '8,00',
  freeFrom: '100',
  intervals: ['11:00–16:00', '18:00–22:00'],
  cutoffNote: 'Заказы после 15:00 переносятся на следующий рабочий день.',
};

/** Бесплатен ли курьер для заказа на эту сумму — одно правило для мобильной и десктопной сводки. */
export function isCourierFree(orderTotal: number) {
  return orderTotal >= Number(COURIER.freeFrom);
}

export const CARRIER = {
  zone: 'Регионы Беларуси',
  priceFrom: '10,00',
  term: '1–5 рабочих дней',
};

export const PICKUP = {
  city: 'г. Минск',
  street: 'ул. Слободская 73',
  hours: 'Пн–Сб, 09:00–21:00',
  hoursNote: 'Вс — по договорённости',
  storageNote: 'Заказ хранится на складе две недели.',
  // Здание на OpenStreetMap: https://www.openstreetmap.org/way/25439394
  lat: 53.85295,
  lon: 27.43671,
};
