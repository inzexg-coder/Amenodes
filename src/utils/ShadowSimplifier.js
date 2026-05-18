export class ShadowSimplifier {
  constructor() {
    this.isDragging = false;
    this.originalStyles = new Map();
  }
  
  startDrag(element) {
    if (this.isDragging) return;
    this.isDragging = true;
    
    this.originalStyles.set(element, {
      boxShadow: element.style.boxShadow,
      transition: element.style.transition
    });
    
    element.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    element.style.transition = 'none';

    document.querySelectorAll('.node').forEach(node => {
      if (!this.originalStyles.has(node)) {
        this.originalStyles.set(node, {
          boxShadow: node.style.boxShadow,
          transition: node.style.transition
        });
        node.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        node.style.transition = 'none';
      }
    });
  }
  
  endDrag() {
    if (!this.isDragging) return;
    
    for (const [element, styles] of this.originalStyles) {
      element.style.boxShadow = styles.boxShadow;
      element.style.transition = styles.transition;
    }
    
    this.originalStyles.clear();
    this.isDragging = false;
  }
}
