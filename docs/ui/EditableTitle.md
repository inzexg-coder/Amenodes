# `EditableTitle`

## ОПИСАНИЕ

`EditableTitle` – компонент пользовательского интерфейса, реализующий инлайн-редактирование текстовых заголовков.
Предоставляет механизм переключения между режимом отображения (span с текстом) и режимом редактирования (input поле) с поддержкой клавиатурных команд и автоматическим сохранением изменений.

**Ключевые возможности:**
- Однокликовое переключение в режим редактирования;
- Поддержка клавиш `Enter` (сохранить) и `Escape` (отменить);
- Автоматическое сохранение при потере фокуса (`blur`);
- Поддержка символьной подстановки через `SymbolMapper.replaceSymbols`;
- Визуальная обратная связь при наведении;
- Предотвращение конфликта между `Enter` и `blur`.

## ЗАВИСИМОСТИ

```javascript
import { replaceSymbols } from '../utils/SymbolMapper.js';
```

| Импорт | Назначение |
|--------|------------|
| `replaceSymbols` | Функция для замены специальных маркеров (например, `$pi` → `π`) в отображаемом тексте. |

# КЛАСС EDITABLETITLE

## Конструктор

```javascript
constructor(value: string, onChange: (newValue: string) => void)
```

Создаёт новый экземпляр редактируемого заголовка с начальным значением и колбэком сохранения.

**Параметры:**

| Параметр | Тип | Описание |
|----------|-----|----------|
| `value` | `string` | Начальное строковое значение заголовка. |
| `onChange` | `(newValue: string) => void` | Функция обратного вызова, вызываемая при успешном сохранении нового значения. Принимает один аргумент – новую строку. |

**Инициализируемые свойства:**

| Свойство | Тип | Начальное значение | Описание |
|----------|-----|--------------------|----------|
| `this.value` | `string` | параметр `value` | Текущее значение заголовка. |
| `this.onChange` | `Function` | параметр `onChange` | Колбэк сохранения. |
| `this.element` | `HTMLDivElement` | новый элемент | Корневой DOM-элемент компонента. |
| `this.displaySpan` | `HTMLSpanElement` | `null` (создаётся в `init`) | Элемент для отображения текста в режиме просмотра. |
| `this.input` | `HTMLInputElement` | `null` (создаётся в `init`) | Поле ввода для режима редактирования. |

**Примечание:** конструктор вызывает `this.init()` для создания DOM-структуры.

# Методы

## init()

```javascript
init(): void
```

Инициализирует DOM-структуру компонента и настраивает обработчики событий.

**Создаваемые элементы:**

### displaySpan
- Класс: `'title-display'`
- Стили: `fontFamily: 'monospace'`, `cursor: 'text'`, `padding: '4px 8px'`, `borderRadius: '8px'`
- Эффекты: при наведении фон меняется на `#2f3a66`
- Содержимое: `replaceSymbols(this.value)`
- Обработчик: `onclick` → `startEdit()`

### input
- Тип: `'text'`
- Класс: `'title-editable'`
- Стили: `fontFamily: 'monospace'`, `fontSize: '14px'`, `fontWeight: '700'`, `background: '#0f1222'`, `border: '1px solid #ffb347'`, `borderRadius: '8px'`, `padding: '4px 8px'`, `color: '#dcf0ff'`, `width: '200px'`
- Значение: `this.value`
- Обработчики:
  - `onkeydown` → `Enter`: `finish()`, `Escape`: `cancel()`
  - `onblur` → `finish()` (с задержкой 100ms для предотвращения конфликта с `Enter`)
  - `onclick` → `stopPropagation()`

**Побочные эффекты:** добавляет `this.displaySpan` в `this.element`.

## startEdit()

```javascript
startEdit(): void
```

Переключает компонент в режим редактирования.

**Алгоритм:**
1. Обновляет `this.input.value` актуальным значением из `this.value` (важно для синхронизации после внешних изменений).
2. Удаляет `this.displaySpan` из `this.element` (если он присутствует).
3. Добавляет `this.input` в `this.element`.
4. Устанавливает фокус на `this.input`.
5. Выделяет весь текст в поле ввода (`input.select()`).

**Побочные эффекты:** изменяется DOM-структура `this.element`.

## finish()

```javascript
finish(): void
```

Завершает редактирование с сохранением значения.

**Алгоритм:**
1. Проверяет, находится ли `this.input` в DOM (`this.input.parentNode === this.element`). Если нет – завершает работу.
2. Считывает значение из `this.input` и обрезает пробелы (`trim()`).
3. Если значение пустое, восстанавливает старое значение из `this.value`.
4. Сохраняет новое значение в `this.value`.
5. Обновляет `this.displaySpan.textContent` через `replaceSymbols(newValue)`.
6. Удаляет `this.input` из `this.element`.
7. Добавляет `this.displaySpan` обратно в `this.element`.
8. Если колбэк `this.onChange` определён и значение изменилось, вызывает его с новым значением.

