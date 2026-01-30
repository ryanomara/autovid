import type { Theme, Color } from '../../types/index.js';

export const defaultTheme: Theme = {
  name: 'default',
  colors: {
    primary: { r: 59, g: 130, b: 246, a: 1 },
    secondary: { r: 147, g: 51, b: 234, a: 1 },
    accent: { r: 236, g: 72, b: 153, a: 1 },
    background: { r: 15, g: 23, b: 42, a: 1 },
    text: { r: 248, g: 250, b: 252, a: 1 },
  },
  fonts: {
    heading: 'Arial',
    body: 'Arial',
    mono: 'Courier',
  },
  spacing: {
    padding: 40,
    margin: 20,
  },
};

export const corporateTheme: Theme = {
  name: 'corporate',
  colors: {
    primary: { r: 0, g: 51, b: 102, a: 1 },
    secondary: { r: 0, g: 102, b: 204, a: 1 },
    accent: { r: 255, g: 153, b: 0, a: 1 },
    background: { r: 245, g: 245, b: 250, a: 1 },
    text: { r: 33, g: 33, b: 33, a: 1 },
  },
  fonts: {
    heading: 'Arial',
    body: 'Arial',
  },
  spacing: {
    padding: 60,
    margin: 30,
  },
};

export const modernTheme: Theme = {
  name: 'modern',
  colors: {
    primary: { r: 0, g: 0, b: 0, a: 1 },
    secondary: { r: 100, g: 100, b: 100, a: 1 },
    accent: { r: 255, g: 0, b: 255, a: 1 },
    background: { r: 255, g: 255, b: 255, a: 1 },
    text: { r: 0, g: 0, b: 0, a: 1 },
  },
  fonts: {
    heading: 'Arial',
    body: 'Arial',
  },
  spacing: {
    padding: 80,
    margin: 40,
  },
};

export const themes: Record<string, Theme> = {
  default: defaultTheme,
  corporate: corporateTheme,
  modern: modernTheme,
};

export function getTheme(name: string): Theme {
  return themes[name] || defaultTheme;
}

export function applyThemeToColor(themeColor: keyof Theme['colors'], theme: Theme): Color {
  return theme.colors[themeColor];
}

export function createCustomTheme(
  name: string,
  overrides: Partial<Theme>
): Theme {
  return {
    ...defaultTheme,
    ...overrides,
    name,
  };
}
