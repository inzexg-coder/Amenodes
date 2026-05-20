# `Node`

## ОПИСАНИЕ

`Node` – абстрактный базовый класс, от которого наследуются все специализированные узлы Amenodes. Класс определяет интерфейс для:

- хранения позиции и идентификации узла;
- редактирования заголовка узла;
- получения вычисляемых значений;
- обработки присоединения/отсоединения узла к графу;
- создания DOM-представления узла;
- сериализации состояния узла;
- реакцию на смену языка интерфейса.

**Важно:** Класс является абстрактным – метод `createDOM` должен быть переопределён в производных классах. Прямое создание экземпляров `Node` не допускается.

## ЗАВИСИМОСТИ

```javascript
import { EditableTitle } from '../ui/EditableTitle.js';
import { i18n } from '../i18n/LanguageManager.js';
```

# КЛАСС NODE

## Конструктор

```javascript
constructor(id: number, type: string, x: number, y: number, title: string, options: object = {})
```

Создаёт новый экземпляр узла с указанными параметрами.

**Параметры:**

| Имя | Тип | Описание |
|-----|-----|----------|
| `id` | `number` | Уникальный числовой идентификатор узла (может быть `null` или `undefined`, тогда ID будет присвоен графом). |
| `type` | `string` | Строковый идентификатор типа узла (например, `'number'`, `'output'`). |
| `x` | `number` | Координата X в системе координат графа. |
| `y` | `number` | Координата Y в системе координат графа. |
| `title` | `string` | Отображаемый заголовок узла. |
| `options` | `object` | Дополнительные параметры, которые копируются в экземпляр через `Object.assign`. |

**Инициализируемые свойства:**

| Свойство | Тип | Начальное значение | Описание |
|----------|-----|--------------------|----------|
| `this.id` | `number` | из параметра | Уникальный идентификатор узла. |
| `this.type` | `string` | из параметра | Тип узла. |
| `this.x` | `number` | из параметра | Координата X. |
| `this.y` | `number` | из параметра | Координата Y. |
| `this.title` | `string` | из параметра | Отображаемый заголовок. |
| `this.important` | `boolean` | `false` | Флаг важности узла (визуальное выделение). |
| `this.graph` | `Graph \| null` | `null` | Ссылка на граф, которому принадлежит узел (устанавливается в `onAttach`). |
| `this.originalTitle` | `string` | из параметра | Оригинальный заголовок до применения i18n. |
| `this.titleEditor` | `EditableTitle \| null` | `null` | Экземпляр компонента редактирования заголовка. |
| `this.unsubscribeI18n` | `Function \| null` | `null` | Функция отписки от событий i18n. |

## Публичные свойства

| Свойство | Тип | Доступ | Описание |
|----------|-----|--------|----------|
| `id` | `number` | чтение/запись | Идентификатор узла. |
| `type` | `string` | чтение | Тип узла (не изменяется после создания). |
| `x` | `number` | чтение/запись | Координата X. |
| `y` | `number` | чтение/запись | Координата Y. |
| `title` | `string` | чтение/запись | Отображаемый заголовок. |
| `important` | `boolean` | чтение/запись | Флаг важности узла. |
| `graph` | `Graph \| null` | чтение | Ссылка на граф. |

# Методы

## getValue()

```javascript
getValue(): Array<any>
```

Возвращает основное выходное значение узла. Базовый метод возвращает пустой массив `[]`. Должен быть переопределён в производных классах.

**Возвращает:** массив значений. Для узлов с одним значением возвращает массив из одного элемента.

**Пример переопределения:**

```javascript
class NumberNode extends Node {
  getValue() {
    return [this.value];
  }
}
```

## getOutputValue(port, visited, graph)

```javascript
getOutputValue(port: string = 'main', visited: Set<number> = new Set(), graph: Graph = null): Array<any>
```

Возвращает значение для указанного порта выхода, вызывает `this.getValue()`. Может быть переопределён в узлах с несколькими портами вывода.

**Параметры:**

