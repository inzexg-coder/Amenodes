# `Viewport`
`Viewport` – класс, управляющий камерой и панорамированием бесконечного холста.
Реализует перемещение вида зажатием правой кнопки мыши и поддерживает масштабирование (зум), которое синхронизируется с отрисовщиком.
Класс не зависит от остальных модулей и может использоваться как самостоятельный компонент для любого канвас-интерфейса.

**Путь в проекте:** `src/renderer/Viewport.js`

**Импорт:**
```javascript
import { Viewport } from './renderer/Viewport.js';
```
## Конструктор

```javascript
const viewport = new Viewport(container, canvasContainer);
```

**Параметры:**
- `container: HTMLElement` – элемент-контейнер, на котором отслеживаются события мыши (обычно `#viewport`)
- `canvasContainer: HTMLElement` – трансформируемый элемент, к которому применяется сдвиг и масштаб (обычно `#canvasContainer`)

**Внутренние свойства:**
- `container: HTMLElement` – целевой контейнер для событий
- `canvasContainer: HTMLElement` – элемент, к которому применяются CSS-трансформации
- `x: number` – смещение камеры по горизонтали (пиксели)
- `y: number` – смещение камеры по вертикали (пиксели)
- `isDragging: boolean` – флаг активного перетаскивания (правой кнопкой)
- `startX: number` – стартовая позиция мыши при drag (clientX)
- `startY: number` – стартовая позиция мыши при drag (clientY)
- `originX: number` – исходное смещение камеры перед началом drag
- `originY: number` – исходное смещение камеры перед началом drag
- `onChangeCallback: Function|null` – функция, вызываемая при любом изменении позиции или масштаба

## Публичные методы

### `attach()`

Подписывает обработчики событий на контейнер и глобальный объект `window`. Должен быть вызван после создания экземпляра.

```javascript
const viewport = new Viewport(container, canvasContainer);
viewport.attach();
```

**Что подписывается:**
- `container.addEventListener('mousedown', this.onMouseDown.bind(this))`
- `window.addEventListener('mousemove', this.onMouseMove.bind(this))`
- `window.addEventListener('mouseup', this.onMouseUp.bind(this))`
- `container.addEventListener('contextmenu', e => e.preventDefault())` – отключает стандартное контекстное меню браузера на холсте

### `update()`

Применяет текущие значения `x`, `y` и глобального зума к `canvasContainer` через CSS-трансформацию.

```javascript
viewport.update();
// Эквивалентно:
// canvasContainer.style.transform = `translate(${x}px, ${y}px) scale(${zoom})`
```

**Формат трансформации:** `translate(Xpx, Ypx) scale(Z)` – использует `transform` без 3D для совместимости.

### `getOffset()`

Возвращает текущее смещение камеры.

```javascript
const offset = viewport.getOffset();
console.log(offset.x, offset.y); // -245, 130
```

**Возвращает:** `{ x: number, y: number }`

### `setOffset(x, y)`

Устанавливает смещение камеры в абсолютных пикселях, применяет трансформацию и вызывает `onChangeCallback`.

```javascript
viewport.setOffset(100, -50);
```

**Параметры:**
- `x: number` – смещение по горизонтали (относительно левого верхнего угла)
- `y: number` – смещение по вертикали

**Примечание:** Этот метод используется при восстановлении состояния из сохранённой схемы.

### `getRect()`

Возвращает границы видимой области контейнера (viewport) в координатах браузера (getBoundingClientRect).

```javascript
const rect = viewport.getRect();
console.log(`Visible area: ${rect.w} x ${rect.h}`);
```

**Возвращает:** `{ x: number, y: number, w: number, h: number }` – левая, верхняя, ширина, высота.

**Используется:** в `DomRenderer` для определения видимости узлов при виртуализации.

### Свойство `onChange`

Сеттер для установки колбэка, вызываемого при каждом изменении камеры (drag, setOffset, или внешнее изменение зума).

