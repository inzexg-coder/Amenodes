import { ru } from './locales/ru.js';
import { en } from './locales/en.js';

const LOCALES = {
  ru: { name: 'Русский', nativeName: 'Русский', translations: ru },
  en: { name: 'English', nativeName: 'English', translations: en }
};

class LanguageManager {
  constructor() {
    this.currentLanguage = this.getSavedLanguage();
    this.listeners = [];
    this.translations = LOCALES[this.currentLanguage]?.translations || ru;
  }

  getSavedLanguage() {
    const saved = localStorage.getItem('amenodes_language');
    if (saved && LOCALES[saved]) return saved;
    const browserLang = navigator.language.split('-')[0];
    if (LOCALES[browserLang]) return browserLang;
    return 'en';
  }

  setLanguage(lang) {
    if (!LOCALES[lang]) return false;
    this.currentLanguage = lang;
    this.translations = LOCALES[lang].translations;
    localStorage.setItem('amenodes_language', lang);
    this.notifyListeners();
    return true;
  }

  getCurrentLanguage() {
    return this.currentLanguage;
  }

  getAvailableLanguages() {
    return Object.entries(LOCALES).map(([code, info]) => ({
      code,
      name: info.name,
      nativeName: info.nativeName
    }));
  }

  t(key, params = {}) {
    const keys = key.split('.');
    let value = this.translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation missing: ${key}`);
        return key;
      }
    }
    
    if (typeof value === 'string') {
      return value.replace(/\{(\w+)\}/g, (_, param) => params[param] || `{${param}}`);
    }
    
    return key;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) this.listeners.splice(index, 1);
    };
  }

  notifyListeners() {
    for (const listener of this.listeners) {
      listener(this.currentLanguage, this.translations);
    }
  }

  translateNodeTitle(nodeType, defaultTitle) {
    const nodeKey = this.t(`nodes.${nodeType}`);
    if (nodeKey !== `nodes.${nodeType}`) return nodeKey;
    return defaultTitle;
  }
}

export const i18n = new LanguageManager();
export function t(key, params = {}) {
  return i18n.t(key, params);
}
