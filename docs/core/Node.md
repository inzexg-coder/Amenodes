# `Node`

## ОПИСАНИЕ

`Node` – абстрактный базовый класс, от которого наследуются все специализированные узлы Amenodes. Класс определяет интерфейс для:

- хранения позиции и идентификации узла;
- редактирования заголовка узла с сохранением пользовательских изменений;
- получения вычисляемых значений;
- обработки присоединения/отсоединения узла к графу;
- создания DOM-представления узла;
- сериализации состояния узла;
- реакции на смену языка интерфейса с сохранением пользовательских заголовков;
- **отображения dirty-индикатора (звёздочки) при несохранённых изменениях графа.**

**Важно:** Класс является абстрактным – метод `createDOM` должен быть переопределён в производных классах. Прямое создание экземпляров `Node` не допускается.

## ЗАВИСИМОСТИ

```javascript
import { EditableTitle } from '../ui/EditableTitle.js';
import { i18n } from '../i18n/LanguageManager.js';
```

---

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
| `this.originalTitle` | `string` | из параметра | Оригинальный заголовок (используется для определения, менял ли пользователь название). |
| `this.titleEditor` | `EditableTitle \| null` | `null` | Экземпляр компонента редактирования заголовка. |
| `this.unsubscribeI18n` | `Function \| null` | `null` | Функция отписки от событий i18n. |
| `this.dirtyIndicator` | `HTMLSpanElement \| null` | `null` | Элемент для отображения звёздочки при несохранённых изменениях. |
| `this.unsubscribeDirty` | `Function \| null` | `null` | Функция отписки от событий dirty-состояния графа. |

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

## getOutputValue(port, visited, graph)

```javascript
getOutputValue(port: string = 'main', visited: Set<number> = new Set(), graph: Graph = null): Array<any>
```

Возвращает значение для указанного порта выхода. Базовый метод вызывает `this.getValue()`.

## canAcceptEdge(source, port)

```javascript
canAcceptEdge(source: Node, port: string = 'main'): { ok: boolean, message?: string }
```

Определяет, может ли узел принять входящее соединение от указанного источника.

## onAttach(graph)

```javascript
onAttach(graph: Graph): void
```

Вызывается автоматически при добавлении узла в граф.

## onDetach()

```javascript
onDetach(): void
```

Вызывается автоматически при удалении узла из графа.

## reevaluate(graph)

```javascript
reevaluate(graph: Graph): void
```

Вызывается при необходимости пересчитать внутреннее состояние узла.

## updateDisplay(graph)

```javascript
updateDisplay(graph: Graph): void
```

Вызывается для обновления отображаемых данных без полного пересчёта логики.

## getLocalizedTitle()

```javascript
getLocalizedTitle(): string
```

Возвращает локализованную версию заголовка узла. Пользовательские изменения имеют приоритет над локализацией.

## updateTitleTranslation()

```javascript
updateTitleTranslation(): void
```

Обновляет заголовок узла в соответствии с текущим языком. Если заголовок был изменён пользователем, обновление не происходит.

## setTitle(newTitle)

```javascript
setTitle(newTitle: string): void
```

Устанавливает новый заголовок узла с сохранением истории.

## toJSON()

```javascript
toJSON(): object
```

Сериализует узел в простой JavaScript-объект для сохранения.

## getMinHeight()

```javascript
getMinHeight(): number
```

Возвращает минимальную высоту узла в пикселях. Базовый метод возвращает `80`.

## createBaseDiv(graph, renderer, headerClass)

```javascript
createBaseDiv(graph: Graph, renderer: DomRenderer, headerClass: string = 'node-header'): HTMLDivElement
```

Создаёт базовый DOM-элемент узла (контейнер с заголовком, кнопкой удаления, системой редактирования заголовка и dirty-индикатором).

**Структура заголовка с dirty-индикатором:**

```html
<div class="[headerClass]" style="display: flex; align-items: center; justify-content: space-between;">
  <div style="display: flex; align-items: center; gap: 6px;">
    <span class="title-display">...</span>  <!-- или input при редактировании -->
    <span class="dirty-indicator" style="color: #ffb347; display: none;">*</span>
  </div>
  <div class="node-actions">
    <button>✕</button>
  </div>
</div>
```

**Dirty-индикатор:**
- Отображается как звёздочка `*` рядом с заголовком узла
- Цвет: `#ffb347` (оранжевый)
- Имеет пульсирующую анимацию (отключается в extreme режиме)
- Подписывается на изменения dirty-состояния графа через `graph.onDirtyChange()`
- Автоматически отписывается при удалении узла

**Подписка на dirty-состояние:**

```javascript
const updateDirtyIndicator = (isDirty) => {
  if (this.dirtyIndicator) {
    this.dirtyIndicator.style.display = isDirty ? 'inline' : 'none';
  }
};

if (graph && typeof graph.onDirtyChange === 'function') {
  this.unsubscribeDirty = graph.onDirtyChange(updateDirtyIndicator);
}
```

