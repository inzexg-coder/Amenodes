# `DataType` 

## ОПИСАНИЕ

Модуль `DataType` реализует систему типов данных для Amenodes, обеспечивающую проверку совместимости при соединении узлов и централизованное управление определениями типов. 
Система предотвращает некорректные соединения и обеспечивает типобезопасность графа.

**Основные возможности:**

- регистрация типов данных с их свойствами;
- проверка совместимости между типами при создании соединений;
- автоматическое извлечение типа узла через метаданные конструктора;
- глобальный доступ к типам через объект `DataType`.

**Важно:** система типов является опциональной – узлы без зарегистрированного типа считаются имеющими тип `'unknown'` и подчиняются минимальным ограничениям.

## ЗАВИСИМОСТИ

Модуль не имеет внешних зависимостей.

# ЭКСПОРТЫ

## DataType

```javascript
export const DataType: object
```

Пустой объект, который заполняется динамически при регистрации типов через метод `TypeSystem.registerType()`. Для каждого зарегистрированного типа создаётся свойство с именем типа в верхнем регистре, содержащее строковое значение типа.

**Пример после регистрации:**

```javascript
typeSystem.registerType('num', definition);
// DataType.NUM === 'num'
```

**Назначение:** предоставляет именованные константы для ссылок на типы в других частях приложения.

# КЛАСС TYPESYSTEM

Основной класс, управляющий определениями типов и проверкой совместимости.

## Конструктор

```javascript
constructor()
```

Создаёт новый экземпляр системы типов. Инициализирует:

| Свойство | Тип | Начальное значение | Описание |
|----------|-----|--------------------|----------|
| `this.typeDefinitions` | `Map<string, object>` | `new Map()` | Хранилище определений типов, где ключ – имя типа, значение – объект с метаданными типа. |

## Публичные свойства

| Свойство | Тип | Доступ | Описание |
|----------|-----|--------|----------|
| `typeDefinitions` | `Map<string, object>` | чтение (косвенно через `getTypeDefinition`) | Внутренняя карта определений типов. Прямой доступ не рекомендуется. |

# Методы

## registerType(typeName, definition)

```javascript
registerType(typeName: string, definition: TypeDefinition): void
```

Регистрирует новый тип данных в системе. После регистрации:

- определение типа сохраняется в `this.typeDefinitions` под ключом `typeName`;
- в глобальном объекте `DataType` создаётся свойство `DataType[typeName.toUpperCase()]` со значением `typeName`.

**Параметры:**

- `typeName` – строковый идентификатор типа. Рекомендуется использовать строчные буквы.
- `definition` – объект определения типа со следующей структурой (см. **Структура определения типа**).

**Структура определения типа:**

```javascript
{
  name: string,                    // Отображаемое имя типа (локализуется отдельно)
  canHaveIncomingEdges: boolean,   // Может ли тип принимать входящие соединения (по умолчанию true)
  canHaveOutgoingEdges: boolean,   // Может ли тип иметь исходящие соединения (по умолчанию true)
  allowedInputTypes: Array<string>, // Массив имён типов, которые могут быть подключены на вход
  allowedOutputTypes: Array<string>, // Массив имён типов, которые могут быть подключены на выход
  defaultValue: any                // Значение по умолчанию для узлов этого типа
}
```

## getTypeDefinition(typeName)

```javascript
getTypeDefinition(typeName: string): object | undefined
```

Возвращает определение зарегистрированного типа или `undefined`, если тип не найден.

**Параметры:**

- `typeName` – строковый идентификатор типа.

**Возвращает:** объект определения типа или `undefined`.

## canConnect(sourceType, sourceNodeType, targetType, targetNodeType)

```javascript
canConnect(
  sourceType: string,
  sourceNodeType: string,
  targetType: string,
  targetNodeType: string
): boolean
```

Определяет, допустимо ли соединение между узлом-источником с типом `sourceType` и узлом-приёмником с типом `targetType`.

**Алгоритм проверки:**

1. Получение определений обоих типов через `getTypeDefinition`.
2. Если хотя бы одно определение отсутствует → возвращает `false`.
3. Если `targetDef.canHaveIncomingEdges === false` → возвращает `false`.
4. Если `sourceDef.canHaveOutgoingEdges === false` → возвращает `false`.
5. Если `targetDef.allowedInputTypes.length === 0` → возвращает `true` (тип принимает любые входы).
6. Проверяет вхождение `sourceType` в массив `targetDef.allowedInputTypes`.

