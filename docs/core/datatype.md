# `DataType`

`DataType` – модуль, реализующий систему типов для контроля целостности вычислительного графа. 
Предотвращает создание семантически некорректных соединений между узлами разных типов, анализируя природу передаваемых данных и допустимые направления потоков.

**Путь в проекте:** `src/core/DataType.js`

**Импорт:**
```javascript
import { DataType, TypeSystem, typeSystem } from './core/DataType.js';
```

## Константы DataType

Шесть базовых типов данных, представленных строковыми константами:

| Константа | Значение | Назначение | Пример узла |
|-----------|----------|------------|--------------|
| `DataType.NUM` | `'num'` | Одиночное скалярное значение. Не может иметь входящих соединений. | `NumberNode`, `ConstantNode` |
| `DataType.ARRAY` | `'array'` | Упорядоченный набор чисел. Не может иметь входящих соединений. | `GroupNode` |
| `DataType.AUTO` | `'auto'` | Отображение или ретрансляция данных. Может иметь входящие соединения, не имеет исходящих. | `OutputNode` |
| `DataType.UNCERT` | `'uncert'` | Результат метрологического расчёта. Может иметь входящие и исходящие соединения. | `CalcNode` |
| `DataType.LIST` | `'list'` | Результат карты в режиме сквозного прохода (`passthrough`). | `MapNode` (в режиме `passthrough`) |
| `DataType.WLIST` | `'wlist'` | Результат карты в режиме отдельного выхода (`separate`). | `MapNode` (в режиме `separate blue output`) |
| `DataType.INTERVAL` | `'interval'` | Результат умножения погрешности на число. | `ConfidenceIntervalNode` |
| `DataType..` | `'новое значение'` | Назначение | `пример узла` |

## Класс TypeSystem

Ядро системы типов. Управляет определениями типов и проверяет допустимость соединений.

### Конструктор

```javascript
const typeSystem = new TypeSystem();
```

**Внутренние свойства:**
- `typeDefinitions: Map<string, TypeDefinition>` – хранилище определений типов

### `registerType(typeName, definition)`

Регистрирует новый тип в системе.

```javascript
typeSystem.registerType('custom', {
  name: 'Custom Type',
  canHaveIncomingEdges: true,
  canHaveOutgoingEdges: true,
  allowedInputTypes: [DataType.NUM, DataType.ARRAY],
  allowedOutputTypes: [DataType.AUTO],
  defaultValue: null
});
```

**Параметр `definition`:**

| Поле | Тип | Описание |
|------|-----|----------|
| `name` | `string` | Человекочитаемое имя типа |
| `canHaveIncomingEdges` | `boolean` | Может ли узел этого типа быть целью соединения |
| `canHaveOutgoingEdges` | `boolean` | Может ли узел этого типа быть источником данных |
| `allowedInputTypes` | `Array<string>` | Какие типы могут входить в этот узел (если пустой массив – любые) |
| `allowedOutputTypes` | `Array<string>` | Каким типам может передавать данные этот узел |
| `defaultValue` | `any` | Значение по умолчанию |

### `getTypeDefinition(typeName)`

Возвращает определение типа по его имени.

```javascript
const def = typeSystem.getTypeDefinition(DataType.NUM);
console.log(def.name); // 'Число' или 'Number' в зависимости от локали
console.log(def.canHaveIncomingEdges); // false
```

### `canConnect(sourceType, sourceNodeType, targetType, targetNodeType)`

Основной метод проверки допустимости соединения.

```javascript
const canConnect = typeSystem.canConnect(
  DataType.NUM,    // тип источника
  'number',        // тип узла-источника (строка из node.type)
  DataType.AUTO,   // тип приёмника
  'output'         // тип узла-приёмника
);
// Возвращает: true или false
```

**Алгоритм:**
1. Получить определение источника (`sourceDef`) и приёмника (`targetDef`)
2. Если определения отсутствуют – `false`
3. Если приёмник не может иметь входящих рёбер – `false`
4. Если источник не может иметь исходящих рёбер – `false`
5. Если у приёмника `allowedInputTypes` пуст – `true` (разрешены любые типы)
6. Иначе – проверяет, содержится ли `sourceType` в `allowedInputTypes` приёмника

### `getNodeType(node)`

Определяет тип конкретного экземпляра узла на основе его свойств.

```javascript
const nodeType = typeSystem.getNodeType(someNode);
// Возвращает одну из констант DataType
```

**Логика определения:**

| Условие | Возвращаемый тип |
|---------|------------------|
| `node.type === 'number'` | `DataType.NUM` |
| `node.type === 'constant'` | `DataType.NUM` |
| `node.type === 'group'` | `DataType.ARRAY` |
| `node.type === 'output'` | `DataType.AUTO` |
| `node.type === 'calc'` | `DataType.UNCERT` |
| `node.type === 'map'` и `node.unmappedMode === 'passthrough'` | `DataType.LIST` |
| `node.type === 'map'` и `node.unmappedMode === 'separate'` | `DataType.WLIST` |
| `node.type === 'confidenceInterval'` | `DataType.INTERVAL` |
| `node.type === 'новое условие'` | `DataType..` |
| иначе | `DataType.NUM` |

