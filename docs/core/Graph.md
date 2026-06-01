# `Graph`

## ОПИСАНИЕ

`Graph` – центральный класс приложения Amenodes, реализующий хранение, модификацию и вычисление графа, состоящего из узлов (`Node`) и рёбер (`Edge`). Класс отвечает за:

- добавление и удаление узлов;
- создание и удаление связей;
- проверку циклов и совместимости типов данных;
- вычисление значений, передаваемых по графу;
- сериализацию и десериализацию состояния графа;
- уведомление узлов об их присоединении/отсоединении;
- **отслеживание dirty-состояния (несохранённые изменения).**

**Важно:** все изменения графа должны выполняться через методы `Graph`. Прямое изменение массивов `nodes` или `edges` не допускается.

## ЗАВИСИМОСТИ

```javascript
import { Edge } from './Edge.js';
import { typeSystem } from './DataType.js';
import { NodeFactory } from '../nodes/NodeFactory.js';
import { modal } from '../ui/CustomModal.js';
import { i18n, t } from '../i18n/LanguageManager.js';
```

# КЛАСС GRAPH

## Конструктор

```javascript
constructor()
```

Создаёт новый пустой граф. Инициализирует:

| Свойство | Тип | Начальное значение | Описание |
|----------|-----|--------------------|----------|
| `this.nodes` | `Array<Node>` | `[]` | Массив всех узлов графа. |
| `this.edges` | `Array<Edge>` | `[]` | Массив всех связей графа. |
| `this.nextId` | `number` | `1` | Следующий доступный числовой идентификатор для нового узла. |
| `this.nextEdgeId` | `number` | `1` | Следующий доступный числовой идентификатор для нового ребра. |
| `this.map` | `Map<number, Node>` | `new Map()` | Карта для быстрого доступа к узлам по их `id`. |
| `this.isDirty` | `boolean` | `false` | Флаг, указывающий на наличие несохранённых изменений. |
| `this.dirtyCallbacks` | `Array<Function>` | `[]` | Массив колбэков, вызываемых при изменении dirty-состояния. |

### Публичные свойства

| Свойство | Тип | Доступ | Описание |
|----------|-----|--------|----------|
| `nodes` | `Array<Node>` | чтение/запись (только через методы) | Массив узлов. Не рекомендуется изменять напрямую. |
| `edges` | `Array<Edge>` | чтение/запись (только через методы) | Массив связей. Не рекомендуется изменять напрямую. |
| `nextId` | `number` | чтение | Счётчик для генерации ID новых узлов. |
| `nextEdgeId` | `number` | чтение | Счётчик для генерации ID новых рёбер. |
| `isDirty` | `boolean` | чтение | Флаг наличия несохранённых изменений. |

# Методы

## onDirtyChange(callback)

```javascript
onDirtyChange(callback: (isDirty: boolean) => void): () => void
```

Подписывается на изменения dirty-состояния графа. Колбэк вызывается каждый раз, когда флаг `isDirty` изменяется.

**Параметры:**

- `callback` – функция, принимающая один аргумент `isDirty` (`boolean`).

**Возвращает:** функцию отписки. При её вызове подписчик удаляется из массива `this.dirtyCallbacks`.

**Пример:**

```javascript
const unsubscribe = graph.onDirtyChange((isDirty) => {
  if (isDirty) {
    console.log('Граф содержит несохранённые изменения');
  } else {
    console.log('Все изменения сохранены');
  }
});

// Позже, при уничтожении компонента:
unsubscribe();
```

## setDirty(dirty)

```javascript
setDirty(dirty: boolean = true): void
```

Устанавливает флаг dirty-состояния и уведомляет всех подписчиков об изменении. Вызывается автоматически при любом изменении графа, но может быть вызван и вручную.

**Параметры:**

- `dirty` – новое состояние флага (по умолчанию `true`).

**Пример:**

```javascript
// Автоматически вызывается при изменении графа
graph.addNode(node); // setDirty(true) вызывается автоматически

// Ручная установка (если необходимо)
graph.setDirty(true);
```

## clearDirty()

```javascript
clearDirty(): void
```

Сбрасывает флаг dirty-состояния в `false` и уведомляет подписчиков. Обычно вызывается после успешного сохранения графа.

**Пример:**

```javascript
// После сохранения графа
saveGraph();
graph.clearDirty();
```

## addNode(node)

```javascript
addNode(node: Node): Node
```

Добавляет узел в граф. Автоматически устанавливает `setDirty(true)`.

**Параметры:**

- `node` – экземпляр класса, производного от `Node`.

**Возвращает:** тот же экземпляр `node` (для цепочки вызовов).

## removeNode(id)

```javascript
removeNode(id: number): void
```

Удаляет узел по его идентификатору, а также все связанные с ним рёбра. Автоматически устанавливает `setDirty(true)`.

**Параметры:**

