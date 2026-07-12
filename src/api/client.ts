import type { ErrorResponse } from './types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

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

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  searchParams?: Record<string, string | number | boolean | undefined | null>;
}

function buildUrl(path: string, searchParams?: RequestOptions['searchParams']): string {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = buildUrl(path, options.searchParams);

  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let errorBody: ErrorResponse;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = { message: `Ошибка запроса (${response.status})`, errors: null };
    }
    throw new ApiError(response.status, errorBody);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
