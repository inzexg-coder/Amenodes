# registry 

## ОПИСАНИЕ

`registry` – центральный модуль регистрации узлов в приложении Amenodes. Реализует:

- динамическую загрузку всех типов узлов из манифеста;
- регистрацию конструкторов и метаданных узлов в глобальном реестре;
- асинхронную загрузку переводов для каждого узла из отдельных файлов локализации;
- слияние переводов узлов с базовой системой интернационализации;
- предоставление API для получения конструкторов и метаданных по типу узла.

**Важно:** все узлы должны быть зарегистрированы через этот модуль до их использования в приложении. Прямой импорт конструкторов узлов в других частях приложения не рекомендуется.

## ИМПОРТЫ

```javascript
import { nodesManifest } from './manifest/this-manifest.js';
import { i18n } from '../i18n/LanguageManager.js';
import { typeSystem } from '../core/DataType.js';
```

| Импорт | Назначение |
|--------|------------|
| `nodesManifest` | Массив описаний узлов из файла манифеста, содержащий конструкторы, метаданные и имена файлов. |
| `i18n` | Глобальный экземпляр `LanguageManager` для установки переводов узлов. |
| `typeSystem` | Глобальный экземпляр `TypeSystem` для регистрации типов данных узлов. |

# КОНФИГУРАЦИЯ ТИПОВ УЗЛОВ

Перед глобальными экспортами определена константа `nodeTypeConfig` — единый источник истины для всех типовых метаданных узлов. Ранее эти данные находились в каждом файле узла отдельно; теперь они централизованы здесь.

```javascript
const nodeTypeConfig = {
  number:  { dataType: 'num',   allowedInputTypes: [],                                     canHaveIncomingEdges: false, canHaveOutgoingEdges: true,  defaultValue: 0 },
  constant:{ dataType: 'num',   allowedInputTypes: [],                                     canHaveIncomingEdges: false, canHaveOutgoingEdges: true,  defaultValue: 0 },
  group:   { dataType: 'array', allowedInputTypes: [],                                     canHaveIncomingEdges: false, canHaveOutgoingEdges: true,  defaultValue: [] },
  calc:    { dataType: 'uncert',allowedInputTypes: ['num','array','uncert','list','wlist'],   canHaveIncomingEdges: true, canHaveOutgoingEdges: true,  defaultValue: null },
  output:  { dataType: 'auto',  allowedInputTypes: ['num','array','uncert','list','wlist'],   canHaveIncomingEdges: true, canHaveOutgoingEdges: false, defaultValue: null },
  map:     { dataType: 'list',  allowedInputTypes: ['num','array','uncert','list','wlist'],   canHaveIncomingEdges: true, canHaveOutgoingEdges: true,  defaultValue: [] },
  mean:    { dataType: 'num',   allowedInputTypes: ['num','array','list','wlist','uncert','auto'], canHaveIncomingEdges: true, canHaveOutgoingEdges: true, defaultValue: null },
  sem:     { dataType: 'num',   allowedInputTypes: ['array','list','wlist','num'],           canHaveIncomingEdges: true, canHaveOutgoingEdges: true,  defaultValue: null },
};
```

**Назначение полей:**

| Поле | Описание |
|------|----------|
| `dataType` | Имя типа данных, который узел отдаёт на выход. Регистрируется в `typeSystem`. |
| `allowedInputTypes` | Массив имён типов, которые могут быть подключены на вход этого узла. Если массив пуст — узел не принимает входящие соединения. |
| `canHaveIncomingEdges` | Флаг разрешения входящих соединений. |
| `canHaveOutgoingEdges` | Флаг разрешения исходящих соединений. |
| `defaultValue` | Значение по умолчанию для типа данных. |

# ГЛОБАЛЬНЫЕ ЭКСПОРТЫ

```javascript
export const nodeRegistry = new Map();
export const nodeTranslations = { en: {}, ru: {} };
```