| Имя | Тип | Описание |
|-----|-----|----------|
| `port` | `string` | Имя порта (по умолчанию `'main'`). |
| `visited` | `Set<number>` | Набор идентификаторов уже посещённых узлов (для предотвращения циклов). |
| `graph` | `Graph \| null` | Ссылка на граф (может использоваться для получения дополнительных данных). |

**Возвращает:** массив значений для указанного порта.

## canAcceptEdge(source, port)

```javascript
canAcceptEdge(source: Node, port: string = 'main'): { ok: boolean, message?: string }
```

Определяет, может ли узел принять входящее соединение от указанного источника. Базовый метод возвращает `{ ok: true }`. Переопределяется в узлах с ограничениями.

**Параметры:**

| Имя | Тип | Описание |
|-----|-----|----------|
| `source` | `Node` | Узел-источник, пытающийся соединиться. |
| `port` | `string` | Имя порта (по умолчанию `'main'`). |

**Возвращает:** объект с полями:
- `ok` – `boolean`, разрешено ли соединение;
- `message` – опциональное сообщение об ошибке для отображения пользователю.

**Пример:**

```javascript
canAcceptEdge(source, port) {
  const incoming = this.graph?.getIncomingEdges(this.id) || [];
  if (incoming.length >= 2) {
    return { ok: false, message: 'Maximum two inputs allowed' };
  }
  return { ok: true };
}
```

## onAttach(graph)

```javascript
onAttach(graph: Graph): void
```

Вызывается автоматически при добавлении узла в граф. Используется для инициализации ссылки на граф и выполнения действий, требующих доступа к графу.

**Параметры:**

| Имя | Тип | Описание |
|-----|-----|----------|
| `graph` | `Graph` | Экземпляр графа, в который добавлен узел. |

**Базовое поведение:** устанавливает `this.graph = graph`.

**Пример переопределения:**

```javascript
onAttach(graph) {
  super.onAttach(graph);
  this.initializeFromGraph(graph);
}
```

## onDetach()

```javascript
onDetach(): void
```

Вызывается автоматически при удалении узла из графа. Используется для очистки ресурсов и обнуления ссылок.

**Базовое поведение:** устанавливает `this.graph = null`.

## reevaluate(graph)

```javascript
reevaluate(graph: Graph): void
```

Вызывается при необходимости пересчитать внутреннее состояние узла на основе текущих входных данных. Базовый метод не выполняет действий. Переопределяется в узлах, выполняющих вычисления.

**Параметры:**

| Имя | Тип | Описание |
|-----|-----|----------|
| `graph` | `Graph` | Экземпляр графа (используется для получения входных данных). |

**Пример переопределения:**

```javascript
reevaluate(graph) {
  const input = graph.getMergedInput(this.id);
  if (!input.length) {
    this.result = null;
    return;
  }
  this.result = input.map(v => v * 2);
}
```

## updateDisplay(graph)

```javascript
updateDisplay(graph: Graph): void
```

Вызывается для обновления отображаемых данных без полного пересчёта логики. Базовый метод не выполняет действий. Переопределяется в узлах, отображающих вычисленные результаты.

**Параметры:**

| Имя | Тип | Описание |
|-----|-----|----------|
| `graph` | `Graph` | Экземпляр графа. |

## getLocalizedTitle()

```javascript
getLocalizedTitle(): string
```

Возвращает локализованную версию заголовка узла. Логика работы:

1. Если заголовок был изменён пользователем (`this.title !== this.originalTitle`), возвращает текущий заголовок без локализации.
2. Иначе пытается получить перевод по ключу `nodes.${this.type}` через `i18n.t`.
3. Если перевод отсутствует, возвращает оригинальный заголовок.

**Возвращает:** локализованную строку заголовка.

## updateTitleTranslation()

```javascript
updateTitleTranslation(): void
```

Обновляет заголовок узла в соответствии с текущим языком. Вызывается автоматически при смене языка через подписку `i18n.subscribe`. Не переопределяется.

- Если заголовок не был изменён пользователем, обновляет `this.title` и `this.originalTitle`.
- Если существует активный `titleEditor`, обновляет его отображаемое значение.

## toJSON()

```javascript
toJSON(): object
```

