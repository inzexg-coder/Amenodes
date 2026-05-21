# `Viewport`

## ОПИСАНИЕ

`Viewport` – класс, управляющий панорамированием (pan) и масштабированием (zoom) рабочей области графа. 
Реализует механизм перетаскивания правой кнопкой мыши для перемещения вида и обеспечивает трансформацию DOM-элементов через CSS-свойство `transform`.

Класс отвечает за:

- отслеживание смещения (offset) холста по осям X и Y;
- применение масштаба через глобальную переменную `window.currentZoom`;
- обработку событий мыши для перетаскивания;
- трансформацию контейнера с узлами с учётом текущего смещения и масштаба;
- уведомление внешних подписчиков об изменениях позиции вида.

**Важно:** Класс не обрабатывает события колёсика мыши (wheel) – это делегируется внешнему коду, который вызывает `window.setZoom` и `this.update()`.

## ЗАВИСИМОСТИ

Класс `Viewport` не импортирует другие модули приложения. Он полностью самодостаточен и работает через прямой доступ к DOM-элементам и глобальным переменным.

# КЛАСС VIEWPORT

## Конструктор

```javascript
constructor(container: HTMLElement, canvasContainer: HTMLElement)
```

Создаёт новый экземпляр контроллера области просмотра.

**Параметры:**

- `container` – DOM-элемент, представляющий область просмотра (обычно `div.viewport`). На него навешиваются обработчики событий мыши.
- `canvasContainer` – DOM-элемент, к которому применяется CSS-трансформация (обычно `div.canvas-container`). Содержит слой с узлами.

**Инициализируемые свойства:**

| Свойство | Тип | Начальное значение | Описание |
|----------|-----|--------------------|----------|
| `this.container` | `HTMLElement` | параметр | Элемент-контейнер области просмотра. |
| `this.canvasContainer` | `HTMLElement` | параметр | Элемент, получающий трансформацию. |
| `this.x` | `number` | `0` | Смещение по оси X в пикселях. |
| `this.y` | `number` | `0` | Смещение по оси Y в пикселях. |
| `this.isDragging` | `boolean` | `false` | Флаг активного перетаскивания. |
| `this.startX` | `number` | `0` | Координата X начала перетаскивания (clientX). |
| `this.startY` | `number` | `0` | Координата Y начала перетаскивания (clientY). |
| `this.originX` | `number` | `0` | Смещение `this.x` в момент начала перетаскивания. |
| `this.originY` | `number` | `0` | Смещение `this.y` в момент начала перетаскивания. |
| `this.onChangeCallback` | `Function` | `null` | Callback, вызываемый при изменении позиции или масштаба. |

### Публичные свойства

| Свойство | Тип | Доступ | Описание |
|----------|-----|--------|----------|
| `x` | `number` | чтение/запись (через методы) | Текущее смещение по горизонтали. |
| `y` | `number` | чтение/запись (через методы) | Текущее смещение по вертикали. |
| `isDragging` | `boolean` | чтение | Флаг, указывающий на активное перетаскивание. |

# Методы

## attach()

```javascript
attach(): void
```

Навешивает обработчики событий мыши на DOM-элементы. Должен быть вызван после создания экземпляра для активации панорамирования.

**Регистрируемые обработчики:**

- `mousedown` на `this.container` – начало перетаскивания (только правая кнопка, `button === 2`).
- `mousemove` на `window` – перемещение во время перетаскивания.
- `mouseup` на `window` – завершение перетаскивания.
- `contextmenu` на `this.container` – предотвращение стандартного контекстного меню.

**Пример:**

```javascript
const viewport = new Viewport(containerEl, canvasEl);
viewport.attach();
```

## onMouseDown(e)

```javascript
onMouseDown(e: MouseEvent): void
```

Обработчик начала перетаскивания. Вызывается автоматически при событии `mousedown` на контейнере.

**Параметры:**

- `e` – событие мыши.

**Условия активации:**

- `e.button !== 2` – игнорируются левая и средняя кнопки (только правая).
- Выполняется `e.preventDefault()` для предотвращения выделения.

**Фиксируемые значения:**

- `this.startX`, `this.startY` – текущие координаты курсора.
- `this.originX`, `this.originY` – текущие значения `this.x` и `this.y`.
- `this.isDragging` устанавливается в `true`.
- Курсор контейнера меняется на `'grabbing'`.

## onMouseMove(e)

```javascript
onMouseMove(e: MouseEvent): void
```

Обработчик перемещения мыши во время активного перетаскивания. Вызывается автоматически.

**Параметры:**

- `e` – событие мыши.

**Алгоритм:**

- Если `this.isDragging === false`, выход без действий.
- Вычисляется разница `dx = e.clientX - this.startX` и `dy = e.clientY - this.startY`.
- `this.x = this.originX + dx`
- `this.y = this.originY + dy`
- Вызывается `this.update()` для применения трансформации.
- Если определён `this.onChangeCallback`, он вызывается.
- Глобальные переменные `window._viewportX` и `window._viewportY` обновляются.

## onMouseUp()

```javascript
onMouseUp(): void
```

Обработчик завершения перетаскивания. Вызывается автоматически.

**Параметры:** отсутствуют.

**Действия:**

- Если `this.isDragging === true`, сбрасывает флаг в `false`.
- Восстанавливает курсор контейнера в `'grab'`.

## update()

```javascript
update(): void
```

Применяет текущие значения смещения (`this.x`, `this.y`) и глобального масштаба к DOM-элементу `this.canvasContainer`.

**Формат трансформации:**

```javascript
`translate(${this.x}px, ${this.y}px) scale(${window.currentZoom || 1})`
```