**Важно:** проверка `hasChanged` предотвращает лишние вызовы `onChange` при неизменном значении.

## cancel()

```javascript
cancel(): void
```

Отменяет редактирование без сохранения.

**Алгоритм:**
1. Восстанавливает `this.input.value` из `this.value` (отбрасывает изменения).
2. Если `this.input` находится в DOM, удаляет его и добавляет `this.displaySpan`.
3. Не вызывает `this.onChange`.

## getElement()

```javascript
getElement(): HTMLDivElement
```

Возвращает корневой DOM-элемент компонента, который может быть вставлен в DOM-дерево приложения.

**Возвращает:** `HTMLDivElement`, содержащий либо `displaySpan`, либо `input` (в зависимости от режима).

## setValue(val)

```javascript
setValue(val: string): void
```

Программно устанавливает новое значение заголовка без вызова `onChange`.

**Параметры:**

| Параметр | Тип | Описание |
|----------|-----|----------|
| `val` | `string` | Новое строковое значение. |

**Алгоритм:**
1. Обновляет `this.value = val`.
2. Обновляет `this.displaySpan.textContent = replaceSymbols(val)`.
3. Если поле ввода активно (`this.input.parentNode === this.element`), обновляет `this.input.value = val`.

**Примечание:** Метод не переключает режим редактирования и не сохраняет изменения через колбэк. Предназначен для внешней синхронизации состояния (например, при смене языка интерфейса).

## getValue()

```javascript
getValue(): string
```

Возвращает текущее значение заголовка.

**Возвращает:** строку `this.value`.

# ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ

### Базовое использование в узле

```javascript
import { EditableTitle } from '../ui/EditableTitle.js';

class MyNode extends Node {
  createDOM(graph, renderer) {
    const div = this.createBaseDiv(graph, renderer);
    const titleEditor = new EditableTitle(this.title, (newTitle) => {
      this.title = newTitle;
      renderer.render();
      renderer.save();
    });
    div.appendChild(titleEditor.getElement());
    return div;
  }
}
```

### Программное обновление значения

```javascript
// Подписка на события i18n
i18n.subscribe(() => {
  const newTitle = i18n.t(`nodes.${this.type}`);
  if (this.title === this.originalTitle) {
    this.titleEditor.setValue(newTitle);
  }
});
```

### Настройка стилей отображения

```javascript
const editor = new EditableTitle('Default Title', (val) => console.log(val));
editor.displaySpan.style.minWidth = '160px';
editor.displaySpan.style.display = 'inline-block';
editor.displaySpan.style.background = '#1f2a44';
container.appendChild(editor.getElement());
```

# ПРИМЕЧАНИЯ

- Компонент не выполняет санитизацию HTML-ввода. Все значения вставляются через `textContent`, что предотвращает XSS-атаки.
- Нет ограничения на длину вводимого текста – зависит от браузера и CSS-стилей.
- При вызове `finish()` после программного изменения `input.value` через `setValue`, изменения будут потеряны, если пользователь не подтвердил их вручную.
- Обработчик `onblur` использует `setTimeout` с задержкой 100ms, чтобы `Enter` не вызывал `finish()` дважды (сначала через `onkeydown`, затем через `onblur`). Это критически важно для корректной работы.
- В `startEdit()` значение `input` обновляется из `this.value` перед показом. Это гарантирует, что при повторном редактировании после внешнего изменения (например, через `setValue`) поле ввода содержит актуальное значение.

# ОШИБКИ И ОГРАНИЧЕНИЯ

| Ситуация | Поведение |
|----------|-----------|
| Пользователь вводит пустую строку и нажимает Enter | Значение восстанавливается из `this.value`, `onChange` не вызывается |
| Пользователь нажимает Enter, затем быстро переключает фокус | Задержка 100ms в `onblur` предотвращает двойной вызов `finish()` |
| Вызов `setValue()` во время активного редактирования | Обновляет `input.value`, но не прерывает редактирование |
| Компонент уничтожен, но `onblur` ещё не сработал | Проверка `this.input.parentNode === this.element` предотвращает ошибки |

# СОВМЕСТИМОСТЬ

- Работает во всех современных браузерах с поддержкой ES6.
- Для корректной работы требуется наличие CSS-классов `title-display` и `title-editable`.
- Не зависит от глобального состояния приложения.
- Использует `stopPropagation()` для предотвращения конфликтов с перетаскиванием узлов.
