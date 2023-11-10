import type { Theme } from '~types/types';

export const SETTINGS = 'devtools-settings';
export const DEVTOOLS_THEME = 'devtools-theme';
export const DEVTOOLS_FONT = 'devtools-font';
export const DEVTOOLS_SIZE = 'devtools-size';
export const DEVTOOLS_CURRENT = 'devtools-current';
export const DEVTOOLS_ACCENT_COLOR = 'devtools-accent-color';
export const DEVTOOLS_SCROLLBARS = 'devtools-scrollbars';

const chromeStorage = chrome.storage && chrome.storage.sync;

export type DevtoolsSettings = {
  [DEVTOOLS_THEME]?: string;
  [DEVTOOLS_FONT]?: string;
  [DEVTOOLS_SIZE]?: number;
  [DEVTOOLS_CURRENT]?: Theme;
  [DEVTOOLS_ACCENT_COLOR]?: string;
  [DEVTOOLS_SCROLLBARS]?: boolean;
};

const fakeStorage = {
  async get(property: string, fn = (object: DevtoolsSettings) => {}) {
    let item = await localStorage.getItem(SETTINGS);
    try {
      const settings = item ? JSON.parse(item) : {};
      fn(settings);
    } catch (e) {
      fn({});
    }
  },

  set(settings: DevtoolsSettings, fn = (object: DevtoolsSettings) => {}) {
    let oldItem = localStorage.getItem(SETTINGS) || '{}';
    try {
      const oldSettings = JSON.parse(oldItem);
      const newSettings = { ...oldSettings, ...settings };

      if (chromeStorage) {
        chromeStorage.set({ [SETTINGS]: JSON.stringify(newSettings) }, () => {});
      }
      localStorage.setItem(SETTINGS, JSON.stringify(newSettings));
      fn(settings);
    } catch (e) {
      fn({});
    }
  },
};

// export const storage = chrome.storage.sync;
export const storage = fakeStorage;
