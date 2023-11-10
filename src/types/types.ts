export type Nullable<T> = T | null;

export type Colors = {
  background: string;
  foreground: string;
  text: string;
  selectBg: string;
  selectFg: string;
  selectFg2?: string;
  button: string;
  disabled: string;
  contrast: string;
  second: string;
  table: string;
  border: string;
  hl: string;
  tree: string;
  notif: string;
  accent: string;
  excluded: string;
  comments: string;
  vars: string;
  links: string;
  functions: string;
  keywords: string;
  tags: string;
  strings: string;
  operators: string;
  attributes: string;
  numbers: string;
  parameters: string;
  green: string;
  red: string;
  yellow: string;
  blue: string;
  purple: string;
  orange: string;
  cyan: string;
  white: string;
  gray: string;
  error: string;
};

export type Theme = {
  name: string;
  className: string;
  description: string;
  dark: boolean;
  colors: Colors;
};

export type RawTheme = Omit<Theme, 'colors'> & Colors;

export type AppSettings = {
  themeName?: string;
  fontSize?: number;
  fontFamily?: string;
  accentColor?: string;
  scrollbars?: boolean;
};
