export function throttle(func, delay) {
  let lastCall = 0;
  let timeout = null;
  
  return function(...args) {
    const now = Date.now();
    
    if (now - lastCall >= delay) {
      lastCall = now;
      func.apply(this, args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        lastCall = Date.now();
        func.apply(this, args);
        timeout = null;
      }, delay - (now - lastCall));
    }
  };
}

export function rafThrottle(func) {
  let rafId = null;
  
  return function(...args) {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      func.apply(this, args);
      rafId = null;
    });
  };
}
