export class TextCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 1000;
  }
  
  get(key, computeFn) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    const value = computeFn();
    
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, value);
    return value;
  }
  
  invalidate(key) {
    this.cache.delete(key);
  }
  
  invalidateAll() {
    this.cache.clear();
  }
}

class CalcNode extends Node {
  formatResult(values) {
    const cacheKey = `${this.calcType}_${JSON.stringify(values)}`;
    
    return textCache.get(cacheKey, () => {
      if (!values || values.length === 0) return "--";
      return `[${values.map(v => v.toFixed(6)).join(', ')}]`;
    });
  }
}
