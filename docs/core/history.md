# `History`

`History` – класс управления историей изменений графа с поддержкой отмены/повтора действий (Undo/Redo) и автоматического сохранения состояния в браузере. Реализует паттерн "Снимок" (Memento) с ограниченным размером стека.

**Путь в проекте:** `src/core/History.js`

**Импорт:**
```javascript
import { History } from './core/History.js';
```
## Конструктор

```javascript
const history = new History(graph, maxSize = 50);
```

**Параметры:**
- `graph: Graph` – экземпляр графа, изменения которого нужно отслеживать
- `maxSize: number` – максимальное количество сохранённых состояний (по умолчанию 50)

**Внутренние свойства:**
- `graph: Graph` – ссылка на граф
- `maxSize: number` – максимальный размер стека
- `stack: Array<Snapshot>` – массив снимков состояний
- `index: number` – текущая позиция в стеке (индекс активного состояния)

```javascript
import { Graph } from './core/Graph.js';
import { History } from './core/History.js';

const graph = new Graph();
const history = new History(graph, 100); // хранить до 100 шагов
```

## Методы управления историей

### `capture()`

Создаёт снимок текущего состояния графа.

```javascript
const snapshot = history.capture();
console.log(snapshot);
// {
//   nodes: [...],
//   edges: [...],
//   nextId: 5,
//   nextEdgeId: 8,
//   designQuality: 80
// }
```

**Что захватывается:**
- Все узлы (через `node.toJSON()`)
- Все рёбра (через `edge.toJSON()`)
- Следующие ID (`nextId`, `nextEdgeId`)
- Качество дизайна (`window._designQualitySaved`)

**Возвращает:** `Snapshot` – объект, совместимый с `graph.loadFrom()`.

### `save()`

Сохраняет текущее состояние в стек истории. Обрезает будущие состояния (если был выполнен Undo, а затем новое действие).

```javascript
// Изменяем граф
graph.addNode(newNode);
// Сохраняем состояние
history.save();
```

**Алгоритм:**
1. Создаёт снимок через `capture()`
2. Обрезает стек до текущего индекса: `stack.slice(0, index + 1)`
3. Добавляет новый снимок в конец
4. Если размер стека превышает `maxSize`, удаляет самый старый снимок
5. Обновляет `index` на последний элемент
6. Вызывает `autoSave()`

**Важно:** `save()` вызывается автоматически при любом действии, изменяющем граф:
- Добавление/удаление узлов
- Добавление/удаление рёбер
- Изменение значений в узлах
- Перемещение узлов
- Импорт схемы

### `undo()`

Отменяет последнее действие, возвращая граф к предыдущему состоянию.

```javascript
// Пользователь нажал Ctrl+Z
history.undo();
```

**Логика:**
- Проверяет `index > 0`
- Уменьшает `index` на 1
- Восстанавливает состояние из `stack[index]`
- После восстановления вызывает `graph.loadFrom()`

**Возвращает:** `void`

### `redo()`

Повторяет отменённое действие, возвращая граф к следующему состоянию.

```javascript
// Пользователь нажал Ctrl+Y или Ctrl+Shift+Z
history.redo();
```

**Логика:**
- Проверяет `index < stack.length - 1`
- Увеличивает `index` на 1
- Восстанавливает состояние из `stack[index]`

### `restore(snapshot)`

Восстанавливает граф из переданного снимка и применяет сохранённое качество дизайна.

```javascript
const snapshot = history.capture();
// ... какие-то изменения
history.restore(snapshot);
```

**Логика:**
1. Вызывает `graph.loadFrom(snapshot)`
2. Если в снимке есть поле `designQuality` и глобальная функция `window.applyDesignQuality`, применяет её
3. Не изменяет стек истории

## Автосохранение

### `autoSave()`

Сохраняет текущее состояние графа в `localStorage` браузера.

```javascript
history.autoSave();
```

**Что сохраняется:**
- Полная сериализация графа (`graph.toSerial()`)
- Позиция вьюпорта (`window._viewportX`, `window._viewportY`)
- Масштаб вьюпорта (`window.currentZoom`)
- Качество дизайна (`window.currentQualityValue`)

**Ключ в localStorage:** `'amenodes_autosave'`

**Визуальный индикатор:**
- Находит элемент с `id="autosaveStatus"`
- Показывает его с прозрачностью 1 на 1.5 секунды
- Текст: "Saved"

### `loadFromStorage()`

Загружает автосохранённое состояние из `localStorage` при инициализации приложения.

```javascript
const loaded = history.loadFromStorage();
if (loaded) {
  console.log('Previous session restored');
}
```

**Возвращает:** `boolean` – `true`, если данные были найдены и восстановлены

**Дополнительные действия:**
- Восстанавливает качество дизайна через `window.applyDesignQuality()`
- Восстанавливает позицию вьюпорта через `window._viewport.setOffset()`
- Восстанавливает масштаб через `window.setZoom()`

## Примеры использования

### Базовое использование с графом

