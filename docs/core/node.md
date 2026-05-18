# `Node.md`

## Обзор

`Node` – абстрактный базовый класс, от которого наследуются все конкретные типы узлов (NumberNode, GroupNode, CalcNode и т.д.). Он предоставляет общую функциональность: управление положением, заголовком, важностью узла, а также интеграцию с системой интернационализации (i18n) и поддержку греческих/математических символов в заголовках.

**Путь в проекте:** `src/core/Node.js`

**Импорт:**
```javascript
import { Node } from '../core/Node.js';
```

**Наследование:**
```javascript
import { Node } from '../core/Node.js';

export class CustomNode extends Node {
  constructor(id, x, y, title) {
    super(id, 'custom', x, y, title);
    // специфичные поля
  }
  
  // обязательная реализация
  createDOM(graph, renderer) {
    const div = this.createBaseDiv(graph, renderer);
    // добавляем специфичное содержимое
    return div;
  }
}
```

## Конструктор

```javascript
constructor(id, type, x, y, title)
```

| Параметр | Тип | Описание |
|----------|-----|----------|
| `id` | `number` | `null` | Идентификатор узла. Если `null`, при добавлении в граф будет присвоен новый |
| `type` | `string` | Тип узла (например, `'number'`, `'calc'`, `'map'`). Используется для идентификации |
| `x` | `number` | Координата X в мировом пространстве (пиксели) |
| `y` | `number` | Координата Y в мировом пространстве (пиксели) |
| `title` | `string` | Заголовок узла. Поддерживает греческие символы через `$alpha`, `$mu` и т.д. |

**Пример:**
```javascript
const node = new CustomNode(null, 150, 200, 'My $mu Node');
console.log(node.title); // 'My $mu Node' (с символом μ при отображении)
```

**Внутренние свойства:**
| Свойство | Тип | Описание |
|----------|-----|----------|
| `id` | `number` | Уникальный идентификатор |
| `type` | `string` | Тип узла (readonly) |
| `x` | `number` | X-координата |
| `y` | `number` | Y-координата |
| `title` | `string` | Текущий заголовок (может быть изменён пользователем) |
| `originalTitle` | `string` | Исходный заголовок (до ручного редактирования) |
| `important` | `boolean` | Флаг важности узла (визуальное выделение) |
| `graph` | `Graph` | `null` | Ссылка на граф, содержащий узел |
| `titleEditor` | `EditableTitle` | `null` | Компонент редактирования заголовка |
| `unsubscribeI18n` | `Function` | `null` | Функция отписки от событий i18n |

## Методы для переопределения

### `getValue()`

Абстрактный метод – должен быть переопределён в наследуемых классах.

**Должен возвращать:** `Array<number>` – массив числовых значений, которые выдаёт узел.

```javascript
// Пример из NumberNode
getValue() {
  return [this.value];
}

// Пример из GroupNode
getValue() {
  return this.values.map(v => typeof v.val === 'number' ? v.val : parseFloat(v.val))
    .filter(v => !isNaN(v));
}
```

### `createDOM(graph, renderer)`

Абстрактный метод – обязательная реализация в наследуемых классах. Возвращает корневой DOM-элемент узла.

**Параметры:**
- `graph: Graph` – ссылка на граф
- `renderer: DomRenderer` – ссылка на рендерер

**Возвращает:** `HTMLDivElement`

```javascript
createDOM(graph, renderer) {
  const div = this.createBaseDiv(graph, renderer);
  // добавляем специфичное содержимое
  renderer.addHandles(div, this.id, null);
  renderer.applyOptStyles(div);
  return div;
}
```

### `getMinHeight()`

Опциональный метод – минимальная высота узла в пикселях.

**По умолчанию:** `80`

```javascript
// Пример из GroupNode (высота зависит от количества элементов)
getMinHeight() {
  return Math.max(80, 80 + this.values.length * 40);
}
```

## Методы для работы с заголовком

### `getLocalizedTitle()`

Возвращает локализованный заголовок узла. Логика:
1. Если заголовок был изменён пользователем (не совпадает с `originalTitle`), возвращает текущий `title`
2. Иначе пытается получить перевод через `i18n.t(nodes.${this.type})`
3. Если перевода нет, возвращает оригинальный заголовок

```javascript
const node = new NumberNode(1, 0, 0, null, 42);
console.log(node.getLocalizedTitle()); // 'Number' (при активном английском)
// или 'Число' (при активном русском)
```

### `updateTitleTranslation()`

Обновляет заголовок при смене языка, если пользователь не редактировал его вручную. Вызывается автоматически через подписку i18n.

## Работа с DOM

### `createBaseDiv(graph, renderer, headerClass = 'node-header')`

Создаёт базовую структуру узла:
- Контейнер `.node` с атрибутами `data-id` и `data-type`
- Позиционирование через `style.left` и `style.top`
- Заголовочный блок с редактируемым заголовком и кнопкой удаления
- Обработчик i18n для автоматического обновления заголовка

**Параметры:**
- `graph: Graph` – ссылка на граф
- `renderer: DomRenderer` – ссылка на рендерер
- `headerClass: string` – CSS-класс для заголовка (по умолчанию `'node-header'`)

