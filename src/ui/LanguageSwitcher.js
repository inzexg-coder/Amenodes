import { i18n, t } from '../i18n/LanguageManager.js';

export class LanguageSwitcher {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.button = null;
    this.menu = null;
    this.init();
  }

  init() {
    if (!this.container) return;

    this.button = document.createElement('button');
    this.button.id = 'languageBtn';
    this.button.className = 'language-btn';
    this.button.innerHTML = `<i class="fas fa-globe"></i> ${i18n.getCurrentLanguage().toUpperCase()}`;
    this.button.onclick = (e) => {
      e.stopPropagation();
      this.toggleMenu();
    };

    this.container.appendChild(this.button);

    i18n.subscribe((lang) => {
      this.button.innerHTML = `<i class="fas fa-globe"></i> ${lang.toUpperCase()}`;
      this.closeMenu();
    });

    document.addEventListener('click', (e) => {
      if (this.menu && !this.menu.contains(e.target) && e.target !== this.button) {
        this.closeMenu();
      }
    });
  }

  toggleMenu() {
    if (this.menu) {
      this.closeMenu();
    } else {
      this.createMenu();
    }
  }

  createMenu() {
    this.closeMenu();

    this.menu = document.createElement('div');
    this.menu.className = 'language-menu';

    const languages = i18n.getAvailableLanguages();

    for (const lang of languages) {
      const item = document.createElement('div');
      item.className = 'language-menu-item';
      if (lang.code === i18n.getCurrentLanguage()) {
        item.classList.add('active');
      }
      item.innerHTML = `${lang.nativeName} (${lang.name})`;
      item.onclick = () => {
        i18n.setLanguage(lang.code);
        this.closeMenu();
      };
      this.menu.appendChild(item);
    }

    document.body.appendChild(this.menu);

    const rect = this.button.getBoundingClientRect();
    this.menu.style.position = 'fixed';
    this.menu.style.top = `${rect.bottom + 5}px`;
    this.menu.style.left = `${rect.left}px`;
  }

  closeMenu() {
    if (this.menu) {
      this.menu.remove();
      this.menu = null;
    }
  }
}
