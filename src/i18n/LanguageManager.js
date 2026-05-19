import { en } from './locales/en.js';
import { ru } from './locales/ru.js';

const BASE_LOCALES = {
  ru: { name: 'Русский', nativeName: 'Русский', translations: ru },
  en: { name: 'English', nativeName: 'English', translations: en }
};

class LanguageManager {
  constructor() {
    this.currentLanguage = this.getSavedLanguage();
    this.listeners = [];
    this.nodeTranslations = { en: {}, ru: {} };
    this.translations = {};
    this.updateTranslations();
  }
  
  setNodeTranslations(translations) {
    this.nodeTranslations = translations;
    this.updateTranslations();
    this.notifyListeners();
  }

  updateTranslations() {
    const base = BASE_LOCALES[this.currentLanguage]?.translations || {};
    const nodes = this.nodeTranslations[this.currentLanguage] || {};
    this.translations = this.mergeDeep(base, nodes);
  }

  mergeDeep(target, source) {
    const result = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.mergeDeep(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  getSavedLanguage() {
    const saved = localStorage.getItem('amenodes_language');
    if (saved && BASE_LOCALES[saved]) return saved;
    const browserLang = navigator.language.split('-')[0];
    if (BASE_LOCALES[browserLang]) return browserLang;
    return 'en';
  }

  setLanguage(lang) {
    if (!BASE_LOCALES[lang]) return false;
    this.currentLanguage = lang;
    window._currentLanguage = lang;
    this.updateTranslations();
    localStorage.setItem('amenodes_language', lang);
    this.notifyListeners();
    return true;
  }

  getCurrentLanguage() {
    return this.currentLanguage;
  }

  getAvailableLanguages() {
    return Object.entries(BASE_LOCALES).map(([code, info]) => ({
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
        return key;
      }
    }
    
    if (typeof value === 'string') {
      return value.replace(/\{(\w+)\}/g, (_, param) => params[param] ?? `{${param}}`);
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
}

export const i18n = new LanguageManager();
window._currentLanguage = i18n.getCurrentLanguage();

export function t(key, params = {}) {
  return i18n.t(key, params);
}