**Возвращает:** `HTMLDivElement` – контейнер узла без специфичного содержимого.

```javascript
// Использование в наследуемом классе
createDOM(graph, renderer) {
  const div = this.createBaseDiv(graph, renderer, 'custom-header');
  // div теперь имеет заголовок и кнопку удаления
  const content = document.createElement('div');
  content.textContent = 'Custom content';
  div.appendChild(content);
  return div;
}
```

## Сериализация

### `toJSON()`

Возвращает объект для сохранения. Базовый объект включает:

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

Наследники должны переопределять метод, добавляя свои поля через `super.toJSON()`:

```javascript
toJSON() {
  return {
    ...super.toJSON(),
    customField: this.customField
  };
}
```

## Пример реализации собственного узла

```javascript
import { Node } from '../core/Node.js';
import { i18n } from '../i18n/LanguageManager.js';

export class MultiplierNode extends Node {
  constructor(id, x, y, title, factor = 2) {
    super(id, 'multiplier', x, y, title);
    this.factor = factor;
    this.result = null;
  }

  getValue() {
    if (!this.graph) return [];
    const input = this.graph.getMergedInput(this.id);
    if (!input.length) return [];
    this.result = input.map(v => v * this.factor);
    return this.result;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      factor: this.factor
    };
  }

  createDOM(graph, renderer) {
    const div = this.createBaseDiv(graph, renderer, 'multiplier-header');
    
    const content = document.createElement('div');
    content.className = 'multiplier-content';
    
    // Поле для редактирования множителя
    const factorInput = document.createElement('input');
    factorInput.type = 'number';
    factorInput.value = this.factor;
    factorInput.step = 'any';
    factorInput.onchange = () => {
      this.factor = parseFloat(factorInput.value) || 1;
      graph.reevaluateAll();
      renderer.render();
      renderer.save();
    };
    
    // Отображение результата
    const resultDiv = document.createElement('div');
    resultDiv.className = 'multiplier-result';
    
    const updateResult = () => {
      const val = this.getValue();
      if (val.length) {
        resultDiv.textContent = `Result: [${val.map(v => v.toFixed(4)).join(', ')}]`;
      } else {
        resultDiv.textContent = 'Result: --';
      }
    };
    
    updateResult();
    
    content.appendChild(factorInput);
    content.appendChild(resultDiv);
    div.appendChild(content);
    
    renderer.addHandles(div, this.id, null);
    renderer.applyOptStyles(div);
    
    return div;
  }
}
```

## Интеграция с i18n

Класс `Node` автоматически подписывается на события смены языка через `i18n.subscribe()`. При изменении языка:
1. Вызывается `updateTitleTranslation()`
2. Если заголовок не был отредактирован вручную, он обновляется на переведённую версию
3. `titleEditor` (если существует) обновляет отображаемый текст

**Отписка:** При удалении узла через кнопку `✕` вызывается `unsubscribeI18n()`.

## Визуальные состояния

### Важность узла (`important`)

Узлы с флагом `important: true` получают CSS-класс `node-important`, что даёт:
- Синее свечение (`box-shadow: 0 0 0 3px #00aaff`)
- Повышенный z-index (21 вместо 20)

```javascript
node.important = true;
renderer.updateNodeClass(node); // обновляет класс в DOM
```

### CSS-классы заголовков

Базовый класс `.node-header` может быть заменён через параметр `headerClass` в `createBaseDiv()` НАПРИМЕР:
- `'node-header'` – для стандартных узлов
- `'output-header'` – для узлов вывода (синий оттенок)
- `'calc-header'` – для узлов погрешности
- `'map-header'` – для узлов карты
- `'group-header'` – для групповых узлов

## Внутренние зависимости

| Зависимость | Назначение |
|-------------|------------|
| `EditableTitle` | Создание редактируемого заголовка |
| `i18n` | Локализация заголовков и подписка на смену языка |
| `replaceSymbols` (через EditableTitle) | Замена $alpha → α и т.д. |

## Наследование и цепочка вызовов

```
Node (абстрактный)
└── Любой узел
```

**При создании нового типа узла необходимо:**
1. Унаследоваться от `Node`
2. Реализовать `getValue()`, возвращающий `Array<number>`
3. Реализовать `createDOM()`, используя `createBaseDiv()` как основу
4. Переопределить `toJSON()` для сохранения дополнительных полей
5. При необходимости переопределить `getMinHeight()` для динамической высоты

## Исключения и ошибки

- **Отсутствие реализации `createDOM()`** – вызовет ошибку времени выполнения при рендеринге
- **Отсутствие реализации `getValue()`** – вызовет ошибку при вычислениях
- **Некорректный `type`** – может привести к проблемам при загрузке из JSON (фабрика не сможет восстановить узел)

## Совместимость с оптимизациями

- `renderer.applyOptStyles(div)` применяет `will-change` и `contain` в зависимости от настроек
- При включённой виртуализации узел может быть удалён из DOM, но оставаться в `elementCache` рендерера
- Изменение положения узла через `node.x` и `node.y` должно сопровождаться вызовом `renderer.render()` для обновления позиции