**Параметры:**

- `sourceType` – тип источника (значение из метаданных узла).
- `sourceNodeType` – тип узла-источника (строка из `node.type`).
- `targetType` – тип приёмника.
- `targetNodeType` – тип узла-приёмника.

**Возвращает:** `true`, если соединение разрешено, иначе `false`.

## getNodeType(node)

```javascript
getNodeType(node: Node): string
```

Извлекает тип данных узла из его метаданных конструктора. Выполняет поиск в следующем порядке:

1. Проверяет `node.constructor.metadata.dataType`.
2. Если метаданные или поле `dataType` отсутствуют, возвращает `'unknown'`.

**Параметры:**

- `node` – экземпляр узла (производного от `Node`).

**Возвращает:** строку с типом данных или `'unknown'`.

**Примечание по отладке:** метод содержит `console.log` вызовы для диагностики.

## initFromNodeRegistry(nodeRegistry)

```javascript
initFromNodeRegistry(nodeRegistry: Map<string, { ctor: Function, metadata: object }>): void
```

Инициализирует систему типов на основе зарегистрированных в `nodeRegistry` узлов. Для каждой записи, содержащей поле `metadata.dataType`, автоматически регистрирует соответствующий тип.

**Параметры:**

- `nodeRegistry` – карта, где ключ – тип узла (строка), значение – объект с полями `ctor` (конструктор узла) и `metadata` (метаданные узла).

**Алгоритм:**

1. Итерирует по всем записям `nodeRegistry.entries()`.
2. Если у записи есть `metadata.dataType`:
   - Извлекает `dataType`, `dataTypeName`, `canHaveIncomingEdges`, `canHaveOutgoingEdges`, `allowedInputTypes`, `allowedOutputTypes`, `defaultValue` из метаданных.
   - Регистрирует тип через `registerType`.
3. Типы регистрируются только один раз – повторные вызовы метода приведут к повторной регистрации (возможна перезапись определений).

# ГЛОБАЛЬНЫЙ ЭКЗЕМПЛЯР

## typeSystem

```javascript
export const typeSystem = new TypeSystem();
```

Единственный глобальный экземпляр `TypeSystem`, используемый во всём приложении. Доступен для импорта в любом модуле:

```javascript
import { typeSystem, DataType } from './core/DataType.js';
```

# ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ

### Ручная регистрация типа

```javascript
import { typeSystem, DataType } from './core/DataType.js';

// Регистрация пользовательского типа
typeSystem.registerType('matrix', {
  name: 'Matrix',
  canHaveIncomingEdges: true,
  canHaveOutgoingEdges: true,
  allowedInputTypes: ['matrix', 'array'],
  allowedOutputTypes: ['matrix'],
  defaultValue: [[]]
});

console.log(DataType.MATRIX); // 'matrix'
```

### Проверка соединения в пользовательском узле

```javascript
class MyNode extends Node {
  canAcceptEdge(source, port) {
    const sourceType = typeSystem.getNodeType(source);
    const targetType = typeSystem.getNodeType(this);
    
    if (!typeSystem.canConnect(sourceType, source.type, targetType, this.type)) {
      return { ok: false, message: `Cannot connect ${sourceType} to ${targetType}` };
    }
    return { ok: true };
  }
}
```

### Автоматическая инициализация из реестра узлов

```javascript
import { nodeRegistry } from '../nodes/registry.js';
import { typeSystem } from './DataType.js';

// После загрузки всех узлов
await loadAllNodes();
typeSystem.initFromNodeRegistry(nodeRegistry);
// Теперь все типы из метаданных узлов зарегистрированы
```

# ЗАМЕЧАНИЯ

- **Консольный вывод:** метод `getNodeType` содержит отладочные `console.log` вызовы.

- **Регистрация типов:** повторная регистрация типа с тем же именем перезаписывает предыдущее определение. Это позволяет переопределять системные типы, но может привести к непредсказуемому поведению.

- **Проверка совместимости:** метод `canConnect` принимает параметры `sourceNodeType` и `targetNodeType` (например, проверки на уровне конкретных узлов, а не только типов данных).

- **Значения по умолчанию:** поле `defaultValue` в определении типа не используется системой автоматически – узлы должны самостоятельно применять его при создании.

- **Глобальный объект DataType:** заполняется динамически. Попытка доступа к `DataType..` до регистрации типа `'.'` вернёт `undefined`.
