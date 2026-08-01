import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import type { Theme } from '../contexts/ThemeContext';

export interface ThemeProviderProps {
  children?: ReactNode;
  /** Initial theme. Uncontrolled — use `useTheme().setTheme` to change it after mount. */
  defaultTheme?: Theme;
  /** Element `data-theme` is applied to. Defaults to `document.documentElement` (`:root`). */
  target?: Element;
}

export function ThemeProvider({ children, defaultTheme = 'light', target }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const element = target ?? document.documentElement;
    element.setAttribute('data-theme', theme);
    return () => {
      element.removeAttribute('data-theme');
    };
  }, [theme, target]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
