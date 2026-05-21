# `ContextMenu`

## ОПИСАНИЕ

`ContextMenu` – класс, реализующий контекстное меню для узлов графа. Меню вызывается при клике на манипулятор (handle) узла.
Класс поддерживает динамическое обновление переводов: при смене языка интерфейса меню автоматически перестраивается с корректными локализованными текстами.

## ЗАВИСИМОСТИ

```javascript
import { NodeFactory } from '../nodes/NodeFactory.js';
import { modal } from './CustomModal.js';
import { i18n, t } from '../i18n/LanguageManager.js';
```

| Импорт | Назначение |
|--------|------------|
| `NodeFactory` | Фабрика для создания экземпляров узлов по их типу. |
| `modal` | Объект для отображения модальных диалогов (не используется напрямую, но импортирован). |
| `i18n`, `t` | Система интернационализации для локализации текстов меню. |

# КЛАСС CONTEXTMENU

## Конструктор

```javascript
constructor(graph: Graph, renderer: DomRenderer, history: History, viewport: Viewport)
```

Создаёт экземпляр контекстного меню, привязанный к конкретным компонентам приложения.

**Параметры:**

- `graph` – экземпляр графа, над которым выполняются операции.
- `renderer` – экземпляр рендерера, используемый для обновления отображения после изменений.
- `history` – экземпляр системы истории (undo/redo), используемый для сохранения состояний.
- `viewport` – экземпляр области просмотра, используемый для вычисления позиций новых узлов.

**Инициализируемые свойства:**

| Свойство | Тип | Начальное значение | Описание |
|----------|-----|--------------------|----------|
| `this.graph` | `Graph` | параметр | Ссылка на граф. |
| `this.renderer` | `DomRenderer` | параметр | Ссылка на рендерер. |
| `this.history` | `History` | параметр | Ссылка на систему истории. |
| `this.viewport` | `Viewport` | параметр | Ссылка на область просмотра. |
| `this.currentMenu` | `HTMLElement \| null` | `null` | Текущее отображаемое DOM-элемент меню. |
| `this.currentSourceId` | `number \| null` | `null` | ID узла, для которого открыто меню. |
| `this.currentBaseX` | `number \| null` | `null` | Базовая X-координата для позиционирования новых узлов. |
| `this.currentBaseY` | `number \| null` | `null` | Базовая Y-координата для позиционирования новых узлов. |

- Подписывается на изменения языка через `i18n.subscribe()`. При смене языка текущее открытое меню автоматически перестраивается с новыми переводами.

# Публичные методы

## show(x, y, sourceId)

```javascript
show(x: number, y: number, sourceId: number): void
```

Отображает контекстное меню в указанных экранных координатах для заданного узла-источника.

**Параметры:**

- `x` – горизонтальная координата (в пикселях, относительно окна браузера) для левого верхнего угла меню.
- `y` – вертикальная координата (в пикселях, относительно окна браузера) для левого верхнего угла меню.
- `sourceId` – идентификатор узла, для которого вызывается меню (все операции создания узлов будут создавать связь от этого узла).

**Пример:**

```javascript
const menu = new ContextMenu(graph, renderer, history, viewport);
menu.show(200, 300, 5); // открыть меню для узла с ID=5 в позиции (200, 300)
```

## getNodeScreenPosition(sourceNode)

```javascript
getNodeScreenPosition(sourceNode: Node): { x: number, y: number }
```

Вычисляет экранные координаты для позиционирования новых узлов относительно существующего узла.

**Параметры:**

- `sourceNode` – узел, относительно которого вычисляется позиция.

**Алгоритм:**

- Если узел существует и доступен `viewport`, вычисляет позицию с учётом смещения и масштаба:
  ```
  screenX = node.x + offset.x / zoom + 140
  screenY = node.y + offset.y / zoom + 40
  ```
- Если узел не существует или `viewport` недоступен, возвращает координаты центра области просмотра.

**Возвращает:** объект с полями `x` и `y` (экранные координаты в пикселях).

## addMenuItem(menu, text, onClick)

```javascript
addMenuItem(menu: HTMLElement, text: string, onClick: () => void): void
```

Добавляет стандартный пункт меню.

**Параметры:**

- `menu` – DOM-элемент, в который добавляется пункт.
- `text` – текст пункта меню.
- `onClick` – функция, вызываемая при выборе пункта (после чего меню автоматически закрывается).

## createSubmenu(title, items, onSelect)

```javascript
createSubmenu(
  title: string, 
  items: Array<{ text: string, type: string, subnode: object, title: string }>, 
  onSelect: (type: string, subnode: object, title: string) => void
): HTMLElement
```

Создаёт элемент меню с вложенным подменю.

**Параметры:**

- `title` – текст заголовка подменю (отображается в родительском меню).
- `items` – массив элементов подменю, каждый содержит:
  - `text` – отображаемый текст пункта;
  - `type` – тип узла для создания;
  - `subnode` – дополнительные параметры для узла;
  - `title` – заголовок создаваемого узла.