Сериализует узел в простой JavaScript-объект для сохранения. Базовый метод возвращает:

```javascript
{
  id: this.id,
  type: this.type,
  x: this.x,
  y: this.y,
  title: this.title,
  important: this.important,
  originalTitle: this.originalTitle
}
```

**Возвращает:** объект с основными полями узла.

**Примечание:** производные классы должны вызывать `super.toJSON()` и расширять возвращаемый объект.

**Пример переопределения:**

```javascript
toJSON() {
  return {
    ...super.toJSON(),
    value: this.value,
    customField: this.customField
  };
}
```

## getMinHeight()

```javascript
getMinHeight(): number
```

Возвращает минимальную высоту узла в пикселях для корректного позиционирования и расчёта видимости. Базовый метод возвращает `80`.

**Возвращает:** минимальную высоту узла.

**Пример переопределения:**

```javascript
getMinHeight() {
  return Math.max(80, 80 + this.values.length * 40);
}
```

## createBaseDiv(graph, renderer, headerClass)

```javascript
createBaseDiv(graph: Graph, renderer: DomRenderer, headerClass: string = 'node-header'): HTMLDivElement
```

Создаёт базовый DOM-элемент узла (контейнер с заголовком, кнопкой удаления, системой редактирования заголовка). Используется производными классами как основа для создания полного DOM-представления.

**Параметры:**

| Имя | Тип | Описание |
|-----|-----|----------|
| `graph` | `Graph` | Экземпляр графа. |
| `renderer` | `DomRenderer` | Экземпляр рендерера. |
| `headerClass` | `string` | CSS-класс для заголовка узла (по умолчанию `'node-header'`). |

**Создаваемая структура:**

```html
<div class="node" data-id="..." data-type="..." style="left: ...; top: ...">
  <div class="[headerClass]">
    <span class="title-display">...</span>  <!-- или input при редактировании -->
    <div class="node-actions">
      <button>✕</button>
    </div>
  </div>
</div>
```

- Создаёт экземпляр `EditableTitle` для заголовка.
- Подписывается на события i18n для автоматического обновления заголовка при смене языка.
- Устанавливает обработчик удаления узла.

**Возвращает:** корневой `div` элемента узла.

## createDOM(graph, renderer)

```javascript
createDOM(graph: Graph, renderer: DomRenderer): HTMLDivElement
```

**Абстрактный метод.** Должен быть переопределён в каждом производном классе. Создаёт полное DOM-представление узла, включая контент и элементы управления.

**Параметры:**

| Имя | Тип | Описание |
|-----|-----|----------|
| `graph` | `Graph` | Экземпляр графа. |
| `renderer` | `DomRenderer` | Экземпляр рендерера (для вызова `addHandles`, `applyOptStyles`). |

**Возвращает:** корневой `div` элемента узла.

**Требования к реализации:**

1. Должен вызывать `this.createBaseDiv` для создания базовой структуры.
2. Должен добавлять специфический контент (например, поля ввода, таблицы, кнопки).
3. Должен вызывать `renderer.addHandles(div, this.id, unmappedPort)` для добавления портов соединения.
4. Должен вызывать `renderer.applyOptStyles(div)` для применения оптимизаций.
5. При необходимости должен подписываться на события i18n и корректно отписываться при удалении.

**Пример реализации:**

```javascript
createDOM(graph, renderer) {
  const div = this.createBaseDiv(graph, renderer);
  const content = document.createElement('div');
  content.className = 'node-content';
  content.textContent = this.getValue();
  div.appendChild(content);
  renderer.addHandles(div, this.id, null);
  renderer.applyOptStyles(div);
  return div;
}
```

# МЕТАДАННЫЕ (СТАТИЧЕСКОЕ СВОЙСТВО)

Каждый производный класс **должен** экспортировать объект `metadata` со следующей структурой:

