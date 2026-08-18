/** Белорусский мобильный: код оператора + 7 цифр. Городские номера не принимаем. */
const OPERATOR_CODES = ['25', '29', '33', '44'];

const NATIONAL_LENGTH = 9;

/**
 * Код страны в поле стоит всегда: без него первое нажатие «+» или «3» уходило в код
 * оператора, и человек набирал номер вслепую.
 */
export const PHONE_PREFIX = '+375 ';

/**
 * Значимые цифры номера без кода страны. Понимает и то, что человек набрал сам
 * (`29...`), и вставленное из буфера в любом привычном виде (`+375...`, `80...`).
 */
export function phoneDigits(input: string): string {
  let digits = input.replace(/\D/g, '');
  // Цикл, а не одно снятие: код страны уже стоит в поле, и набранный поверх него
  // «+375…» дал бы 375375… — а кода оператора «37» не существует, снимать безопасно.
  while (digits.startsWith('375')) digits = digits.slice(3);
  if (digits.startsWith('80')) digits = digits.slice(2);
  return digits.slice(0, NATIONAL_LENGTH);
}

export function formatPhone(input: string): string {
  const digits = phoneDigits(input);
  if (!digits) return PHONE_PREFIX;

  let result = `${PHONE_PREFIX}(${digits.slice(0, 2)}`;
  if (digits.length >= 2) result += ')';
  if (digits.length > 2) result += ` ${digits.slice(2, 5)}`;
  if (digits.length > 5) result += `-${digits.slice(5, 7)}`;
  if (digits.length > 7) result += `-${digits.slice(7, 9)}`;
  return result;
}

export function isValidPhone(input: string): boolean {
  const digits = phoneDigits(input);
  return digits.length === NATIONAL_LENGTH && OPERATOR_CODES.includes(digits.slice(0, 2));
}

/** Каноничный вид для бэкенда: `+375291234567`. */
export function toPhoneE164(input: string): string {
  return `+375${phoneDigits(input)}`;
}
