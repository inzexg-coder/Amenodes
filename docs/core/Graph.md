# `Graph`

## ОПИСАНИЕ

`Graph` – центральный класс приложения Amenodes, реализующий хранение, модификацию и вычисление графа, состоящего из узлов (`Node`) и рёбер (`Edge`). Класс отвечает за:

- добавление и удаление узлов;
- создание и удаление связей;
- проверку циклов и совместимости типов данных;
- вычисление значений, передаваемых по графу;
- сериализацию и десериализацию состояния графа;
- уведомление узлов об их присоединении/отсоединении;
- отслеживание dirty-состояния (несохранённые изменения);
- **локализованное отображение имён типов данных для сообщений об ошибках.**

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

**Возвращает:** функцию отписки.

## setDirty(dirty)

```javascript
setDirty(dirty: boolean = true): void
```

Устанавливает флаг dirty-состояния и уведомляет всех подписчиков.

## clearDirty()

```javascript
clearDirty(): void
```

Сбрасывает флаг dirty-состояния в `false`.

## addNode(node)

```javascript
addNode(node: Node): Node
```

Добавляет узел в граф. Автоматически устанавливает `setDirty(true)`.

## removeNode(id)

```javascript
removeNode(id: number): void
```

Удаляет узел по его идентификатору, а также все связанные с ним рёбра. Автоматически устанавливает `setDirty(true)`.

## addEdge(sourceId, targetId, port)

```javascript
addEdge(sourceId: number, targetId: number, port: string = 'main'): Edge | null
```

Создаёт связь между двумя узлами после выполнения набора проверок. При успешном создании автоматически устанавливает `setDirty(true)`.

**Проверки:**
1. Существование обоих узлов.
2. Если у целевого узла определён метод `canAcceptEdge`, он вызывается.
3. Совместимость типов через `canConnect()`.
4. Отсутствие цикла (вызов `hasCycle`).
5. Отсутствие дублирующей связи.

## removeEdge(id)

```javascript
removeEdge(id: number): void
```

Удаляет ребро по его идентификатору. Автоматически устанавливает `setDirty(true)`.

## getNode(id)

```javascript
getNode(id: number): Node | undefined
```

Возвращает узел по идентификатору или `undefined`.

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

Проверяет, создаст ли добавление ребра цикл.

## canConnect(sourceId, targetId, port)

```javascript
canConnect(sourceId: number, targetId: number, port: string = 'main'): boolean
```

Проверяет возможность соединения двух узлов на основе их типов данных.

**Алгоритм:**
1. Получает узлы-источник и цель по их ID.
2. Определяет типы данных через `typeSystem.getNodeType()`.
3. Вызывает `typeSystem.canConnect()` для проверки совместимости.
4. Если типы совместимы и у целевого узла есть метод `canAcceptEdge`, вызывает его для дополнительной проверки.

**Возвращает:** `true`, если соединение разрешено, иначе `false`.

## getTypeDisplayName(typeKey)

```javascript
getTypeDisplayName(typeKey: string): string
```

Возвращает локализованное отображаемое имя типа данных.

**Параметры:**
- `typeKey` – строковый идентификатор типа (например, `'num'`, `'array'`).

**Алгоритм:**
1. Пытается получить перевод через `t('dataTypes.${typeKey}')`.
2. Если перевод найден, возвращает его.
3. Если перевода нет, возвращает тип с заглавной первой буквой (например, `'Array'`, `'Number'`).

**Используется для:** сообщений об ошибках при несовместимых соединениях.

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

Вызывает метод `reevaluate` у всех узлов графа.

## updateAllOutputs()

```javascript
updateAllOutputs(): void
```

Вызывает метод `updateDisplay` у всех узлов.

## toSerial()

```javascript
toSerial(): object
```

Сериализует текущее состояние графа в объект для сохранения.

## loadFrom(data)

```javascript
loadFrom(data: object): void
```

Загружает состояние графа из ранее сохранённого объекта. После успешной загрузки автоматически вызывает `clearDirty()`.

## exportGraph()

```javascript
exportGraph(): object
```

Экспортирует граф для сохранения в шаблон (без параметров viewport).

## loadGraph(data)

```javascript
loadGraph(data: object): void
```

Загружает граф из экспортированных данных шаблона. После загрузки вызывает `clearDirty()`.

# ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ

### Проверка совместимости типов перед соединением

```javascript
const sourceId = 1, targetId = 2;
if (graph.canConnect(sourceId, targetId)) {
  graph.addEdge(sourceId, targetId);
} else {
  const sourceType = graph.getTypeDisplayName(typeSystem.getNodeType(graph.getNode(sourceId)));
  const targetType = graph.getTypeDisplayName(typeSystem.getNodeType(graph.getNode(targetId)));
  modal.alert(`Cannot connect: ${sourceType} → ${targetType}`);
}
```

### Подписка на dirty-состояние

```javascript
graph.onDirtyChange((isDirty) => {
  document.title = isDirty ? '* ' + document.title : document.title.replace(/^\* /, '');
});
```

## ЗАМЕЧАНИЯ

- **Локализация типов:** Метод `getTypeDisplayName()` обеспечивает читаемые сообщения об ошибках на текущем языке интерфейса.
- **Dirty-флаг:** Автоматически устанавливается при любом изменении графа.
- **canConnect():** Используется как внутри `addEdge()`, так и в `ContextMenu` для предварительной проверки перед созданием узла.
- **Восстановление из сохранения:** При загрузке графа НЕ вызываются статические методы `onCreate` узлов (чтобы избежать повторных запросов к пользователю).
