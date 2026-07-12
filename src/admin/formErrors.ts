import { ApiError } from '@/api/client';

export function fieldError(error: unknown, field: string): string | undefined {
  if (error instanceof ApiError) return error.errors?.[field];
  return undefined;
}

export function formError(error: unknown): string | undefined {
  if (error instanceof ApiError) return error.message;
  if (error) return 'Что-то пошло не так.';
  return undefined;
}