- `id` – числовой идентификатор удаляемого узла.

## addEdge(sourceId, targetId, port)

```javascript
addEdge(sourceId: number, targetId: number, port: string = 'main'): Edge | null
```

Создаёт связь между двумя узлами после выполнения набора проверок. При успешном создании автоматически устанавливает `setDirty(true)`.

**Параметры:**

- `sourceId` – идентификатор узла-источника.
- `targetId` – идентификатор узла-приёмника.
- `port` – имя порта (по умолчанию `'main'`).

**Возвращает:** созданный объект `Edge` или `null`.

## removeEdge(id)

```javascript
removeEdge(id: number): void
```

Удаляет ребро по его идентификатору. Автоматически устанавливает `setDirty(true)`.

**Параметры:**

- `id` – числовой идентификатор ребра.

## loadFrom(data)

```javascript
loadFrom(data: object): void
```

Загружает состояние графа из ранее сохранённого объекта. Полностью заменяет текущий граф. После успешной загрузки автоматически вызывает `clearDirty()`.

**Параметры:**

- `data` – объект, содержащий поля `nodes`, `edges`, `nextId`, `nextEdgeId`, `designQuality` (опционально).

## toSerial()

```javascript
toSerial(): object
```

Сериализует текущее состояние графа в простой JavaScript-объект, пригодный для сохранения в JSON. **Не** включает dirty-флаг, так как это состояние сессии, а не часть графа.

**Возвращает:** объект с полями `nodes`, `edges`, `nextId`, `nextEdgeId`, `designQuality`.

## getNode(id)

```javascript
getNode(id: number): Node | undefined
```

Возвращает узел по идентификатору или `undefined`, если узел не найден.

## getIncomingEdges(targetId)

```javascript
getIncomingEdges(targetId: number): Array<Edge>
```

Возвращает массив рёбер, для которых указанный узел является целью.

## getOutgoingEdges(sourceId)

```javascript
getOutgoingEdges(sourceId: number): Array<Edge>
```

Возвращает массив рёбер, для которых указанный узел является источником.

## hasCycle(source, target)

```javascript
hasCycle(source: number, target: number): boolean
```

Проверяет, создаст ли добавление ребра от `source` к `target` цикл в ориентированном графе.

## canConnect(sourceId, targetId, port)

```javascript
canConnect(sourceId: number, targetId: number, port: string = 'main'): boolean
```

Проверяет возможность соединения двух узлов на основе их типов данных.

## getSourceValue(source, port, visited)

```javascript
getSourceValue(source: Node, port: string = 'main', visited: Set<number> = new Set()): Array<any>
```

Рекурсивно получает выходное значение узла, обходя возможные зависимости.

## getMergedInput(nodeId)

```javascript
getMergedInput(nodeId: number): Array<any>
```

Вычисляет объединённое входное значение для узла на основе всех входящих рёбер.

## reevaluateAll()

```javascript
reevaluateAll(): void
```

Вызывает метод `reevaluate` у всех узлов графа, которые его реализуют.

## updateAllOutputs()

```javascript
updateAllOutputs(): void
```

Вызывает метод `updateDisplay` у всех узлов, которые его реализуют.

## getTypeDisplayName(typeKey)

```javascript
getTypeDisplayName(typeKey: string): string
```

Возвращает локализованное имя типа данных.

# ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ

### Подписка на изменения dirty-состояния

```javascript
const graph = new Graph();

// Подписываемся на изменения
graph.onDirtyChange((isDirty) => {
  if (isDirty) {
    document.title = '* ' + document.title;
    showSaveIndicator();
  } else {
    document.title = document.title.replace(/^\* /, '');
    hideSaveIndicator();
  }
});

// При изменении графа dirty-флаг устанавливается автоматически
graph.addNode(node); // isDirty = true

// После сохранения сбрасываем флаг
saveToFile();
graph.clearDirty(); // isDirty = false
```

### Проверка dirty-состояния перед закрытием страницы

```javascript
window.addEventListener('beforeunload', (e) => {
  if (graph.isDirty) {
    e.preventDefault();
    e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    return 'You have unsaved changes. Are you sure you want to leave?';
  }
});
```

# ЗАМЕЧАНИЯ

- Dirty-флаг **автоматически** устанавливается при любом изменении графа: добавление/удаление узлов, создание/удаление связей, перемещение узлов (через рендерер), изменение значений узлов.
- Метод `loadFrom` **сбрасывает** dirty-флаг, так как загруженное состояние считается сохранённым.
- При сериализации (`toSerial`) dirty-флаг **не сохраняется** – это состояние сессии, а не часть графа.
- Подписка `onDirtyChange` возвращает функцию отписки, что важно для предотвращения утечек памяти при уничтожении компонентов.
- Dirty-флаг не влияет на вычисления графа – это исключительно UI-индикатор для пользователя.