- `onSelect` – колбэк, вызываемый при выборе пункта подменю. Получает `type`, `subnode` и `title`.

**Возвращает:** DOM-элемент, содержащий заголовок подменю и скрытый блок с вложенными пунктами.

**Примечание:** подменю отображается при наведении курсора на заголовок (через CSS-правило `.node-menu-sub:hover .node-menu-submenu`).

## createAndConnect(nodeType, x, y, sourceId, extraOptions)

```javascript
createAndConnect(
  nodeType: string, 
  x: number, 
  y: number, 
  sourceId: number, 
  extraOptions: object = {}
): void
```

Создаёт новый узел указанного типа, добавляет его в граф и создаёт связь от узла-источника к новому узлу.

**Параметры:**

- `nodeType` – строковый идентификатор типа узла (например, `'number'`, `'output'`).
- `x` – горизонтальная координата для нового узла (в мировых координатах).
- `y` – вертикальная координата для нового узла (в мировых координатах).
- `sourceId` – идентификатор узла-источника, от которого будет создана связь.
- `extraOptions` – дополнительные параметры, передаваемые в конструктор узла.

- Создаёт узел через `NodeFactory.createNode()`.
- Добавляет узел в граф через `graph.addNode()`.
- Создаёт связь через `graph.addEdge(sourceId, node.id, 'main')`.
- Вызывает `finishNodeCreation()` для пересчёта и сохранения состояния.

## finishNodeCreation()

```javascript
finishNodeCreation(): void
```

Завершает процесс создания узла, выполняя необходимые обновления.

- Вызывает `graph.reevaluateAll()` – пересчёт значений всех узлов.
- Вызывает `graph.updateAllOutputs()` – обновление отображаемых данных.
- Вызывает `renderer.render()` – перерисовка интерфейса.
- Вызывает `history.save()` – сохранение состояния для undo/redo.

## toggleImportant(node, important)

```javascript
toggleImportant(node: Node, important: boolean): void
```

Устанавливает или снимает флаг важности узла.

**Параметры:**

- `node` – целевой узел.
- `important` – `true` для отметки как важного, `false` для снятия отметки.

- Изменяет свойство `node.important`.
- Вызывает `renderer.updateNodeClass(node)` для обновления CSS-класса.
- Вызывает `renderer.render()` для перерисовки.
- Вызывает `history.save()` для сохранения состояния.

## close()

```javascript
close(): void
```

Закрывает текущее открытое контекстное меню.

- Удаляет DOM-элемент меню из документа.
- Устанавливает `this.currentMenu = null` и `this.currentSourceId = null`.

# ПРИВАТНЫЕ МЕТОДЫ

## renderNodeList(types, container)

Вызывается внутри `show()` для построения списка узлов. Использует структуру `NodeFactory.getAvailableNodeTypes()` для получения всех доступных типов узлов с их метаданными.

## handleNodeSelection(type, x, y, sourceId)

Обрабатывает выбор узла из меню. Вызывает `createAndConnect` с соответствующими параметрами.

# ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ

### Базовое использование

```javascript
import { ContextMenu } from './ui/ContextMenu.js';

// Инициализация компонентов
const contextMenu = new ContextMenu(graph, renderer, history, viewport);

// Открыть меню для узла с ID=3 в позиции курсора (500, 400)
contextMenu.show(500, 400, 3);
```

### Интеграция с рендерером

В `DomRenderer` метод `showMenu()` вызывает `ContextMenu.show()` при клике на манипулятор узла:

```javascript
// В DomRenderer.js
showMenu(x, y, sourceId) {
  if (!this.contextMenu) {
    this.contextMenu = new ContextMenu(this.graph, this, this.history, this.viewport);
  }
  this.contextMenu.show(x, y, sourceId);
}
```

### Закрытие меню извне

```javascript
// Например, при нажатии Escape
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    contextMenu.close();
  }
});
```

## ЗАМЕЧАНИЯ

- Меню автоматически перестраивается при смене языка благодаря подписке на `i18n.subscribe()`. При этом сохраняется `currentSourceId`, а позиция меню восстанавливается по сохранённым координатам `this.currentMenu.style.left/top`.
- При создании узлов через подменю категорий параметр `subnode` передаётся в `NodeFactory.createNode()` как часть `options`. Это позволяет создавать специализированные варианты узлов (например, `calc` с различными `calcType`).
- Пункты "Выделить ВАЖНЫЙ узел" и "Снять выделение ВАЖНОГО" отображаются всегда, независимо от текущего состояния узла. Логика переключения не проверяет текущее значение `important` перед вызовом.
- Меню позиционируется абсолютно относительно окна браузера (использует `position: fixed` в CSS). При выходе за границы экрана меню не корректирует своё положение автоматически.
- После выбора любого пункта меню (включая подменю) меню закрывается автоматически.
- Класс не управляет фокусом клавиатуры – навигация по меню возможна только мышью.