| Экспорт | Тип | Описание |
|---------|-----|----------|
| `nodeRegistry` | `Map<string, NodeEntry>` | Реестр узлов, где ключ – строковый тип узла (`metadata.type`), значение – объект с полями `ctor` (конструктор) и `metadata`. |
| `nodeTranslations` | `object` | Объект для накопления переводов узлов. Имеет структуру `{ en: {}, другой-язык: {}, /// }`, где каждый языковой объект содержит вложенные переводы, соответствующие структуре i18n. |

### Структура NodeEntry

```javascript
{
  ctor: typeof Node,      // конструктор класса узла
  metadata: object        // метаданные узла (type, nameKey, icon, и т.д.)
}
```

# ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ

## getBaseUrl()

```javascript
function getBaseUrl(): string
```

Определяет базовый URL для загрузки файлов локализации узлов в зависимости от среды выполнения.

**Алгоритм:**

- Проверяет `window.location.pathname` на наличие подстроки `/preview/`.
- Если обнаружен режим предпросмотра, извлекает имя ветки из URL и формирует URL вида `https://amenoke.ru/preview/[branch]/src/nodes/`.
- В противном случае возвращает относительный путь `/src/nodes/`.

**Возвращает:** строку базового URL.

**Пример:**

```javascript
// В обычном режиме: '/src/nodes/'
// В режиме предпросмотра ветки 'feature': 'https://amenoke.ru/preview/feature/src/nodes/'
```

## deepMerge(target, source)

```javascript
function deepMerge(target: object, source: object): object
```

Выполняет глубокое слияние двух объектов. Рекурсивно объединяет вложенные структуры, при этом массив не обрабатывается особым образом (заменяется полностью).

**Параметры:**

- `target` – целевой объект (мутируется).
- `source` – объект-источник. Если `source` равен `null` или `undefined`, возвращает `target` без изменений.

**Алгоритм:**

- Создаёт поверхностную копию `target` через спред-оператор.
- Для каждого ключа в `source`:
  - Если значение в `source` является объектом (не массивом) и соответствующий ключ существует в `target`, рекурсивно вызывает `deepMerge`.
  - В противном случае присваивает значение из `source` напрямую.

**Возвращает:** новый объект, представляющий собой результат слияния (оригинальный `target` не изменяется).

**Пример:**

```javascript
const target = { a: 1, b: { x: 10, y: 20 } };
const source = { b: { y: 30, z: 40 }, c: 5 };
const result = deepMerge(target, source);
// result: { a: 1, b: { x: 10, y: 30, z: 40 }, c: 5 }
```

## loadTranslationsForNode(fileName)

```javascript
async function loadTranslationsForNode(fileName: string): Promise<void>
```

Асинхронно загружает файлы переводов для конкретного узла. Пытается загрузить сначала английскую (`en`), затем другую языковую версию. При успешной загрузке выполняет глубокое слияние переводов с глобальным объектом `nodeTranslations`.

**Параметры:**

- `fileName` – имя файла узла. Метод автоматически удаляет расширение `.js` для формирования пути.

**Алгоритм:**

- Формирует базовое имя файла (без расширения `.js`).
- Для английского языка: пытается динамически импортировать модуль по пути `${baseUrl}locales/en/${baseName}.js`.
- Для другого языка: пытается динамически импортировать модуль по пути `${baseUrl}locales/код-языка/${baseName}.js`.
- При успешном импорте выполняет глубокое слияние `module.default` с соответствующим языковым объектом в `nodeTranslations`.
- Неудачные импорты логируются через `console.warn`, но не прерывают выполнение.

- Модифицирует глобальный объект `nodeTranslations`.
- Выводит сообщения в консоль при успешной или неудачной загрузке.

## registerAllNodes()

```javascript
async function registerAllNodes(): Promise<void>
```

Основная функция регистрации всех узлов, описанных в манифесте. Проходит по массиву `nodesManifest`, для каждой записи:

1. Проверяет наличие метаданных и поля `type`.
2. Регистрирует конструктор и метаданные в `nodeRegistry`.
3. Добавляет ссылку на метаданные в статическое свойство конструктора `ctor.metadata`.
4. Загружает переводы для соответствующего файла через `loadTranslationsForNode`.

После обработки всех узлов вызывает `i18n.setNodeTranslations(nodeTranslations)` для интеграции переводов в основную систему интернационализации.

- Заполняет `nodeRegistry`.
- Добавляет свойство `metadata` к каждому зарегистрированному конструктору.
- Модифицирует `nodeTranslations`.
- Выводит в консоль количество зарегистрированных узлов и список секций переводов.

# ПУБЛИЧНЫЕ ФУНКЦИИ

## loadAllNodes()

```javascript
export async function loadAllNodes(): Promise<void>
```

Главная точка входа для загрузки всех узлов. Просто вызывает `registerAllNodes()`. Должна быть вызвана один раз при инициализации приложения до создания любых узлов.

**Пример:**

```javascript
import { loadAllNodes } from './nodes/registry.js';

await loadAllNodes();
console.log('Все узлы загружены и зарегистрированы');
```

## getNodeClass(type)

```javascript
export function getNodeClass(type: string): typeof Node | null
```

Возвращает конструктор класса узла по его строковому идентификатору.

**Параметры:**

- `type` – строковый идентификатор типа узла (значение `metadata.type`).

**Возвращает:** конструктор класса, производного от `Node`, или `null`, если тип не зарегистрирован.

## getNodeMetadata(type)

```javascript
export function getNodeMetadata(type: string): object | null
```

Возвращает метаданные узла по его строковому идентификатору.

**Параметры:**

- `type` – строковый идентификатор типа узла.

**Возвращает:** объект метаданных узла или `null`, если тип не зарегистрирован.

# ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ

### Инициализация приложения

```javascript
import { loadAllNodes, getNodeClass, getNodeMetadata } from './nodes/registry.js';
import { typeSystem } from './core/DataType.js';

async function init() {
  // Загружаем все узлы и их переводы
  await loadAllNodes();
  // Внутри registerAllNodes() уже выполнена регистрация типов
  // через typeSystem.registerType() — типы доступны для валидации соединений
  
  // Дополнительный проход initFromNodeRegistry (в main.js) регистрирует
  // те же типы повторно — это безопасно, данные совпадают.
  typeSystem.initFromNodeRegistry(nodeRegistry);
  
  // Теперь можно создавать узлы
}
```

### Проверка наличия типа узла

```javascript
import { nodeRegistry } from './nodes/registry.js';

if (nodeRegistry.has('output')) {
  console.log('Output node is registered');
  const { ctor, metadata } = nodeRegistry.get('output');
  console.log(`Author: ${metadata.author}`);
}
```

### Доступ ко всем зарегистрированным типам

```javascript
import { nodeRegistry } from './nodes/registry.js';

const allTypes = Array.from(nodeRegistry.keys());
console.log('Available node types:', allTypes);
// ['number', 'constant', 'group', 'calc', 'output', 'map', 'confidenceInterval']

for (const [type, { metadata }] of nodeRegistry.entries()) {
  console.log(`${type}: ${metadata.nameKey}`);
}
```

## ЗАМЕЧАНИЯ

- Функция `loadTranslationsForNode` не создаёт ошибку при отсутствии файлов переводов – это позволяет разрабатывать узлы без немедленного создания локализации.
- Динамические импорты в `loadTranslationsForNode` используют полные URL, сформированные с учётом окружения (предпросмотр или локальная разработка).
- Свойство `ctor.metadata` добавляется для обратной совместимости и используется в некоторых частях системы (например, в `DataType.getNodeType`).
- Манифест должен быть обновлён вручную при добавлении нового узла – автоматического сканирования файлов не происходит.
- Переводы узлов имеют приоритет над базовыми переводами из `src/i18n/locales/` благодаря глубокому слиянию, выполняемому после загрузки.