```javascript
import { Graph } from './core/Graph.js';
import { History } from './core/History.js';
import { NumberNode } from './nodes/NumberNode.js';
import { OutputNode } from './nodes/OutputNode.js';

// Создаём граф
const graph = new Graph();
const history = new History(graph, 50);

// Добавляем узел
const num1 = new NumberNode(null, 100, 100, 'A', 10);
graph.addNode(num1);
history.save(); // Сохраняем состояние 1

// Добавляем второй узел
const num2 = new NumberNode(null, 100, 200, 'B', 20);
graph.addNode(num2);
history.save(); // Сохраняем состояние 2

// Отменяем добавление второго узла
history.undo(); // Возвращаемся к состоянию 1 (только num1)

// Повторяем добавление
history.redo(); // Снова состояние 2 (оба узла)
```

### Настройка размера истории

```javascript
// Хранить только 20 последних действий (экономия памяти)
const history = new History(graph, 20);

// Оптимизация для слабых устройств
const historyOptimized = new History(graph, 20);
```

### Интеграция с рендерером

```javascript
class DomRenderer {
  setHistory(history) {
    this.history = history;
    window._history = history;
  }
  
  save() {
    if (this.history) this.history.save();
  }
}

// В приложении:
const renderer = new DomRenderer(graph, layer, viewportEl, eventBus);
renderer.setHistory(history);
```

### Пользовательские действия с сохранением

```javascript
// При изменении значения узла
numberNode.value = 42;
graph.reevaluateAll();
renderer.render();
history.save(); // Сохранить для возможности отмены

// При перемещении узла
node.x = 200;
node.y = 300;
renderer.render();
history.save(); // Перемещение тоже сохраняется
```

## Снимок состояния (Snapshot)

Тип `Snapshot` – это объект, совместимый с `graph.loadFrom()`:

```typescript
interface Snapshot {
  nodes: Array<{
    id: number;
    type: string;
    x: number;
    y: number;
    title: string;
    important?: boolean;
    // специфичные для типа узла поля:
    val?: number;           // для NumberNode, ConstantNode
    // другие
  }>;
  edges: Array<{
    id: number;
    sourceId: number;
    targetId: number;
    sourcePort: string;
  }>;
  nextId: number;
  nextEdgeId: number;
  designQuality?: number;
}
```

## Особенности реализации

### Обрезка стека при новом действии

```javascript
// Текущий индекс = 2 (третье состояние)
// Пользователь сделал Undo до индекса 1
history.undo(); // index = 1
// Теперь делает новое действие
history.save(); // Удаляет состояния с индексом 2 и выше
```

### Инварианты

- `index` всегда указывает на текущее состояние
- `stack.length - 1` – максимальный доступный индекс
- После `undo()` можно сделать `redo()` до тех пор, пока не будет нового `save()`
- После `save()` `redo()` становится невозможным (стек обрезан)

### Совместимость с оптимизациями

При изменении `maxSize` через оптимизации (метод #15 "Ограничение истории"):

```javascript
// В панели оптимизаций:
if (optimizations[15]) {
  history.maxSize = 20; // уменьшаем с 50 до 20
} else {
  history.maxSize = 50; // возвращаем стандартный размер
}
```

## Интеграция с приложением

В `main.js` инициализация выглядит так:

```javascript
class Application {
  initHistory() {
    this.history = new History(this.graph);
    this.renderer.setHistory(this.history);
    window._history = this.history;
  }
  
  // Сохранение происходит автоматически при:
  // - добавлении узла через NodeMenu
  // - изменении значения через NumberNode
  // - перемещении узла через DomRenderer
  // - импорте схемы через PersistenceService
}
```

## Исключения и ошибки

- **Отсутствие истории:** Если `history` не передан в рендерер, вызов `save()` игнорируется (проверка `if (this.history)`)
- **Ошибки localStorage:** При `autoSave()` ошибки перехватываются (`try...catch`), не прерывая выполнение
- **Некорректный JSON:** При `loadFromStorage()` ошибка логируется в консоль, функция возвращает `false`

## Производительность

- **Размер снимка:** Зависит от количества узлов и рёбер. Для схемы из 100 узлов снимок может занимать 100-500 КБ.
- **Частота сохранений:** При каждом действии. Если пользователь очень быстро перемещает узлы, создаётся много снимков.
- **Рекомендации:**
  - Для больших схем (200+ узлов) установить `maxSize = 20`
  - Для слабых устройств использовать оптимизацию #15

## Расширение и наследование

Класс не предполагает наследования. Для кастомизации можно:
1. Переопределить `capture()` для добавления дополнительных полей в снимок
2. Переопределить `restore()` для дополнительной логики после восстановления
3. Заменить `autoSave()` для сохранения в другом хранилище (например, IndexedDB)

Пример расширения:

```javascript
class CustomHistory extends History {
  capture() {
    const snapshot = super.capture();
    snapshot.timestamp = Date.now(); // добавляем метку времени
    return snapshot;
  }
  
  autoSave() {
    super.autoSave();
    console.log(`Auto-saved at ${new Date().toISOString()}`);
  }
}
```

## Зависимости

- `Graph` – для вызова `loadFrom()` и `toSerial()`
- `localStorage` – браузерное API для автосохранения
- Глобальные объекты `window._viewport`, `window.currentZoom`, `window.currentQualityValue`, `window.applyDesignQuality`
