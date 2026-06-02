export function createParticleBurst(x, y) {
  const quality = document.body.classList.contains('design-quality-extreme') ? 'extreme' :
                  document.body.classList.contains('design-quality-1') ? 'low' : 'high';
  
  if (quality === 'extreme') return;
  
  const particleCount = quality === 'high' ? 24 : 12;
  const container = document.createElement('div');
  container.className = 'particle-burst';
  container.style.position = 'fixed';
  container.style.left = `${x}px`;
  container.style.top = `${y}px`;
  container.style.width = '0';
  container.style.height = '0';
  document.body.appendChild(container);
  
  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount;
    const velocity = 50 + Math.random() * 80;
    const dx = Math.cos(angle) * velocity;
    const dy = Math.sin(angle) * velocity;
    
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.setProperty('--dx', `${dx}px`);
    particle.style.setProperty('--dy', `${dy}px`);
    container.appendChild(particle);
  }
  
  setTimeout(() => container.remove(), 600);
}

export function flashNode(nodeElement) {
  if (!nodeElement) return;
  nodeElement.classList.add('node-updated');
  setTimeout(() => nodeElement.classList.remove('node-updated'), 300);
}
