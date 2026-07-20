// Access token живёт только здесь, в памяти вкладки — никогда в localStorage
// (ADMIN-AUTH-SPEC.md §4/§9). Обычный модуль, а не React state: apiRequest в
// src/api/client.ts должен читать/писать токен синхронно, без завязки на React.

type Listener = () => void;

let accessToken: string | null = null;
const listeners = new Set<Listener>();

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  listeners.forEach((listener) => listener());
}

export function subscribeAccessToken(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
