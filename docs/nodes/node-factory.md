# `NodeFactory`

`NodeFactory` – фабричный класс для создания всех типов узлов в Amenodes. Централизует логику инстанцирования, управляет реестром типов узлов, хранит метаданные (названия, описания, автора, иконки) и поддерживает категорийные узлы.

**Путь в проекте:** `src/nodes/NodeFactory.js`

**Импорт:**
```javascript
import { NodeFactory } from './nodes/NodeFactory.js';
```

## Статические методы получения информации

### `getAvailableNodeTypes()`

Возвращает массив всех зарегистрированных типов узлов с их метаданными.

```javascript
const types = NodeFactory.getAvailableNodeTypes();
console.log(types);
/* [
  {
    type: 'number',
    nameKey: 'nodes.number',
    descriptionKey: 'nodeDescriptions.number',
    author: 'Amenoke',
    github: 'https://github.com/inzexg-coder/Amenodes',
    icon: 'fa-hashtag'
  },
  {
    type: 'calc',
    nameKey: 'nodes.calc',
    descriptionKey: 'nodeDescriptions.calc',
    isCategory: true,
    categoryName: 'errors',
    subnodes: [...]
  },
  ...
] */
```

**Возвращает:** `Array<Object>` – массив объектов метаданных.

**Структура элемента:**
| Поле | Тип | Описание |
|------|-----|----------|
| `type` | `string` | Внутренний тип узла ('number', 'group', 'calc' и т.д.) |
| `nameKey` | `string` | Ключ локализации для названия (i18n) |
| `descriptionKey` | `string` | Ключ локализации для описания |
| `author` | `string` | Имя автора узла |
| `github` | `string` | Ссылка на GitHub |
| `icon` | `string` | CSS-класс иконки FontAwesome |
| `isCategory` | `boolean` | Является ли узел категорией (опционально) |
| `categoryName` | `string` | Имя категории для i18n (если isCategory true) |
| `subnodes` | `Array` | Массив подузлов для категории (если isCategory true) |

### `getCategorySubnodes(categoryType)`

Возвращает подузлы для категорийного типа (например, для `'calc'` возвращает три типа погрешностей).

```javascript
const subnodes = NodeFactory.getCategorySubnodes('calc');
console.log(subnodes);
/* [
  { type: 'div3', nameKey: 'calcTypes.div3', calcType: 'div3' },
  { type: 'div_sqrt12', nameKey: 'calcTypes.div_sqrt12', calcType: 'div_sqrt12' },
  { type: 'sqrt_sum_sq', nameKey: 'calcTypes.sqrt_sum_sq', calcType: 'sqrt_sum_sq' }
] */
```

**Параметры:**
- `categoryType` – тип категорийного узла (например, `'calc'`)

**Возвращает:** `Array<Object>` – массив подузлов или пустой массив, если тип не является категорией.

### `getMetadata(type)`

Возвращает метаданные для указанного типа узла.

```javascript
const meta = NodeFactory.getMetadata('number');
console.log(meta.nameKey); // 'nodes.number'
console.log(meta.icon);    // 'fa-hashtag'
```

**Параметры:**
- `type` – строковый идентификатор типа узла

**Возвращает:** `Object | null` – метаданные или `null`, если тип не зарегистрирован.

## Статические методы создания узлов

### `createNode(type, options = {})`

Универсальный метод создания узла любого типа.

```javascript
// Создание узла "Число"
const numberNode = NodeFactory.createNode('number', {
  x: 100,
  y: 200,
  title: 'Мой счётчик',
  val: 42
});

// Создание узла "Карта преобразований"
const mapNode = NodeFactory.createNode('map', {
  x: 300,
  y: 400,
  maps: [{ x: 0, y: 10 }, { x: 1, y: 20 }]
});

// Создание узла "Погрешность" с типом sqrt_sum_sq
const calcNode = NodeFactory.createNode('calc', {
  x: 500,
  y: 600,
  calcType: 'sqrt_sum_sq',
  title: 'Суммарная погрешность'
});
```

**Параметры:**
- `type` – тип узла (`'number'`, `'group'`, `'calc'`, `'output'`, `'map'`, `'constant'`, `'confidenceInterval'`)
- `options` – объект с параметрами:
  - `id` – числовой ID (если не указан, будет присвоен при добавлении в граф)
  - `x`, `y` – координаты на холсте
  - `title` – заголовок узла (если не указан, используется локализованный по умолчанию)
  - Специфичные для типа параметры