## Система встроенных типов

При создании экземпляра `TypeSystem` автоматически регистрируются типы, НАПРИМЕР:

### `NUM` (Число)

```javascript
{
  name: 'Число' / 'Number',
  canHaveIncomingEdges: false,
  canHaveOutgoingEdges: true,
  allowedInputTypes: [],
  allowedOutputTypes: [DataType.NUM, DataType.ARRAY, DataType.AUTO, DataType.UNCERT, DataType.LIST, DataType.WLIST],
  defaultValue: 0
}
```
## Примеры использования

### Проверка совместимости типов перед созданием соединения

```javascript
import { DataType, typeSystem } from './core/DataType.js';

function canCreateConnection(sourceNode, targetNode) {
  const sourceType = typeSystem.getNodeType(sourceNode);
  const targetType = typeSystem.getNodeType(targetNode);
  
  return typeSystem.canConnect(
    sourceType,
    sourceNode.type,
    targetType,
    targetNode.type
  );
}

// Использование:
const numberNode = graph.getNode(1);
const mapNode = graph.getNode(2);

if (canCreateConnection(numberNode, mapNode)) {
  const edge = graph.addEdge(1, 2);
} else {
  console.log('Типы несовместимы');
}
```

### Получение информации о типе узла

```javascript
import { DataType, typeSystem } from './core/DataType.js';

function describeNode(node) {
  const typeCode = typeSystem.getNodeType(node);
  const definition = typeSystem.getTypeDefinition(typeCode);
  
  return {
    code: typeCode,
    name: definition.name,
    canReceive: definition.canHaveIncomingEdges,
    canSend: definition.canHaveOutgoingEdges
  };
}

// Результат для NumberNode:
// { code: 'num', name: 'Число', canReceive: false, canSend: true }
```

## Расширение системы типов

```javascript
import { DataType, TypeSystem } from './core/DataType.js';

const customTypeSystem = new TypeSystem();

// Добавляем новый тип "Матрица"
customTypeSystem.registerType('matrix', {
  name: 'Матрица',
  canHaveIncomingEdges: true,
  canHaveOutgoingEdges: true,
  allowedInputTypes: [DataType.ARRAY, DataType.NUM],
  allowedOutputTypes: [DataType.AUTO, DataType.UNCERT],
  defaultValue: []
});

// Регистрируем в константах
const DataTypeExtended = {
  ...DataType,
  MATRIX: 'matrix'
};
```

## Исключения и ошибки

- При попытке соединить несовместимые типы через `typeSystem.canConnect()` возвращается `false`. Вызывающий код должен обработать этот случай (в `Graph.addEdge()` показывается модальное окно).
- Если тип не зарегистрирован, `getTypeDefinition()` возвращает `undefined`.
- При передаче `null` или `undefined` в `getNodeType()` метод вернёт `DataType.NUM` (fallback).

## Интеграция с другими модулями

**Graph.js:**
```javascript
import { typeSystem, DataType } from './DataType.js';

canConnect(sourceId, targetId) {
  const sourceType = typeSystem.getNodeType(source);
  const targetType = typeSystem.getNodeType(target);
  return typeSystem.canConnect(sourceType, source.type, targetType, target.type);
}
```

**ConfidenceIntervalNode.js:**
```javascript
import { typeSystem, DataType } from '../core/DataType.js';

const sourceType = typeSystem.getNodeType(source);
if (sourceType === DataType.UNCERT || sourceType === DataType.INTERVAL) {
  // это вход с погрешностью
}
```

## Производительность

- Все проверки – O(1) благодаря использованию `Map` для хранения определений.
- `getNodeType()` – простые сравнения строк, без рекурсии.
- Рекомендуется кэшировать результат `getNodeType()` при многократных вызовах для одного узла.

## Расширение и кастомизация

Для добавления нового типа узла в систему:

1. Создать класс узла, наследующий `Node`
2. Добавить проверку в `getNodeType()` (или модифицировать метод)
3. Зарегистрировать тип через `registerType()` с соответствующими правилами
4. Обновить фабрику `NodeFactory` для создания нового узла

```javascript
// Пример добавления нового типа "Фильтр"
class FilterNode extends Node {
  // реализация...
}

// В TypeSystem.registerBuiltinTypes() добавить:
this.registerType('filter', {
  name: 'Фильтр',
  canHaveIncomingEdges: true,
  canHaveOutgoingEdges: true,
  allowedInputTypes: [DataType.NUM, DataType.ARRAY],
  allowedOutputTypes: [DataType.NUM, DataType.ARRAY],
  defaultValue: []
});
```
