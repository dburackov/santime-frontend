import { createContext } from 'react';

export interface AuthContextValue {
  isAuthenticated: boolean;
  isInitializing: boolean;
  mustChangePassword: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  markPasswordChanged: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
