import { createContext } from 'react';

export type Theme = 'light' | 'dark';

export interface ThemeContextValue {
  theme: Theme;
  isSystemTheme: boolean;
  setTheme: (theme: Theme) => void;
  resetToSystem: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
