// =========================================================
//  ThemeContext — gestion dark / light mode
//  Persisté dans localStorage. Appliqué via data-theme sur <html>.
// =========================================================
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme:  Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme:  'dark',
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    return (localStorage.getItem('ambiense-theme') as Theme) ?? 'dark';
  });

  // Applique l'attribut sur <html> à chaque changement
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ambiense-theme', theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