```javascript
viewport.onChange = () => {
  console.log('Camera moved or zoomed');
  renderer.render(); // перерисовка при движении
};
```

**Вызывается в:**
- `onMouseMove` – при перетаскивании
- `setOffset` – при программной установке
- `update` не вызывает напрямую – только если изменились `x` или `y`

## Обработчики событий

Эти методы вызываются автоматически после `attach()`. Для ручного вызова они не предназначены, но могут быть переопределены при наследовании.

### `onMouseDown(e)`

Срабатывает при нажатии кнопки мыши на контейнере.
- Проверяет `e.button !== 2` – только правая кнопка.
- Сохраняет стартовые координаты и текущее смещение.
- Меняет курсор на `grabbing`.

### `onMouseMove(e)`

Срабатывает при движении мыши по `window` во время активного drag.
- Вычисляет разницу `dx = e.clientX - startX`, `dy = e.clientY - startY`.
- Обновляет `x = originX + dx`, `y = originY + dy`.
- Вызывает `update()` и `onChangeCallback()`.
- Сохраняет смещение в глобальные переменные `window._viewportX`, `window._viewportY`.

### `onMouseUp()`

Срабатывает при отпускании кнопки мыши.
- Сбрасывает `isDragging`.
- Возвращает курсор `grab`.

## Примеры использования

### Базовое подключение к рендереру

```javascript
import { Viewport } from './renderer/Viewport.js';
import { DomRenderer } from './renderer/DomRenderer.js';

const viewportElement = document.getElementById('viewport');
const canvasContainer = document.getElementById('canvasContainer');
const nodesLayer = document.getElementById('nodesLayer');

const viewport = new Viewport(viewportElement, canvasContainer);
const renderer = new DomRenderer(graph, nodesLayer, viewportElement, eventBus);

viewport.attach();
renderer.setViewport(viewport);
viewport.onChange = () => renderer.render();
```

### Ручное управление камерой

```javascript
// Переместить в точку (300, 200)
viewport.setOffset(300, 200);

// Получить текущее смещение для сохранения
const offset = viewport.getOffset();
localStorage.setItem('viewportOffset', JSON.stringify(offset));

// Восстановить при загрузке
const saved = JSON.parse(localStorage.getItem('viewportOffset'));
if (saved) viewport.setOffset(saved.x, saved.y);
```

### Интеграция с zoom-колёсиком

Хотя сам `Viewport` не обрабатывает масштабирование, он хранит глобальную переменную `window.currentZoom`. Пример стандартной интеграции:

```javascript
let currentZoom = 1;
const viewportElement = document.getElementById('viewport');

viewportElement.addEventListener('wheel', (e) => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  const newZoom = Math.min(3, Math.max(0.3, currentZoom * delta));
  currentZoom = newZoom;
  window.currentZoom = currentZoom;
  viewport.update(); // применяет трансформацию с новым zoom
  if (viewport.onChangeCallback) viewport.onChangeCallback();
}, { passive: false });
```

### Комбинирование с виртуализацией

```javascript
// В DomRenderer при виртуализации
render() {
  if (this.virtual && this.viewport) {
    const viewportRect = this.viewport.getRect();
    const offset = this.viewport.getOffset();
    
    // Вычисляем, какие узлы видны
    const visibleNodes = this.graph.nodes.filter(node => {
      const nodeX = node.x + offset.x;
      const nodeY = node.y + offset.y;
      const margin = 300;
      return nodeX + 280 + margin > 0 && 
             nodeX - margin < viewportRect.w &&
             nodeY + height + margin > 0 && 
             nodeY - margin < viewportRect.h;
    });
    // отрисовываем только visibleNodes
  }
}
```

## Наследование и расширение

Класс `Viewport` можно наследовать для добавления дополнительных функций (например, плавного скролла или анимации).

