import { useState, useEffect } from 'react';

type Theme = 'red' | 'blue';

const STORAGE_KEY = 'pkmn-theme';

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'red' || stored === 'blue') return stored;
  } catch {}
  return 'red';
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'red' ? 'blue' : 'red'));
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  return { theme, toggleTheme, setTheme };
}
