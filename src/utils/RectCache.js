export class RectCache {
  constructor() {
    this.cache = new Map();
    this.observer = null;
    this.isEnabled = false;
  }
  
  enable() {
    if (this.isEnabled) return;
    this.isEnabled = true;
    
    this.observer = new MutationObserver(() => this.invalidateAll());
    this.observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true
    });
  }
  
  get(element) {
    if (!this.isEnabled || !element) {
      return element?.getBoundingClientRect();
    }
    
    if (!this.cache.has(element)) {
      this.cache.set(element, element.getBoundingClientRect());
    }
    
    return this.cache.get(element);
  }
  
  invalidate(element) {
    this.cache.delete(element);
  }
  
  invalidateAll() {
    this.cache.clear();
  }
  
  disable() {
    this.isEnabled = false;
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.cache.clear();
  }
}
