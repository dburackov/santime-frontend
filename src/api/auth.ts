import { apiRequest } from './client';
import type {
  AuthResponse,
  ChangePasswordRequest,
  CreateAdminRequest,
  CreateAdminResponse,
  LoginRequest,
} from './types';

export function login(body: LoginRequest): Promise<AuthResponse> {
  return apiRequest('/api/admin/auth/login', { method: 'POST', body });
}

export function refresh(): Promise<AuthResponse> {
  return apiRequest('/api/admin/auth/refresh', { method: 'POST' });
}

export function logout(): Promise<void> {
  return apiRequest('/api/admin/auth/logout', { method: 'POST' });
}

export function changePassword(body: ChangePasswordRequest): Promise<void> {
  return apiRequest('/api/admin/auth/change-password', { method: 'POST', body });
}

export function createAdmin(body: CreateAdminRequest): Promise<CreateAdminResponse> {
  return apiRequest('/api/admin/admins', { method: 'POST', body });
}
