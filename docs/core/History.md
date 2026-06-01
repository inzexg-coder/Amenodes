# `History`

## ОПИСАНИЕ

`History` – класс, реализующий систему отмены и повтора действий (undo/redo) для графа узлов. 
Обеспечивает сохранение снимков состояния графа с ограничением глубины истории, автоматическое сохранение в `localStorage` и восстановление состояния, включая позицию вьюпорта и уровень зума.

**Важно:** все изменения графа, которые должны быть отменяемы, должны сопровождаться вызовом `history.save()` после завершения операции. Автосохранение выполняется при каждом вызове `save()`.

**Новое в версии 2.5.0:** методы `undo()` и `redo()` теперь автоматически устанавливают dirty-флаг графа, так как отмена или повтор действия приводит к состоянию, отличному от последнего сохранённого.

## ЗАВИСИМОСТИ

Класс `History` не импортирует внешние модули.

# КЛАСС HISTORY

## Конструктор

```javascript
constructor(graph: Graph, maxSize: number = 50)
```

Создаёт новую систему истории для указанного графа.

**Параметры:**

- `graph` – экземпляр класса `Graph`, изменения которого будут отслеживаться.
- `maxSize` – максимальное количество сохраняемых снимков состояния. При превышении этого лимита самые старые снимки удаляются. По умолчанию `50`.

**Инициализация:**

| Свойство | Тип | Начальное значение | Описание |
|----------|-----|--------------------|----------|
| `this.graph` | `Graph` | переданный граф | Ссылка на граф, чьё состояние отслеживается. |
| `this.maxSize` | `number` | `maxSize` | Максимальный размер стека истории. |
| `this.stack` | `Array<object>` | `[]` | Стек снимков состояния. |
| `this.index` | `number` | `-1` | Текущая позиция в стеке истории. |

После инициализации конструктор **автоматически вызывает** `this.save()`, создавая начальный снимок состояния.

### Публичные свойства

| Свойство | Тип | Доступ | Описание |
|----------|-----|--------|----------|
| `maxSize` | `number` | чтение/запись | Максимальный размер истории. Может быть изменён динамически. |
| `graph` | `Graph` | чтение | Ссылка на связанный граф. |
| `stack` | `Array<object>` | чтение | Стек снимков (не рекомендуется изменять напрямую). |
| `index` | `number` | чтение | Текущий индекс в стеке (`-1` если история пуста). |

# Методы

## capture()

```javascript
capture(): object
```

Создаёт снимок текущего состояния графа и связанных глобальных параметров. Метод вызывается автоматически внутри `save()`.

**Возвращает:** объект со следующей структурой:

```javascript
{
  nodes: Array<object>,      // сериализованные узлы
  edges: Array<object>,      // сериализованные рёбра
  nextId: number,            // следующий ID узла
  nextEdgeId: number,        // следующий ID ребра
  designQuality: number      // текущее качество дизайна (0-100)
}
```

## save()

```javascript
save(): void
```

Сохраняет текущее состояние графа в стек истории. Выполняет следующие операции:

1. Получает текущий снимок через `capture()`.
2. Обрезает стек до текущей позиции (`this.stack = this.stack.slice(0, this.index + 1)`), удаляя все снимки, которые были после текущего индекса (это происходит при выполнении нового действия после отмены).
3. Добавляет новый снимок в конец стека.
4. Если размер стека превышает `this.maxSize`, удаляет самый старый снимок (с индексом `0`).
5. Обновляет `this.index` на последнюю позицию в стеке.
6. Вызывает `this.autoSave()` для сохранения в `localStorage`.
7. **Вызывает `this.graph.clearDirty()`** – после сохранения граф считается чистым.

## undo()

```javascript
undo(): void
```

Выполняет отмену последнего действия.

**Алгоритм:**

- Если `this.index > 0`, уменьшает `this.index` на `1`.
- Вызывает `this.restore(this.stack[this.index])` с соответствующим снимком.
- **Вызывает `this.graph.setDirty(true)`** – после отмены граф считается изменённым (несохранённым), так как текущее состояние отличается от состояния до отмены.

**Примечание:** при вызове `undo()` на стартовой позиции (`index === 0`) ничего не происходит.

## redo()

```javascript
redo(): void
```

Выполняет повтор действия, которое было отменено.

**Алгоритм:**

- Если `this.index < this.stack.length - 1`, увеличивает `this.index` на `1`.
- Вызывает `this.restore(this.stack[this.index])` с соответствующим снимком.
- **Вызывает `this.graph.setDirty(true)`** – после повтора граф считается изменённым (несохранённым).

**Примечание:** при вызове `redo()` на последнем снимке (`index === stack.length - 1`) ничего не происходит.

## restore(snapshot)

```javascript
restore(snapshot: object): void
```

Восстанавливает состояние графа из переданного снимка.

**Параметры:**

- `snapshot` – объект, полученный через `capture()` или извлечённый из стека.

1. Вызывает `this.graph.loadFrom(snapshot)` – полностью заменяет текущий граф данными из снимка.
2. Если в снимке присутствует поле `designQuality` и определена глобальная функция `window.applyDesignQuality`, вызывает её с этим значением.