## createDOM(graph, renderer)

```javascript
createDOM(graph: Graph, renderer: DomRenderer): HTMLDivElement
```

**Абстрактный метод.** Должен быть переопределён в каждом производном классе.

---

# УПРАВЛЕНИЕ ЗАГОЛОВКАМИ

## Состояния заголовка

Узел отслеживает два состояния заголовка:

| Поле | Назначение |
|------|------------|
| `this.title` | Текущий отображаемый заголовок |
| `this.originalTitle` | Оригинальный заголовок (до локализации или после редактирования) |

## Правила синхронизации

1. **При создании узла:** `title = originalTitle = переведённое название`
2. **При смене языка:** если `title === originalTitle` → оба поля обновляются
3. **При редактировании пользователем:** `title = originalTitle = новое_значение`
4. **При загрузке из JSON:** восстанавливаются оба поля

---

# DIRTY-ИНДИКАТОР (ЗВЁЗДОЧКА)

## Описание

Каждый узел отображает звёздочку `*` рядом с заголовком, когда граф содержит несохранённые изменения. Это даёт пользователю визуальную обратную связь о том, что изменения не сохранены.

## Внешний вид

| Элемент | Стиль |
|---------|-------|
| Символ | `*` |
| Цвет | `#ffb347` (оранжевый) |
| Анимация | Пульсация (opacity 1 → 0.4 → 1) |
| Отключение анимации | В режиме `design-quality-extreme` анимация отключается |
| Tooltip | "Unsaved changes" |

## Когда отображается

Звёздочка появляется при любом изменении графа:
- Добавление/удаление узлов
- Добавление/удаление связей
- Перемещение узлов
- Изменение значений в узлах
- Редактирование заголовков
- Undo/redo операции

## Когда скрывается

Звёздочка исчезает после:
- Экспорта в файл
- Импорта из файла
- Автосохранения в localStorage
- Undo до состояния, когда граф был сохранён
- Создания нового холста

## CSS-стили

```css
.dirty-indicator {
  animation: dirtyPulse 1.5s ease-in-out infinite;
}

@keyframes dirtyPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.design-quality-extreme .dirty-indicator {
  animation: none;
}
```

---

# МЕТАДАННЫЕ (СТАТИЧЕСКОЕ СВОЙСТВО)

Каждый производный класс **должен** экспортировать объект `metadata` со следующей структурой:

```javascript
export const metadata = {
  type: string,                    // уникальный идентификатор типа узла
  nameKey: string,                 // ключ перевода для названия
  descriptionKey: string,          // ключ перевода для описания
  author: string,                  // имя автора узла
  github?: string,                 // URL GitHub автора (опционально)
  icon: string,                    // иконка Font Awesome
  dataType: string,                // тип данных узла
  canHaveIncomingEdges: boolean,   // может ли узел иметь входящие соединения
  canHaveOutgoingEdges: boolean,   // может ли узел иметь исходящие соединения
  allowedInputTypes: Array<string>,// массив допустимых типов для входящих соединений
  allowedOutputTypes: Array<string>,// массив допустимых типов для исходящих соединений
  defaultValue: any,               // значение по умолчанию
  isCategory?: boolean,            // является ли узел категорией-контейнером
  categoryName?: string,           // ключ перевода для названия категории
  subnodes?: Array<object>         // дочерние узлы для категории
};
```

---

# ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ

## Создание производного узла с dirty-индикатором

```javascript
import { Node } from '../core/Node.js';

export class NumberNode extends Node {
  constructor(id, x, y, title, options = {}) {
    super(id, 'number', x, y, title, options);
    this.value = options.val ?? 0;
  }

  createDOM(graph, renderer) {
    const div = this.createBaseDiv(graph, renderer);
    // dirty-индикатор уже добавлен в createBaseDiv
    
    const content = document.createElement('div');
    const input = document.createElement('input');
    input.type = 'number';
    input.value = this.value;
    input.onchange = () => {
      this.value = parseFloat(input.value) || 0;
      graph.setDirty(true); // ← устанавливаем dirty-флаг
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

## Подписка на dirty-состояние извне

```javascript
// В UI-компоненте
graph.onDirtyChange((isDirty) => {
  saveButton.disabled = !isDirty;
  statusIndicator.style.display = isDirty ? 'block' : 'none';
});
```

---

# ЗАМЕЧАНИЯ

- Все производные классы **обязаны** экспортировать `metadata`.
- Метод `createDOM` вызывается рендерером каждый раз при необходимости отрисовать узел.
- При переопределении `toJSON()` необходимо сохранять все поля для полного восстановления.
- **Dirty-индикатор** автоматически подписывается на изменения графа через `graph.onDirtyChange()` и отписывается при удалении узла.
- При смене языка пользовательские заголовки сохраняются благодаря механизму `originalTitle`.
- Для программного изменения заголовка используйте метод `setTitle()`.
