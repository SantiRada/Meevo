export type ThemeMode = 'Light' | 'Dark';

export const DEFAULT_THEME_COLORS = {
  Dark: {
    '--color-canvas-bg': '#0e0e0e',
    '--color-grid': '#222222',
    '--color-purple': '#7315E6',
    '--color-purple-active': '#6111c2',
    '--color-selector-green': 'rgba(34, 197, 94, 0.1)',
    '--color-surface-0': '#0A0A0A',
    '--color-surface-1': '#15151A',
    '--color-surface-2': '#1E1E24',
    '--color-surface-3': '#272730',
    '--color-surface-4': '#32323D',
    '--color-surface-5': '#3E3E4A',
    '--color-surface-6': '#0A0A0A',
    '--color-border': '#32323D',
    '--color-text-primary': '#FFFFFF',
    '--color-text-secondary': '#CCCCCC',
    '--color-text-tertiary': '#777777',
    '--color-text-inverse': '#0A0A0A'
  },
  Light: {
    '--color-canvas-bg': '#d6d6d6',
    '--color-grid': '#d6d6d6',
    '--color-purple': '#7315E6',
    '--color-purple-active': '#6111c2',
    '--color-selector-green': 'rgba(34, 197, 94, 0.1)',
    '--color-surface-0': '#e7e7e7',
    '--color-surface-1': '#EEEEEE',
    '--color-surface-2': '#D7D7D7',
    '--color-surface-3': '#FAFAFA',
    '--color-surface-4': '#ECECEC',
    '--color-surface-5': '#FFFFFF',
    '--color-surface-6': '#FFFFFF',
    '--color-border': '#b1b1b1',
    '--color-text-primary': '#09090B',
    '--color-text-secondary': '#2a2a2e',
    '--color-text-tertiary': '#A1A1AA',
    '--color-text-inverse': '#FFFFFF'
  }
};

export const applyThemeColors = (mode: ThemeMode, customOverrides?: Record<string, string>) => {
  const defaults = DEFAULT_THEME_COLORS[mode];
  const root = document.documentElement;

  // Set default values first
  Object.entries(defaults).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  // Apply custom overrides
  if (customOverrides) {
    Object.entries(customOverrides).forEach(([key, value]) => {
      if (value) {
        root.style.setProperty(key, value);
      }
    });
  }
  
  // Manage standard class
  if (mode === 'Light') {
    root.classList.add('light');
    root.classList.remove('dark');
  } else {
    root.classList.add('dark');
    root.classList.remove('light');
  }
};

export const getCustomThemeColors = (): Record<ThemeMode, Record<string, string>> => {
  try {
    const saved = localStorage.getItem('meevo-custom-colors');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to parse custom colors', e);
  }
  return { Light: {}, Dark: {} };
};

export const saveCustomThemeColors = (colors: Record<ThemeMode, Record<string, string>>) => {
  localStorage.setItem('meevo-custom-colors', JSON.stringify(colors));
};