```javascript
export const metadata = {
  type: string,                    // уникальный идентификатор типа узла
  nameKey: string,                 // ключ перевода для названия (например, 'nodes.number')
  descriptionKey: string,          // ключ перевода для описания (например, 'nodeDescriptions.number')
  author: string,                  // имя автора узла
  github?: string,                 // URL GitHub автора (опционально)
  icon: string,                    // иконка Font Awesome ('fa-hashtag')
  dataType: string,                // тип данных узла
  canHaveIncomingEdges: boolean,   // может ли узел иметь входящие соединения
  canHaveOutgoingEdges: boolean,   // может ли узел иметь исходящие соединения
  allowedInputTypes: Array<string>,// массив допустимых типов для входящих соединений
  allowedOutputTypes: Array<string>,// массив допустимых типов для исходящих соединений
  defaultValue: any,               // значение по умолчанию (используется при создании)
  isCategory?: boolean,            // является ли узел категорией-контейнером
  categoryName?: string,           // ключ перевода для названия категории (если isCategory: true)
  subnodes?: Array<object>         // дочерние узлы для категории (если isCategory: true)
};
```

# ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ

## Создание производного узла

```javascript
import { Node } from '../core/Node.js';

export const metadata = {
  type: 'number',
  nameKey: 'nodes.number',
  descriptionKey: 'nodeDescriptions.number',
  author: 'Amenoke',
  icon: 'fa-hashtag',
  dataType: 'num',
  canHaveIncomingEdges: false,
  canHaveOutgoingEdges: true,
  allowedInputTypes: [],
  allowedOutputTypes: ['num', 'array', 'auto', 'uncert', 'list', 'wlist'],
  defaultValue: 0
};

export class NumberNode extends Node {
  constructor(id, x, y, title, options = {}) {
    super(id, 'number', x, y, title, options);
    this.value = options.val ?? 0;
  }

  getValue() {
    return [this.value];
  }

  toJSON() {
    return { ...super.toJSON(), val: this.value };
  }

  createDOM(graph, renderer) {
    const div = this.createBaseDiv(graph, renderer);
    const content = document.createElement('div');
    content.className = 'empty-node-content';
    
    const input = document.createElement('input');
    input.type = 'number';
    input.value = this.value;
    input.onchange = () => {
      this.value = parseFloat(input.value) || 0;
      graph.reevaluateAll();
      renderer.render();
      renderer.save();
    };
    
    content.appendChild(input);
    div.appendChild(content);
    renderer.addHandles(div, this.id, null);
    renderer.applyOptStyles(div);
    
    return div;
  }
}
```

## Использование узла в графе

```javascript
const graph = new Graph();
const numberNode = new NumberNode(null, 100, 100, 'Value', { val: 42 });

graph.addNode(numberNode);
console.log(numberNode.getValue()); // [42]
console.log(numberNode.getLocalizedTitle()); // 'Value' или локализованный вариант

// Изменение значения через DOM будет автоматически обновлять граф
```

## Статический метод onCreate для сложного создания

Некоторые узлы могут определять статический метод `onCreate` для выполнения асинхронных операций перед созданием (например, запрос значения через модальное окно):

```javascript
static async onCreate(graph, x, y, options = {}) {
  const value = await modal.prompt('Enter value', '0');
  if (value === null) return null;
  
  const numValue = parseFloat(value);
  const node = new NumberNode(null, x, y, 'Number', { val: numValue });
  graph.addNode(node);
  return node;
}
```

# ЗАМЕЧАНИЯ

- Все производные классы **обязаны** экспортировать `metadata`. Без этого узел не будет зарегистрирован в `nodeRegistry`.
- Метод `createDOM` вызывается рендерером каждый раз при необходимости отрисовать узел. Для оптимизации используется кэширование DOM-элементов – не следует создавать тяжёлые структуры данных внутри этого метода.
- При переопределении `toJSON()` необходимо сохранять все поля, необходимые для полного восстановления состояния узла.
- Подписка на i18n в `createBaseDiv` автоматически создаёт `unsubscribeI18n`, который должен быть вызван при удалении узла. Базовый класс не удаляет эту подписку автоматически – она удаляется в кнопке удаления, создаваемой `createBaseDiv`.
- Метод `getMinHeight` используется для виртуализации и кэширования высоты. Если высота узла динамически изменяется, необходимо вызывать `renderer.invalidateCache(node.id)` для сброса кэша.
