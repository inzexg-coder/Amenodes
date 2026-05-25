# `EditableTitle`

## ОПИСАНИЕ

`EditableTitle` – компонент пользовательского интерфейса, реализующий инлайн-редактирование текстовых заголовков.
Предоставляет механизм переключения между режимом отображения (span с текстом) и режимом редактирования (input поле) с поддержкой клавиатурных команд и автоматическим сохранением изменений.

**Ключевые возможности:**
- Однокликовое переключение в режим редактирования;
- Поддержка клавиш `Enter` (сохранить) и `Escape` (отменить);
- Автоматическое сохранение при потере фокуса (`blur`);
- Поддержка символьной подстановки через `SymbolMapper.replaceSymbols`.

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

- `value` – начальное строковое значение заголовка.
- `onChange` – функция обратного вызова, вызываемая при успешном сохранении нового значения. Принимает один аргумент – новую строку.

**Инициализируемые свойства:**

| Свойство | Тип | Описание |
|----------|-----|----------|
| `this.value` | `string` | Текущее значение заголовка. |
| `this.onChange` | `Function` | Колбэк сохранения. |
| `this.element` | `HTMLDivElement` | Корневой DOM-элемент компонента. |
| `this.displaySpan` | `HTMLSpanElement` | Элемент для отображения текста в режиме просмотра. |
| `this.input` | `HTMLInputElement` | Поле ввода для режима редактирования. |

# Методы

## init()

```javascript
init(): void
```

Инициализирует DOM-структуру компонента:

1. Создаёт `this.displaySpan`:
   - Присваивает класс `'title-display'`;
   - Устанавливает `fontFamily: 'monospace'`;
   - Применяет `replaceSymbols` к начальному значению;
   - Назначает обработчик `onclick`, вызывающий `startEdit()`.
2. Создаёт `this.input`:
   - Тип `'text'`;
   - Присваивает класс `'title-editable'`;
   - Устанавливает `fontFamily: 'monospace'`;
   - Назначает обработчики `onkeydown` (Enter → `finish()`, Escape → `cancel()`) и `onblur` → `finish()`.
3. Добавляет `this.displaySpan` в `this.element`.

## startEdit()

```javascript
startEdit(): void
```

Переключает компонент в режим редактирования. Удаляет `this.displaySpan` из `this.element`, добавляет `this.input` и устанавливает на него фокус.

## finish()

```javascript
finish(): void
```

Завершает редактирование с сохранением значения:

1. Считывает значение из `this.input` в `this.value`.
2. Обновляет `this.displaySpan.textContent` через `replaceSymbols`.
3. Удаляет `this.input` из `this.element` (если присутствует).
4. Добавляет `this.displaySpan` обратно в `this.element`.
5. Вызывает `this.onChange(this.value)`, если колбэк был передан.

## cancel()

```javascript
cancel(): void
```

Отменяет редактирование без сохранения. Восстанавливает `this.input.value` из `this.value`, затем вызывает `finish()` (что приводит к возврату в режим отображения без вызова `onChange`).

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

Программно устанавливает новое значение заголовка без вызова `onChange`. Обновляет `this.value`, `this.displaySpan.textContent` и (если поле ввода активно) `this.input.value`.

**Параметры:**

- `val` – новое строковое значение.

**Примечание:** Метод не переключает режим редактирования и не сохраняет изменения через колбэк. Предназначен для внешней синхронизации состояния (например, при смене языка интерфейса).

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
  this.titleEditor.setValue(newTitle);
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
- При вызове `finish()` после программного изменения `input.value` через `setValue` изменения будут потеряны, если пользователь не подтвердил их вручную.

# СОВМЕСТИМОСТЬ

- Работает во всех современных браузерах с поддержкой ES6.
- Для корректной работы требуется наличие CSS-классов `title-display` и `title-editable`.
- Не зависит от глобального состояния приложения.
