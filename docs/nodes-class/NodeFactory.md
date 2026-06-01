# `NodeFactory`

## ОПИСАНИЕ

`NodeFactory` – статическая фабрика для создания экземпляров узлов в приложении Amenodes. Класс предоставляет единый интерфейс для:

- создания узлов по строковому идентификатору типа с поддержкой асинхронного создания (через статический метод `onCreate`);
- получения метаданных зарегистрированных типов узлов;
- проверки существования типа узла;
- перечисления всех доступных типов.

Фабрика работает в связке с глобальным реестром `nodeRegistry`, который заполняется при загрузке всех узлов через `loadAllNodes()`. Все методы класса являются статическими – создание экземпляра `NodeFactory` не требуется и не предусмотрено.

**Важно:** перед использованием `NodeFactory` необходимо убедиться, что реестр узлов (`nodeRegistry`) инициализирован. Обычно это происходит асинхронно через вызов `loadAllNodes()` в `Application.initNodesAndStart()`.

## ЗАВИСИМОСТИ

```javascript
import { nodeRegistry } from './registry.js';
import { i18n } from '../i18n/LanguageManager.js';
```

| Импорт | Назначение |
|--------|------------|
| `nodeRegistry` | Глобальная `Map` с зарегистрированными конструкторами и метаданными узлов, экспортируемая из `registry.js`. Ключ – строковый тип узла (`metadata.type`), значение – объект `{ ctor, metadata }`. |
| `i18n` | Экземпляр `LanguageManager` для получения локализованного заголовка узла по умолчанию (через `i18n.t(metadata.nameKey)`). |

# КЛАСС NODEFACTORY

Класс `NodeFactory` не имеет конструктора. Все методы объявлены как `static`.

## getAvailableNodeTypes()

```javascript
static getAvailableNodeTypes(): Array<object>
```

Возвращает массив метаданных всех зарегистрированных типов узлов.

**Алгоритм:**

- Итерирует по значениям `nodeRegistry` (каждое значение – `{ ctor, metadata }`).
- Извлекает поле `metadata` из каждого элемента.
- Формирует массив из этих объектов.

**Возвращает:** массив объектов метаданных. Каждый объект содержит поля, определённые в экспорте `metadata` соответствующего узла (как минимум: `type`, `nameKey`, `descriptionKey`, `icon`, `dataType` и другие опциональные поля).

**Пример возвращаемого значения:**

```javascript
[
  {
    type: 'number',
    nameKey: 'nodes.number',
    descriptionKey: 'nodeDescriptions.number',
    icon: 'fa-hashtag',
    dataType: 'num',
    canHaveIncomingEdges: false,
    canHaveOutgoingEdges: true,
    allowedInputTypes: [],
    allowedOutputTypes: ['num', 'array', 'auto', 'uncert', 'list', 'wlist'],
    defaultValue: 0
  },
  // ... остальные узлы
]
```

**Пример использования:**

```javascript
const allTypes = NodeFactory.getAvailableNodeTypes();
console.log(`Доступно узлов: ${allTypes.length}`);
for (const meta of allTypes) {
  console.log(meta.type, i18n.t(meta.nameKey));
}
```

## getMetadata(type)

```javascript
static getMetadata(type: string): object | null
```

Возвращает метаданные узла по его строковому идентификатору.

**Параметры:**

- `type` – строковый идентификатор типа узла, соответствующий полю `metadata.type` при регистрации.

**Алгоритм:**

- Выполняет поиск в `nodeRegistry` по ключу `type`.
- Если запись найдена, возвращает поле `metadata` из значения.
- Если запись отсутствует, возвращает `null`.

**Возвращает:** объект метаданных или `null`.

## getNodeClass(type)

```javascript
static getNodeClass(type: string): typeof Node | null
```

Возвращает конструктор (класс) узла по его строковому идентификатору.

**Параметры:**

- `type` – строковый идентификатор типа узла.

**Алгоритм:**

- Выполняет поиск в `nodeRegistry` по ключу `type`.
- Если запись найдена, возвращает поле `ctor` (класс-конструктор).
- Если запись отсутствует, возвращает `null`.

**Возвращает:** класс, производный от `Node`, или `null`.

**Примечание:** возвращённый конструктор можно использовать для:

- проверки наличия статического метода `onCreate` (`typeof NodeClass.onCreate === 'function'`);
- создания экземпляра через `new NodeClass(...)`;
- проверки прототипа (`instanceof`).

**Пример:**

```javascript
const NumberClass = NodeFactory.getNodeClass('number');
if (NumberClass && typeof NumberClass.onCreate === 'function') {
  const node = await NumberClass.onCreate(graph, 100, 100, { val: 10 });
}
```

## createNode(type, options)

```javascript
static async createNode(type: string, options: object = {}): Promise<Node | null>
```

Создаёт и возвращает экземпляр узла указанного типа. **Метод является асинхронным**, так как некоторые узлы (например, `ConstantNode`) требуют взаимодействия с пользователем через модальные окна перед созданием.

**Параметры:**

- `type` – строковый идентификатор типа узла.
- `options` – объект с параметрами, передаваемыми в конструктор узла. Допустимые поля:

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | `number \| null` | Идентификатор узла. Если `null` или не указан, узел получит автоматический ID при добавлении в граф через `graph.addNode()`. |
| `x` | `number` | Координата X на канвасе. |
| `y` | `number` | Координата Y на канвасе. |
| `title` | `string` | Заголовок узла. Если не указан, используется локализованное значение из `i18n.t(metadata.nameKey)`. |
| `...customParams` | `any` | Специфичные для узла параметры. |

**Алгоритм:**

1. Получает запись из `nodeRegistry` по ключу `type`. Если тип не зарегистрирован, выбрасывает исключение `Error`.
2. Извлекает `metadata` и `ctor` (класс-конструктор).
3. Определяет `defaultTitle` как `i18n.t(metadata.nameKey)`.
4. Определяет `finalTitle` как `options.title || defaultTitle`.
5. **Если у класса есть статический метод `onCreate`:**
   - Вызывает `await NodeClass.onCreate(graph, options.x || 0, options.y || 0, customParams)`.
   - Если `onCreate` вернул `null`, метод возвращает `null` (пользователь отменил создание).
   - Если `onCreate` вернул узел и передан `id`, а у узла нет `id` – присваивает его.
   - Если передан `finalTitle` и узел имеет стандартный заголовок – обновляет заголовок.
   - Возвращает созданный узел.
6. **Иначе (обычное создание):**
   - Создаёт узел через конструктор: `new ctor(options.id || 0, options.x || 0, options.y || 0, finalTitle, customParams)`.
   - Возвращает созданный узел.

**Возвращает:** `Promise<Node | null>` – экземпляр узла или `null`, если создание было отменено (например, пользователь закрыл модальное окно).

**Выбрасывает:** `Error` с сообщением `Unknown node type: ${type}`, если тип не зарегистрирован.

**Важно:** при загрузке графа из сохранения (через `Graph.loadFrom`) следует использовать прямое создание через конструктор, а не `createNode`, чтобы избежать повторных запросов к пользователю.

### createNodeAt(type, x, y, customParams)

```javascript
static async createNodeAt(type: string, x: number, y: number, customParams: object = {}): Promise<Node | null>
```

Упрощённый метод для создания узла с указанными координатами. Является обёрткой над `createNode` с предустановленными полями `x` и `y`.

**Параметры:**

- `type` – строковый идентификатор типа узла.
- `x` – координата X на канвасе.
- `y` – координата Y на канвасе.
- `customParams` – объект с дополнительными параметрами (без полей `id`, `x`, `y`, `title`; заголовок будет получен из локализации).

**Алгоритм:**

- Вызывает `return await this.createNode(type, { x, y, ...customParams })`.

**Возвращает:** `Promise<Node | null>`.

## hasNodeType(type)

```javascript
static hasNodeType(type: string): boolean
```

Проверяет, зарегистрирован ли указанный тип узла в реестре.

**Параметры:**

- `type` – строковый идентификатор типа узла.

**Возвращает:** `true`, если тип существует в `nodeRegistry`, иначе `false`.

## getAllTypes()

```javascript
static getAllTypes(): Array<string>
```

Возвращает массив всех зарегистрированных строковых идентификаторов типов узлов.

**Алгоритм:**

- Преобразует ключи `nodeRegistry` (объект типа `Map`) в массив через `Array.from(nodeRegistry.keys())`.

**Возвращает:** массив строк – типов узлов.

**Пример:**