**Примечание:** этот метод не изменяет стек истории и не обновляет `this.index`. Он предназначен для внутреннего использования `undo()` и `redo()`.

## autoSave()

```javascript
autoSave(): void
```

Сохраняет текущее состояние графа в `localStorage` под ключом `amenodes_autosave`. Автоматически вызывается внутри `save()`.

**Дополнительные данные, сохраняемые в `localStorage`:**

| Поле | Источник | Описание |
|------|----------|----------|
| `viewportOffsetX` | `window._viewportX` | Горизонтальный сдвиг вьюпорта. |
| `viewportOffsetY` | `window._viewportY` | Вертикальный сдвиг вьюпорта. |
| `viewportZoom` | `window.currentZoom` | Текущий уровень зума. |
| `designQuality` | `window.currentQualityValue` | Текущее качество дизайна. |

- Данные записываются в `localStorage` (синхронно, через `JSON.stringify`).
- Если на странице существует элемент с `id="autosaveStatus"`, его стиль `opacity` устанавливается в `'1'`, а через 1500 мс возвращается в `'0'`.

## loadFromStorage()

```javascript
loadFromStorage(): boolean
```

Загружает ранее сохранённое состояние графа из `localStorage` и восстанавливает его.

**Алгоритм:**

1. Пытается прочитать данные из `localStorage` по ключу `amenodes_autosave`.
2. Если данные отсутствуют или повреждены, возвращает `false`.
3. Вызывает `this.graph.loadFrom(data)` для восстановления графа.
4. Если в данных присутствует `designQuality` и определена глобальная функция `window.applyDesignQuality`, вызывает её.
5. Если в данных присутствуют `viewportOffsetX`, `viewportOffsetY` и определён глобальный объект `window._viewport` с методом `setOffset`, вызывает его.
6. Если в данных присутствует `viewportZoom` и определена глобальная функция `window.setZoom`, вызывает её.
7. **Вызывает `this.graph.clearDirty()`** – после загрузки граф считается чистым.

**Возвращает:**

- `true` – если данные успешно загружены и восстановлены.
- `false` – если данные отсутствуют, повреждены или произошла ошибка.

# ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ

### Базовая работа с историей и dirty-состоянием

```javascript
import { Graph } from './core/Graph.js';
import { History } from './core/History.js';

const graph = new Graph();
const history = new History(graph, 30);

// Подписываемся на dirty-состояние
graph.onDirtyChange((isDirty) => {
  console.log(`Граф ${isDirty ? 'имеет' : 'не имеет'} несохранённых изменений`);
});

// Выполняем действия
const node = new NumberNode(null, 100, 100, 'Value', { val: 10 });
graph.addNode(node);
history.save(); // dirty = false после save()

// Меняем значение (автоматически устанавливает dirty = true)
node.value = 20;
graph.reevaluateAll();
history.save(); // dirty = false после save()

history.undo(); // dirty = true (состояние изменилось)
history.redo(); // dirty = true (состояние изменилось)
```

### Проверка dirty-состояния перед выходом

```javascript
window.addEventListener('beforeunload', (e) => {
  if (history.graph.isDirty) {
    e.preventDefault();
    e.returnValue = 'You have unsaved changes. Are you sure?';
    return 'You have unsaved changes. Are you sure?';
  }
});
```

### Интеграция с UI-кнопками

```javascript
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const saveBtn = document.getElementById('saveBtn');

// Обновляем состояние кнопок при изменении dirty-флага
graph.onDirtyChange((isDirty) => {
  saveBtn.disabled = !isDirty;
  saveBtn.style.opacity = isDirty ? '1' : '0.5';
});

undoBtn.onclick = () => {
  history.undo();
  renderer.render();
};

redoBtn.onclick = () => {
  history.redo();
  renderer.render();
};

saveBtn.onclick = () => {
  persistenceService.exportToFile();
  // dirty сбрасывается внутри exportToFile через graph.clearDirty()
};
```

# ЗАМЕЧАНИЯ

- **Автосохранение:** выполняется при каждом вызове `save()`, перезаписывая предыдущие данные в `localStorage`.
- **Dirty-флаг:** методы `undo()` и `redo()` автоматически устанавливают `graph.setDirty(true)`, так как они изменяют состояние графа. 
- **Сохранение:** вызов `save()` автоматически сбрасывает dirty-флаг через `graph.clearDirty()`.
- **Глубина истории:** при достижении лимита `maxSize` самые старые снимки удаляются без предупреждения.
- **Глобальные зависимости:** класс `History` использует глобальные переменные и функции (`window._viewportX`, `window._viewportY`, `window.currentZoom`, `window.currentQualityValue`, `window.applyDesignQuality`, `window._viewport`, `window.setZoom`).
- **Отсутствие валидации:** при восстановлении из `localStorage` не выполняется проверка целостности данных.
- **Снимки включают позицию вьюпорта и зум:** это позволяет восстанавливать не только содержимое графа, но и точное положение камеры.
