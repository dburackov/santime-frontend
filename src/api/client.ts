import type { AuthResponse, ErrorResponse } from './types';
import { getAccessToken, setAccessToken } from '@/auth/tokenStore';

const IS_SERVER = typeof window === 'undefined';

/**
 * В браузере база пустая — запросы уходят на /api того же origin, а Next
 * проксирует их в Spring через rewrites() (next.config.ts). На сервере
 * относительного адреса не существует, поэтому серверные компоненты ходят в
 * Spring напрямую по абсолютному URL, минуя собственный HTTP-слой Next.
 */
const BASE_URL = IS_SERVER
  ? process.env.API_BASE_URL || 'http://localhost:8080'
  : (process.env.NEXT_PUBLIC_API_BASE_URL ?? '');

export class ApiError extends Error {
  status: number;
  errors: Record<string, string> | null;

  constructor(status: number, body: ErrorResponse) {
    super(body.message || `Ошибка запроса (${status})`);
    this.name = 'ApiError';
    this.status = status;
    this.errors = body.errors ?? null;
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  searchParams?: { [key: string]: string | number | boolean | undefined | null };
  /**
   * Окно кэширования для серверных вызовов, в секундах. Задаётся страницами
   * витрины и должно совпадать с их `export const revalidate`: в Next 15+ fetch
   * по умолчанию не кэшируется, а некэшируемый запрос переводит весь роут в
   * динамический рендеринг. В браузере игнорируется.
   */
  revalidate?: number;
}

function buildUrl(path: string, searchParams?: RequestOptions['searchParams']): string {
  // На сервере BASE_URL абсолютный, поэтому второй аргумент не используется;
  // в браузере он подставляет текущий origin к относительному пути.
  const url = new URL(`${BASE_URL}${path}`, IS_SERVER ? undefined : window.location.origin);
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function buildHeaders(hasJsonBody: boolean): HeadersInit | undefined {
  const headers: Record<string, string> = {};
  if (hasJsonBody) headers['Content-Type'] = 'application/json';
  const token = getAccessToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return Object.keys(headers).length > 0 ? headers : undefined;
}

async function doFetch(path: string, options: RequestOptions): Promise<Response> {
  const url = buildUrl(path, options.searchParams);
  const isFormData = options.body instanceof FormData;

  return fetch(url, {
    method: options.method ?? 'GET',
    // для FormData браузер сам проставит Content-Type с корректным boundary
    headers: buildHeaders(Boolean(options.body) && !isFormData),
    body: isFormData ? (options.body as FormData) : options.body ? JSON.stringify(options.body) : undefined,
    // refresh token уходит только через HttpOnly cookie (ADMIN-AUTH-SPEC.md §4) —
    // credentials нужны, даже если фронт и бэк на одном origin
    credentials: 'include',
    // Кэширование данных Next: включаем только на сервере и только там, где
    // страница явно попросила (см. RequestOptions.revalidate).
    ...(IS_SERVER && options.revalidate !== undefined
      ? { next: { revalidate: options.revalidate } }
      : {}),
  });
}

// Эндпоинты авторизации сами не должны провоцировать retry-через-refresh —
// иначе неверный логин/просроченный refresh зациклится сам на себя.
function isAuthEndpoint(path: string): boolean {
  return path.startsWith('/api/admin/auth/');
}

let refreshPromise: Promise<AuthResponse | null> | null = null;

/**
 * Единственная точка входа в /refresh во всём приложении. Параллельные вызовы
 * разделяют один запрос — иначе два одновременных /refresh уйдут с одной и той же
 * cookie, бэкенд отротирует токен на первом и увидит второй как переиспользование
 * уже отозванного, а на это он отзывает ВСЕ сессии админа (AdminAuthService,
 * missingOrReused; ADMIN-AUTH-SPEC.md §5, п.6 — спека прямо называет гонку
 * параллельных /refresh ожидаемым источником такого исхода).
 *
 * Возвращает AuthResponse или null: null означает, что живой сессии нет и повторять
 * запрос бессмысленно.
 */
export function refreshSession(): Promise<AuthResponse | null> {
  if (!refreshPromise) {
    refreshPromise = doFetch('/api/admin/auth/refresh', { method: 'POST' })
      .then(async (response) => {
        if (!response.ok) {
          setAccessToken(null);
          return null;
        }
        const data: AuthResponse = await response.json();
        setAccessToken(data.accessToken);
        return data;
      })
      .catch(() => {
        setAccessToken(null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function parseError(response: Response): Promise<ApiError> {
  let errorBody: ErrorResponse;
  try {
    errorBody = await response.json();
  } catch {
    errorBody = { message: `Ошибка запроса (${response.status})`, errors: null };
  }
  return new ApiError(response.status, errorBody);
}

async function request(path: string, options: RequestOptions): Promise<Response> {
  let response = await doFetch(path, options);

  if (response.status === 401 && path.startsWith('/api/admin/') && !isAuthEndpoint(path)) {
    const refreshed = await refreshSession();
    if (refreshed) {
      response = await doFetch(path, options);
    }
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  return response;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await request(path, options);

  if (response.status === 204) {
    return undefined as T;
  }

  // Некоторые эндпоинты (напр. /change-password) отвечают 200 с пустым телом —
  // response.json() на пустой строке кидает SyntaxError, поэтому читаем текст сами.
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export interface DownloadedFile {
  blob: Blob;
  filename: string | null;
}

/**
 * Для эндпоинтов, отвечающих файлом: тело читается как Blob, а не как JSON.
 * Ошибка при этом остаётся обычным ApiError — бэкенд отдаёт её JSON-ом.
 */
export async function apiRequestFile(path: string, options: RequestOptions = {}): Promise<DownloadedFile> {
  const response = await request(path, options);
  return { blob: await response.blob(), filename: parseFilename(response) };
}

function parseFilename(response: Response): string | null {
  const header = response.headers.get('Content-Disposition');
  if (!header) return null;

  // Кириллица в имени приезжает только в filename*=UTF-8''…
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1]);
    } catch {
      // битая процентная последовательность — падать из-за имени файла незачем
    }
  }
  const plain = /filename="([^"]*)"/i.exec(header);
  return plain ? plain[1] : null;
}