**Возвращает:** экземпляр соответствующего класса узла.

**Выбрасывает:** `Error` – если тип узла не зарегистрирован.

### `create{тип}At(x, y, value[])`

Создаёт узел  в указанной позиции. Примеры:

```javascript
const num = NodeFactory.createNumberAt(100, 200, 3.14159);
graph.addNode(num);
const group = NodeFactory.createGroupAt(100, 200);
graph.addNode(group);
// Добавление значений через UI или программно:
group.values.push({ name: 'Temperature', val: 25.5 });
```

## Примеры использования

### Создание полной схемы с помощью фабрики

```javascript
import { Graph } from '../core/Graph.js';
import { NodeFactory } from './NodeFactory.js';

const graph = new Graph();

// 1. Источник данных
const tempSensor = NodeFactory.createNumberAt(100, 100, 23.5);
graph.addNode(tempSensor);

// 2. Погрешность измерения
const measurementError = NodeFactory.createCalcAt(400, 100, 'div3', 'Δ_meas');
graph.addNode(measurementError);

// 3. Связь источника с погрешностью
graph.addEdge(tempSensor.id, measurementError.id);

// 4. Вывод результата
const output = NodeFactory.createOutputAt(700, 100);
graph.addNode(output);
graph.addEdge(measurementError.id, output.id);

// 5. Пересчёт и рендеринг
graph.reevaluateAll();
graph.updateAllOutputs();
```

### Динамическое создание узлов через метаданные

```javascript
const availableTypes = NodeFactory.getAvailableNodeTypes();

for (const typeInfo of availableTypes) {
  if (!typeInfo.isCategory) {
    const node = NodeFactory.createNode(typeInfo.type, {
      x: Math.random() * 800,
      y: Math.random() * 600
    });
    graph.addNode(node);
  }
}
```

### Создание категорийного узла с выбором подтипа

```javascript
function addErrorNode(x, y, errorType) {
  const subnodes = NodeFactory.getCategorySubnodes('calc');
  const selected = subnodes.find(sn => sn.calcType === errorType);
  
  if (selected) {
    const title = i18n.t(selected.nameKey);
    const node = NodeFactory.createCalcAt(x, y, selected.calcType, title);
    graph.addNode(node);
    return node;
  }
  return null;
}

// Использование:
const roundingError = addErrorNode(300, 200, 'div_sqrt12');
```

## Наследование и расширение

### Добавление нового типа узла

Для регистрации нового типа необходимо:

1. Создать класс узла, наследующий от `Node`
2. Определить метаданные с экспортом `metadata`
3. Импортировать в `NodeFactory.js` и вызвать `registerNode`

**Пример добавления нового узла:**

```javascript
// В файле src/nodes/MyCustomNode.js
import { Node } from '../core/Node.js';

export const metadata = {
  type: 'myCustom',
  nameKey: 'nodes.myCustom',
  descriptionKey: 'nodeDescriptions.myCustom',
  author: 'Your Name',
  github: 'https://github.com/your/repo',
  icon: 'fa-star'
};

export class MyCustomNode extends Node {
  constructor(id, x, y, title, customParam) {
    super(id, 'myCustom', x, y, title);
    this.customParam = customParam ?? 0;
  }
  
  getValue() {
    return [this.customParam * 2];
  }
  
  createDOM(graph, renderer) {
    // Реализация отрисовки
  }
}

// Затем в NodeFactory.js (после импорта)
import { MyCustomNode, metadata as myCustomMeta } from './MyCustomNode.js';

registerNode('myCustom', MyCustomNode, myCustomMeta);
```

### Доступ к локализации

Фабрика автоматически использует `i18n.t()` для локализации заголовков по умолчанию. При создании узла через `createNode()` без явного `title` используется локализованное значение из `metadata.nameKey`.

```javascript
// Текущий язык 'ru' – заголовок будет "Число"
const node = NodeFactory.createNode('number', { x: 0, y: 0 });

// Текущий язык 'en' – заголовок будет "Number"
const node2 = NodeFactory.createNode('number', { x: 0, y: 0 });
```

## Исключения и ошибки

- `createNode()` с неизвестным типом выбрасывает `Error: Unknown node type: ${type}`

## Производительность

- Реестр типов (`nodeRegistry`) хранит все конструкторы в `Map` для быстрого доступа O(1)
- Категорийные узлы кэшируются в `categoryNodes` Map
- Метаданные не создаются заново при каждом вызове – используются статические объекты
