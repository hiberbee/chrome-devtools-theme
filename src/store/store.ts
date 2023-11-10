import { writable } from 'svelte/store';
import {
  DEVTOOLS_ACCENT_COLOR,
  DEVTOOLS_CURRENT,
  DEVTOOLS_FONT,
  DEVTOOLS_SCROLLBARS,
  DEVTOOLS_SIZE,
  DEVTOOLS_THEME,
  SETTINGS,
  storage,
  type DevtoolsSettings,
} from '~store/storage';
import type { Theme, Nullable, AppSettings, RawTheme } from '~types/types';

export class Store {
  private _currentTheme: Nullable<Theme> = null;
  private _currentThemeName: Nullable<string> = null;
  private _currentFontSize: Nullable<number> = null;
  private _currentFontFamily: Nullable<string> = null;
  private _currentAccentColor: Nullable<string> = null;
  private _scrollbars: boolean = true;

  /**
   * Loaded themes
   * @type {Theme[]}
   */
  themes: Theme[] = [];

  /**
   * Loading state
   * @type {boolean}
   */
  loading: boolean = true;

  /**
   * Notifying state
   * @type {boolean}
   */
  notifying: boolean = false;

  defaults: AppSettings = {
    fontSize: 11,
    fontFamily: 'Menlo',
    accentColor: '#80cbc4',
    scrollbars: true,
  };

  constructor(data: Partial<Store> = {}, currentTheme = null) {
    // Import data
    Object.assign(this, data);
    if (currentTheme) {
      this._currentTheme = currentTheme;
    }
  }

  loadDefaults() {
    if (!this.currentTheme) {
      this.currentTheme = this.themes[0];
    }
    if (!this.currentFontFamily) {
      this.currentFontFamily = this.defaults.fontFamily;
    }
    if (!this.currentFontSize) {
      this.currentFontSize = this.defaults.fontSize;
    }
  }

  /**
   * Returns the current theme
   * @returns {?Theme}
   */
  get currentTheme(): Nullable<Theme> {
    return this._currentTheme;
  }

  /**
   * Sets the current theme
   * @param {Theme} value
   */
  set currentTheme(value: Theme) {
    if (value) {
      // Simulate changing colors
      this._currentTheme = {
        ...value,
        colors: undefined,
      };

      this.saveCurrent(value);

      app.update(($app) => new Store({ ...$app }, value));
    }
  }

  /**
   * Retrieve the current theme
   * @returns {null}
   */
  get currentThemeName(): Nullable<string> {
    return this._currentThemeName;
  }

  /**
   * Change the current theme name and current theme
   * @param name
   */
  set currentThemeName(name: string) {
    this._notify(this._currentTheme, name);
    this._currentThemeName = name;
    this.saveTheme(name);

    // Find and set current theme
    this.currentTheme = this.getTheme(name);
  }

  /**
   * Returns the current font size
   * @returns {?number}
   */
  get currentFontSize(): Nullable<number> {
    return this._currentFontSize;
  }

  /**
   * Sets the current font size
   * @param {number} value
   */
  set currentFontSize(value: number) {
    this._notify(this._currentFontSize, value);
    this._currentFontSize = value;
    this.saveFontSize(value);
  }

  /**
   * Returns the current font family
   * @returns {?string}
   */
  get currentFontFamily(): Nullable<string> {
    return this._currentFontFamily;
  }

  /**
   * Sets the current font family
   * @param {string} value
   */
  set currentFontFamily(value: string) {
    this._notify(this._currentFontFamily, value);
    this._currentFontFamily = value;
    this.saveFontFamily(value);
  }

  /**
   * Returns the current font family
   * @returns {?string}
   */
  get currentAccentColor(): Nullable<string> {
    return this._currentAccentColor;
  }

  /**
   * Sets the current accent
   * @param {string} value
   */
  set currentAccentColor(value: string) {
    this._notify(this._currentAccentColor, value);
    this._currentAccentColor = value;
    this.saveAccentColor(value);
  }

  /**
   * Scrollbars enabled ?
   * @returns {boolean}
   */
  get scrollbars(): boolean {
    return this._scrollbars;
  }

  /**
   * Sets the scrollbars state
   * @param value
   */
  set scrollbars(value: boolean) {
    this._notify(this._scrollbars, value);
    this._scrollbars = value;
    this.saveScrollbars(value);
  }

  /**
   * Load Themes
   * @param themes
   */
  loadThemes(themes: RawTheme[]) {
    this.themes = themes.map((theme) => {
      return {
        name: theme.name,
        className: theme.className,
        description: theme.description,
        dark: theme.dark,
        colors: theme,
        accent: theme.accent,
      };
    });
  }

  /**
   * Find a theme by name
   * @param {string} name
   * @returns {?Theme}
   */
  getTheme(name: string = ''): Nullable<Theme> {
    return this.themes.find((theme) => theme.name === name);
  }

  /**
   * Save selected theme
   * @param {string} name
   */
  saveTheme(name: string) {
    storage.set({ [DEVTOOLS_THEME]: name }, () => {
      if (chrome && chrome.action) {
        chrome.action.setIcon({
          path: `/public/icons/${name}.svg`,
        });
        chrome.action.setTitle({
          title: `Material Theme Devtools - ${name}`,
        });
      }
    });
  }

  /**
   * Save selected font family
   * @param {string} family
   */
  saveFontFamily(family: string) {
    storage.set({ [DEVTOOLS_FONT]: family }, () => {});
  }

  /**
   * Save selected font size
   * @param {number} size
   */
  saveFontSize(size: number) {
    storage.set({ [DEVTOOLS_SIZE]: size }, () => {});
  }

  /**
   * Save current theme
   * @param theme
   */
  saveCurrent(theme: Theme) {
    storage.set({ [DEVTOOLS_CURRENT]: theme }, () => {});
  }

  /**
   * Save current accent color
   * @param color {string}
   */
  saveAccentColor(color: string) {
    storage.set({ [DEVTOOLS_ACCENT_COLOR]: color }, () => {});
  }

  /**
   * Save current accent color
   * @param state {boolean}
   */
  saveScrollbars(state: boolean) {
    storage.set({ [DEVTOOLS_SCROLLBARS]: state }, () => {});
  }

  /**
   * Fetch settings
   */
  fetchSettings() {
    /** Get current theme setting from storage */
    return storage.get(SETTINGS, (object: DevtoolsSettings) => {
      this._currentThemeName = object[DEVTOOLS_THEME] || this.defaults.themeName;
      this._currentFontFamily = object[DEVTOOLS_FONT] || this.defaults.fontFamily;
      this._currentFontSize = object[DEVTOOLS_SIZE] || this.defaults.fontSize;
      this._currentAccentColor = object[DEVTOOLS_ACCENT_COLOR] || null;
      this._scrollbars = object[DEVTOOLS_SCROLLBARS] ?? true;
      this.currentTheme = this.getTheme(this._currentThemeName || 'Material Oceanic');
    });
  }

  /**
   * Reset accent color
   */
  resetAccent() {
    this.currentAccentColor = null;
  }

  /**
   * Trigger a notification by setting a notify flag if the value changes
   * @param oldValue
   * @param newValue
   * @private
   */
  _notify(oldValue: unknown, newValue: unknown) {
    if (oldValue && oldValue !== newValue) {
      this.notifying = true;
      setTimeout(this._clearNotify, 5000);
    }
  }

  /**
   * Clear the notification state by unsetting a flag
   * @param _
   * @private
   */
  _clearNotify(_: never) {
    return app.update((app) => new Store({ ...app, notifying: false }));
  }
}

export const app = writable(new Store());