```javascript
class SmoothViewport extends Viewport {
  constructor(container, canvasContainer, duration = 300) {
    super(container, canvasContainer);
    this.duration = duration;
  }

  setOffsetAnimated(targetX, targetY) {
    const startX = this.x;
    const startY = this.y;
    const startTime = performance.now();
    
    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / this.duration);
      const ease = 1 - Math.pow(1 - t, 3); // cubic out
      
      this.x = startX + (targetX - startX) * ease;
      this.y = startY + (targetY - startY) * ease;
      this.update();
      if (this.onChangeCallback) this.onChangeCallback();
      
      if (t < 1) requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  }
}
```

## Глобальные переменные, используемые классом

`Viewport` не создаёт глобальные переменные, но ожидает, что внешний код будет поддерживать:

- `window.currentZoom` – текущий масштаб (используется в `update()` и в других модулях для преобразования координат)
- `window._viewportX` – синхронизируется внутри `onMouseMove` для сохранения состояния

Рекомендуется устанавливать `window.currentZoom` при инициализации:
```javascript
window.currentZoom = 1;
```

## Производительность и оптимизации

- **Трансформация через CSS** – использует стандартный `transform`, который работает быстрее, чем изменение `left/top`.
- **Отсутствие throttle** – события `mousemove` генерируются с частотой кадров (обычно 60 FPS), что достаточно для плавного перемещения.
- **Колбэк onChange** – вызывается на каждый кадр движения, что может вызвать частые перерисовки.

### Оптимизация с помощью GPU-трансформаций

В проекте есть опция `GPU transforms` (оптимизация #1), которая включает `translate3d` вместо обычного `translate`. Это можно реализовать, переопределив метод `update()`:

```javascript
// В расширенной версии Viewport
update() {
  if (window.gpuTransformsEnabled) {
    this.canvasContainer.style.transform = `translate3d(${this.x}px, ${this.y}px, 0) scale(${window.currentZoom || 1})`;
  } else {
    this.canvasContainer.style.transform = `translate(${this.x}px, ${this.y}px) scale(${window.currentZoom || 1})`;
  }
}
```

## Исключения и ошибки

- **Нет проверки существования элементов** – конструктор не проверяет, что `container` и `canvasContainer` существуют. Следует передавать валидные DOM-элементы.
- **Конфликт с левой кнопкой мыши** – обработчик на `mousedown` проверяет `e.button !== 2`, поэтому левая кнопка не влияет на панорамирование.
- **Контекстное меню браузера** – отключается через `preventDefault` на `contextmenu`. Если нужно сохранить меню на других элементах, следует навешивать обработчик только на холст.

## Полный пример использования с графом

```javascript
// Инициализация всей сцены
const viewportEl = document.getElementById('viewport');
const canvasContainer = document.getElementById('canvasContainer');
const nodesLayer = document.getElementById('nodesLayer');

const viewport = new Viewport(viewportEl, canvasContainer);
viewport.attach();

// Настройка зума (пример)
let zoom = 1;
viewportEl.addEventListener('wheel', (e) => {
  e.preventDefault();
  zoom = Math.min(3, Math.max(0.3, zoom * (1 - e.deltaY * 0.005)));
  window.currentZoom = zoom;
  viewport.update();
  if (viewport.onChangeCallback) viewport.onChangeCallback();
}, { passive: false });

// Подключение к рендереру
const renderer = new DomRenderer(graph, nodesLayer, viewportEl, eventBus);
renderer.setViewport(viewport);
viewport.onChange = () => renderer.render();

// Сохранение позиции при автосохранении
window._viewport = viewport;
window._viewportX = 0;
window._viewportY = 0;

// При загрузке схемы
function restoreState(savedData) {
  if (savedData.viewportOffsetX !== undefined) {
    viewport.setOffset(savedData.viewportOffsetX, savedData.viewportOffsetY);
  }
  if (savedData.viewportZoom !== undefined) {
    zoom = savedData.viewportZoom;
    window.currentZoom = zoom;
    viewport.update();
  }
}
```
