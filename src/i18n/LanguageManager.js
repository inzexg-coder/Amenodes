import { ru } from './locales/ru.js';
import { en } from './locales/en.js';

var LOCALES = {
  ru: { name: 'Русский', nativeName: 'Русский', translations: ru },
  en: { name: 'English', nativeName: 'English', translations: en }
};

var LanguageManager = function() {
  this.currentLanguage = this.getSavedLanguage();
  this.listeners = [];
  this.translations = LOCALES[this.currentLanguage]?.translations || ru;
};

LanguageManager.prototype.getSavedLanguage = function() {
  var saved = localStorage.getItem('amenodes_language');
  if (saved && LOCALES[saved]) return saved;
  var browserLang = navigator.language.split('-')[0];
  if (LOCALES[browserLang]) return browserLang;
  return 'en';
};

LanguageManager.prototype.setLanguage = function(lang) {
  if (!LOCALES[lang]) return false;
  this.currentLanguage = lang;
  this.translations = LOCALES[lang].translations;
  localStorage.setItem('amenodes_language', lang);
  this.notifyListeners();
  return true;
};

LanguageManager.prototype.getCurrentLanguage = function() {
  return this.currentLanguage;
};

LanguageManager.prototype.getAvailableLanguages = function() {
  var result = [];
  for (var code in LOCALES) {
    result.push({
      code: code,
      name: LOCALES[code].name,
      nativeName: LOCALES[code].nativeName
    });
  }
  return result;
};

LanguageManager.prototype.t = function(key, params) {
  params = params || {};
  var keys = key.split('.');
  var value = this.translations;
  
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      console.warn('Translation missing: ' + key);
      return key;
    }
  }
  
  if (typeof value === 'string') {
    return value.replace(/\{(\w+)\}/g, function(_, param) {
      return params[param] || '{' + param + '}';
    });
  }
  
  return key;
};

LanguageManager.prototype.translate = function(key, params) {
  return this.t(key, params);
};

LanguageManager.prototype.subscribe = function(listener) {
  this.listeners.push(listener);
  var self = this;
  return function() {
    var index = self.listeners.indexOf(listener);
    if (index !== -1) self.listeners.splice(index, 1);
  };
};

LanguageManager.prototype.notifyListeners = function() {
  for (var i = 0; i < this.listeners.length; i++) {
    this.listeners[i](this.currentLanguage, this.translations);
  }
};

LanguageManager.prototype.translateNodeTitle = function(nodeType, currentTitle, originalTitle) {
  var translated = this.t('nodes.' + nodeType);
  if (translated !== 'nodes.' + nodeType && currentTitle === originalTitle) {
    return translated;
  }
  return currentTitle;
};

export var i18n = new LanguageManager();

export function t(key, params) {
  return i18n.t(key, params);
}