```javascript
const types = NodeFactory.getAllTypes();
console.log(types); // ['number', 'constant', 'group', 'calc', 'output', 'map', 'confidenceInterval', 'mean', 'sem']
```

# ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ

### Получение всех типов и создание узла по имени

```javascript
import { NodeFactory } from './nodes/NodeFactory.js';

// Получить все доступные типы
const availableTypes = NodeFactory.getAvailableNodeTypes();

// Найти тип по имени (например, "Map")
const mapMetadata = availableTypes.find(t => t.type === 'map');
if (mapMetadata) {
  const mapNode = await NodeFactory.createNode('map', {
    x: 500,
    y: 500,
    maps: [{ x: 1, y: 10 }, { x: 2, y: 20 }]
  });
  if (mapNode) graph.addNode(mapNode);
}
```

### Проверка существования типа перед созданием

```javascript
const nodeType = 'несуществующий-Node';

if (!NodeFactory.hasNodeType(nodeType)) {
  console.error(`Тип "${nodeType}" не зарегистрирован в системе`);
  return;
}

const node = await NodeFactory.createNode(nodeType, { x: 0, y: 0 });
if (node) graph.addNode(node);
```

### Создание ConstantNode с пользовательским вводом

```javascript
// ConstantNode имеет статический метод onCreate,
// который показывает модальное окно для ввода значения
const constNode = await NodeFactory.createNode('constant', { x: 100, y: 100 });
if (constNode) {
  graph.addNode(constNode);
  // Узел создан с введённым пользователем значением
} else {
  // Пользователь отменил создание (закрыл модальное окно)
  console.log('Создание узла отменено');
}
```

## Статический метод onCreate узла

Некоторые узлы определяют статический метод `onCreate` для кастомного создания (например, запрос значения через модальное окно):

```javascript
// В ConstantNode.js
static async onCreate(graph, x, y, options = {}) {
  const { modal } = await import('../ui/CustomModal.js');
  const { t } = await import('../i18n/LanguageManager.js');
  
  const value = await modal.prompt(t('modal.enterNewValue'), '0');
  if (value === null) return null;
  
  const numValue = parseFloat(value);
  const finalValue = isNaN(numValue) ? 0 : numValue;
  
  const node = new ConstantNode(null, x, y, t('nodes.constant'), { val: finalValue });
  if (graph) graph.addNode(node);
  return node;
}
```

Использование через фабрику:

```javascript
const node = await NodeFactory.createNode('constant', { x: 100, y: 100 });
// node уже добавлен в граф внутри onCreate (если передан graph)
```

### Создание узла при загрузке из сохранения (без вызова onCreate)

```javascript
// В Graph.loadFrom() - НЕ используем фабрику для восстановления
const NodeClass = NodeFactory.getNodeClass(nodeData.type);
if (NodeClass) {
  // Прямой вызов конструктора, без onCreate
  const node = new NodeClass(
    nodeData.id,
    nodeData.x,
    nodeData.y,
    nodeData.title,
    nodeData
  );
  this.nodes.push(node);
}
```

# ЗАМЕЧАНИЯ

- **Асинхронность:** метод `createNode` является асинхронным (`async`). Все вызовы должны использовать `await` или `.then()`.
- **Отмена создания:** если статический метод `onCreate` возвращает `null`, фабрика возвращает `null`. Это позволяет пользователю отменить создание узла (например, закрыть модальное окно).
- **Восстановление из сохранения:** при загрузке графа из JSON (`Graph.loadFrom`) не следует использовать `NodeFactory.createNode`, так как это приведёт к повторным запросам к пользователю (особенно для `ConstantNode`). Вместо этого используйте прямое создание через конструктор.
- `NodeFactory` не хранит состояние – все данные берутся из глобального `nodeRegistry`.
- Реестр `nodeRegistry` заполняется асинхронно через `loadAllNodes()` (вызывается в `Application.initNodesAndStart()`). До завершения этого вызова фабрика может возвращать пустые массивы или выбрасывать исключения о неизвестных типах.
- При создании узла через `createNode` заголовок не интернационализируется повторно – используется текущий язык в момент вызова. При смене языка заголовки узлов обновляются через подписку `i18n.subscribe()` внутри самих узлов.
- Фабрика не проверяет корректность `customParams` – ответственность за правильность параметров лежит на вызывающем коде.
