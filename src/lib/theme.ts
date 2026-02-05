const THEME_KEY = 'theme';
export type ThemeMode = 'light' | 'dark' | 'system';

export function getStoredTheme(): ThemeMode | null {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {}
  return null;
}

export function getPreferredScheme(): 'light' | 'dark' {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function resolveTheme(mode: ThemeMode | null): 'light' | 'dark' {
  if (!mode || mode === 'system') return getPreferredScheme();
  return mode;
}

export function applyTheme(mode: ThemeMode | null) {
  const theme = resolveTheme(mode);
  const html = document.documentElement;
  if (theme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
}

export function setTheme(mode: ThemeMode) {
  try { localStorage.setItem(THEME_KEY, mode); } catch {}
  applyTheme(mode);
}

export function toggleTheme() {
  const current = resolveTheme(getStoredTheme());
  const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}