**Замечания:**

- Используется `window.currentZoom` – глобальная переменная, устанавливаемая внешним кодом (обычно обработчиком колеса мыши в `main.js`).
- Если `window.currentZoom` не определён, используется значение `1`.
- Метод не вызывает `onChangeCallback` – это ответственность вызывающего кода.

## getOffset()

```javascript
getOffset(): { x: number, y: number }
```

Возвращает текущее смещение области просмотра.

**Возвращает:** объект с полями `x` и `y`.

**Пример:**

```javascript
const offset = viewport.getOffset();
console.log(`Смещение: (${offset.x}, ${offset.y})`);
```

## setOffset(x, y)

```javascript
setOffset(x: number, y: number): void
```

Устанавливает смещение области просмотра в указанные координаты.

**Параметры:**

- `x` – новое смещение по горизонтали.
- `y` – новое смещение по вертикали.

- Обновляются `this.x` и `this.y`.
- Вызывается `this.update()` для применения трансформации.
- Если определён `this.onChangeCallback`, он вызывается.

**Пример:**

```javascript
viewport.setOffset(100, 200); // смещает вид на (100, 200)
```

## getRect()

```javascript
getRect(): { x: number, y: number, w: number, h: number }
```

Возвращает размеры и позицию области просмотра относительно окна браузера.

**Возвращает:** объект с полями:

- `x` – левая координата (clientX)
- `y` – верхняя координата (clientY)
- `w` – ширина
- `h` – высота

## set onChange(callback)

```javascript
set onChange(callback: Function): void
```

Устанавливает функцию обратного вызова, вызываемую при каждом изменении позиции или масштаба.

**Параметры:**

- `callback` – функция, принимающая ноль аргументов.

**Примечание:** свойство `onChange` определено как setter, но фактически устанавливает `this.onChangeCallback`.

**Пример:**

```javascript
viewport.onChange = () => {
  console.log('Viewport changed, re-rendering...');
  renderer.render();
};
```

# Глобальные зависимости

Класс `Viewport` взаимодействует со следующими глобальными объектами:

| Переменная | Тип | Место установки | Назначение |
|------------|-----|-----------------|------------|
| `window.currentZoom` | `number` | `main.js` (обработчик wheel) | Текущий масштаб области просмотра. |
| `window._viewportX` | `number` | `onMouseMove` | Сохраняет смещение X для автосохранения. |
| `window._viewportY` | `number` | `onMouseMove` | Сохраняет смещение Y для автосохранения. |
| `window._viewport` | `Viewport` | `main.js` | Ссылка на экземпляр для внешнего доступа. |

# ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ

### Базовая инициализация и подключение

```javascript
import { Viewport } from './renderer/Viewport.js';

const viewportEl = document.getElementById('viewport');
const canvasContainer = document.getElementById('canvasContainer');

const viewport = new Viewport(viewportEl, canvasContainer);
viewport.attach();
viewport.onChange = () => {
  // Обновить рендер при изменении
  renderGraph();
};

// Установка начального смещения
viewport.setOffset(500, 300);
```

### Интеграция с обработчиком колеса мыши

```javascript
let currentZoom = 1;

viewportEl.addEventListener('wheel', (e) => {
  e.preventDefault();
  currentZoom = Math.min(3, Math.max(0.3, currentZoom * (1 - e.deltaY * 0.005)));
  window.currentZoom = currentZoom;
  viewport.update(); // применяет новый масштаб
  if (viewport.onChangeCallback) viewport.onChangeCallback();
}, { passive: false });
```

### Определение видимых узлов (совместно с рендерером)

```javascript
function getVisibleNodes(graph, viewport) {
  const viewportRect = viewport.getRect();
  const offset = viewport.getOffset();
  const zoom = window.currentZoom || 1;
  
  return graph.nodes.filter(node => {
    const nodeX = (node.x + offset.x) * zoom;
    const nodeY = (node.y + offset.y) * zoom;
    const margin = 300;
    
    return !(nodeX + 280 + margin < 0 ||
             nodeX - margin > viewportRect.w ||
             nodeY + 80 + margin < 0 ||
             nodeY - margin > viewportRect.h);
  });
}
```

### Сохранение и восстановление состояния

```javascript
// Сохранить позицию
const savedOffset = viewport.getOffset();
const savedZoom = window.currentZoom;
localStorage.setItem('viewportState', JSON.stringify({
  x: savedOffset.x,
  y: savedOffset.y,
  zoom: savedZoom
}));

// Восстановить
const saved = JSON.parse(localStorage.getItem('viewportState'));
if (saved) {
  viewport.setOffset(saved.x, saved.y);
  window.currentZoom = saved.zoom;
  window.setZoom(saved.zoom); // если определён
  viewport.update();
}
```

## ЗАМЕЧАНИЯ

- Класс **не обрабатывает событие `wheel`** – масштабирование должно реализовываться внешним кодом с последующим вызовом `update()`.
- Для корректной работы `window.currentZoom` должна быть определена и поддерживаться в актуальном состоянии.
- Метод `attach()` необходимо вызывать явно после создания экземпляра – конструктор не навешивает обработчики автоматически.
- При изменении масштаба через `window.currentZoom` требуется явный вызов `viewport.update()` для применения трансформации.
- Свойство `onChange` является setter’ом; для получения уведомлений об изменениях необходимо передать callback через `viewport.onChange = fn`.
- Класс не содержит логики ограничения границ панорамирования – можно увести вид за пределы содержимого.
- CSS-трансформации могут быть отключены глобальными стилями, но `Viewport` продолжит их применять.
