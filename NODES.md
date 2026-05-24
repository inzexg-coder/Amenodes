# Справочник

## СОДЕРЖАНИЕ

- [Введение и краткое руководство](#введение-и-краткое-руководство)
- [NumberNode](#numbernode)
- [ConstantNode](#constantnode)
- [GroupNode](#groupnode)
- [CalcNode](#calcnode)
- [OutputNode](#outputnode)
- [MapNode](#mapnode)
- [ConfidenceIntervalNode](#confidenceintervalnode)
- [Руководство по добавлению нового узла](#руководство-по-добавлению-нового-узла)

---

## ВВЕДЕНИЕ И КРАТКОЕ РУКОВОДСТВО

### О системе узлов

Amenodes — визуальная среда программирования, в которой вычисления строятся в виде графа, состоящего из узлов (`Node`) и связей между ними (`Edge`). 
Каждый узел выполняет определённую операцию: ввод числа, группировку значений, математические вычисления, отображение результатов и т.д.

### Основные понятия

| Термин | Описание |
|--------|----------|
| **Узел (Node)** | Блок, выполняющий конкретную операцию. Имеет входы (может принимать данные) и выходы (может передавать данные). |
| **Связь (Edge)** | Соединение между выходом одного узла и входом другого. Данные передаются по связям. |
| **Порт (Port)** | Точка подключения на узле. Стандартный порт называется `main`. Некоторые узлы имеют дополнительные порты (например, `unmapped` у MapNode). |
| **Тип данных (DataType)** | Определяет, какие значения может передавать узел. Система типов предотвращает некорректные соединения. |

### Базовые операции

#### 1. Создание узла

**Способ A — через кнопку «+» на панели инструментов:**

1. Нажмите кнопку **+** (Add node) на верхней панели.
2. Выберите нужный узел из меню.
3. Узел появится в центре видимой области.

**Способ B — через контекстное меню существующего узла:**

1. Нажмите и удерживайте левую кнопку мыши на любом порте (цветной кружок) узла.
2. Переместите мышь — появится пунктирная линия.
3. Отпустите кнопку — откроется контекстное меню для создания нового узла.
4. Выберите тип узла — он будет создан и автоматически соединён с исходным узлом.

#### 2. Соединение узлов

1. Наведите курсор на порт узла-источника (цветной кружок).
2. Нажмите и удерживайте левую кнопку мыши.
3. Перетащите линию к порту узла-приёмника.
4. Отпустите кнопку — связь создана.

#### 3. Удаление связи

- **Правый клик** на линии связи — связь будет удалена.

#### 4. Удаление узла

- Нажмите кнопку **✕** в правой части заголовка узла.

#### 5. Перемещение узла

- **Левый клик** и перетаскивание за заголовок узла.

#### 6. Панорамирование и масштабирование

- **Правый клик** и перетаскивание — панорамирование рабочей области.
- **Колёсико мыши** — масштабирование.

#### 7. Редактирование заголовка

- **Клик** на заголовок узла — переход в режим редактирования.

#### 8. Отмена/повтор действий

- Кнопки **Undo** / **Redo** на панели инструментов.

#### 9. Импорт/экспорт

- **Export** — сохранить текущий граф в файл `.amnk`.
- **Import** — загрузить ранее сохранённый граф.

---

# NumberNode

## ИДЕНТИФИКАЦИЯ

| Свойство | Значение |
|----------|----------|
| **Тип (`type`)** | `number` |
| **Ключ локализации** | `nodes.number` |
| **Иконка** | `fa-hashtag` |
| **Автор** | [@inzexg-coder](https://github.com/inzexg-coder) |
| **Репозиторий** | [![GitHub](https://img.shields.io/badge/Amenodes-181717?style=flat-square&logo=github)](https://github.com/inzexg-coder/Amenodes) |

## ТИПЫ ДАННЫХ

| Направление | Тип | Описание |
|-------------|-----|----------|
| **Входы** | отсутствуют | Узел не принимает соединений. |
| **Выходы** | `num`, `array`, `auto`, `uncert`, `list`, `wlist` | Может подключаться к любым узлам, ожидающим числовые данные. |

## ПОВЕДЕНИЕ

Узел предоставляет числовое значение, задаваемое пользователем через поле ввода. При изменении значения узел вызывает пересчёт графа.

## ВЫЧИСЛЕНИЯ

**Выходное значение (`getValue`):** `[this.value]` — массив с одним числом.

## ОТОБРАЖЕНИЕ

Узел отображается с полем ввода типа `number` с атрибутом `step="any"`, позволяющим вводить целые и дробные числа.

## JSON-СЕРИАЛИЗАЦИЯ

```javascript
{
  id: number,
  type: "number",
  x: number,
  y: number,
  title: string,
  important: boolean,
  originalTitle: string,
  val: number          // пользовательское значение
}
```

## ПРИМЕР ИСПОЛЬЗОВАНИЯ

```javascript
const numNode = new NumberNode(null, 100, 100, "Значение", { val: 3.14 });
graph.addNode(numNode);
// numNode.getValue() возвращает [3.14]
```

---

# ConstantNode

## ИДЕНТИФИКАЦИЯ

| Свойство | Значение |
|----------|----------|
| **Тип (`type`)** | `constant` |
| **Ключ локализации** | `nodes.constant` |
| **Иконка** | `fa-infinity` |
| **Автор** | [@inzexg-coder](https://github.com/inzexg-coder) |
| **Репозиторий** | [![GitHub](https://img.shields.io/badge/Amenodes-181717?style=flat-square&logo=github)](https://github.com/inzexg-coder/Amenodes) |

## ТИПЫ ДАННЫХ

| Направление | Тип | Описание |
|-------------|-----|----------|
| **Входы** | отсутствуют | Узел не принимает соединений. |
| **Выходы** | `num`, `array`, `auto`, `uncert`, `list`, `wlist` | Аналогичен NumberNode. |

## ПОВЕДЕНИЕ

Отличается от `NumberNode` способом задания значения: при создании узла пользователю предлагается модальный диалог для ввода числа.

## ВЫЧИСЛЕНИЯ

**Выходное значение (`getValue`):** `[this.value]` — массив с одним числом.

## ОТОБРАЖЕНИЕ

Отображает значение крупным моноширинным шрифтом (18px) на цветном фоне. Значение не редактируется непосредственно в узле — для изменения требуется удалить и создать узел заново.

## СТАТИЧЕСКИЙ МЕТОД

### onCreate(graph, x, y, options)

```javascript
static async onCreate(graph: Graph, x: number, y: number, options: object): Promise<ConstantNode | null>
```

Вызывается при создании узла через меню. Отображает диалог ввода значения.

**Параметры:**

- `graph` — граф, в который будет добавлен узел.
- `x`, `y` — координаты для размещения узла.
- `options` — не используется.

**Возвращает:** новый экземпляр `ConstantNode` или `null` при отмене.

## JSON-СЕРИАЛИЗАЦИЯ

```javascript
{
  id: number,
  type: "constant",
  x: number,
  y: number,
  title: string,
  important: boolean,
  originalTitle: string,
  val: number
}
```

## ПРИМЕР ИСПОЛЬЗОВАНИЯ

```javascript
// При создании через меню пользователь увидит диалог "Enter new value"
const constNode = new ConstantNode(null, 100, 100, "PI", { val: 3.14159 });
graph.addNode(constNode);
```

---

# GroupNode

## ИДЕНТИФИКАЦИЯ

| Свойство | Значение |
|----------|----------|
| **Тип (`type`)** | `group` |
| **Ключ локализации** | `nodes.group` |
| **Иконка** | `fa-layer-group` |
| **Автор** | [@inzexg-coder](https://github.com/inzexg-coder) |
| **Репозиторий** | [![GitHub](https://img.shields.io/badge/Amenodes-181717?style=flat-square&logo=github)](https://github.com/inzexg-coder/Amenodes) |

## ТИПЫ ДАННЫХ

| Направление | Тип | Описание |
|-------------|-----|----------|
| **Входы** | отсутствуют | Узел не принимает соединений. |
| **Выходы** | `array` | Возвращает массив числовых значений. |

## ПОВЕДЕНИЕ

Групповой узел позволяет управлять набором именованных числовых значений. Пользователь может:

- добавлять новые значения (кнопка "Add value");
- удалять значения (кнопка ✕, минимум одно значение);
- редактировать имя каждого значения (клик по имени);
- редактировать числовое значение через поле ввода.

## ВЫЧИСЛЕНИЯ

**Выходное значение (`getValue`):** массив чисел, извлечённых из `this.values`. Фильтрует `NaN`.

```javascript
getValue() {
  return this.values.map(v => typeof v.val === 'number' ? v.val : parseFloat(v.val))
    .filter(v => !isNaN(v));
}
```

## ОТОБРАЖЕНИЕ

Каждая строка содержит:

- редактируемое имя (ширина 90px);
- числовое поле ввода;
- кнопку удаления (активна при наличии >1 строки).

## JSON-СЕРИАЛИЗАЦИЯ

```javascript
{
  id: number,
  type: "group",
  x: number,
  y: number,
  title: string,
  important: boolean,
  originalTitle: string,
  vals: Array<{ name: string, val: number }>
}
```

## ПРИМЕР ИСПОЛЬЗОВАНИЯ

```javascript
const groupNode = new GroupNode(null, 100, 100, "Набор данных", {
  vals: [
    { name: "Значение A", val: 10 },
    { name: "Значение B", val: 20 }
  ]
});
graph.addNode(groupNode);
// groupNode.getValue() возвращает [10, 20]
```

## ЗАМЕЧАНИЯ

- Минимальная высота узла динамически рассчитывается: `80 + this.values.length * 40`.
- При изменении значений узел вызывает пересчёт графа и сохранение истории.

---

# CalcNode

## ИДЕНТИФИКАЦИЯ

| Свойство | Значение |
|----------|----------|
| **Тип (`type`)** | `calc` |
| **Ключ локализации** | `nodes.calc` |
| **Иконка** | `fa-calculator` |
| **Автор** | [@inzexg-coder](https://github.com/inzexg-coder) |
| **Репозиторий** | [![GitHub](https://img.shields.io/badge/Amenodes-181717?style=flat-square&logo=github)](https://github.com/inzexg-coder/Amenodes) |
| **Категория** | `true` (является контейнером для подузлов) |

## ТИПЫ ДАННЫХ

| Направление | Тип | Описание |
|-------------|-----|----------|
| **Входы** | `num`, `array`, `uncert` | Принимает числовые данные и массивы неопределённостей. |
| **Выходы** | `num`, `array`, `auto`, `uncert`, `list`, `wlist` | Тип зависит от операции. |

## ТИПЫ ВЫЧИСЛЕНИЙ

Узел поддерживает три режима работы, определяемые параметром `calcType`:

| `calcType` | Ключ локализации | Формула |
|------------|------------------|---------|
| `div3` | `calcTypes.div3` | `x / 3` (поэлементно) |
| `div_sqrt12` | `calcTypes.div_sqrt12` | `x / √12` (поэлементно) |
| `sqrt_sum_sq` | `calcTypes.sqrt_sum_sq` | √(Σ x²) — специальная обработка парных входов |

## ПОВЕДЕНИЕ

### Режимы `div3` и `div_sqrt12`

- Получает входные данные через `graph.getMergedInput(this.id)`.
- Для каждого числового значения применяет деление.
- Результат — массив чисел.

### Режим `sqrt_sum_sq`

Особый режим для расчёта неопределённостей. Не использует `getMergedInput`. Вместо этого ожидает, что во входных данных для узла `id` через отдельный механизм (`graph.getPairedForSqrt`) будут получены парные значения.

## ВЫЧИСЛЕНИЯ

### reevaluate(graph)

```javascript
reevaluate(graph: Graph): void
```

Обновляет `this.result` и `this.resultStr` в зависимости от `calcType`.

## ОТОБРАЖЕНИЕ

- Заголовок: цветовая схема `calc-header`.
- Отображает:
  - название текущего режима (локализованное);
  - результат в формате `[0.123456, 0.789012]`;
  - количество входных соединений.

## JSON-СЕРИАЛИЗАЦИЯ

```javascript
{
  id: number,
  type: "calc",
  x: number,
  y: number,
  title: string,
  important: boolean,
  originalTitle: string,
  calcType: "div3" | "div_sqrt12" | "sqrt_sum_sq",
  result: Array<number> | null,
  resultStr: string
}
```

## ПРИМЕР ИСПОЛЬЗОВАНИЯ

```javascript
const calcNode = new CalcNode(null, 100, 100, "Калькулятор", { calcType: "div3" });
graph.addNode(calcNode);
// При входе [9, 12, 15] результат будет [3, 4, 5]
```

---

# OutputNode

## ИДЕНТИФИКАЦИЯ

| Свойство | Значение |
|----------|----------|
| **Тип (`type`)** | `output` |
| **Ключ локализации** | `nodes.output` |
| **Иконка** | `fa-chart-line` |
| **Автор** | [@inzexg-coder](https://github.com/inzexg-coder) |
| **Репозиторий** | [![GitHub](https://img.shields.io/badge/Amenodes-181717?style=flat-square&logo=github)](https://github.com/inzexg-coder/Amenodes) |

## ТИПЫ ДАННЫХ

| Направление | Тип | Описание |
|-------------|-----|----------|
| **Входы** | `num`, `array`, `uncert`, `list`, `wlist`, `interval` | Принимает любые числовые данные. |
| **Выходы** | отсутствуют | Узел является терминальным (не может быть источником). |

## ПОВЕДЕНИЕ

Узел отображения результатов. Визуализирует все входящие значения в виде таблицы. Заголовок узла динамически обновляется, показывая количество полученных значений.

## ВЫЧИСЛЕНИЯ

### updateDisplay(graph)

```javascript
updateDisplay(graph: Graph): void
```

- Собирает все входящие значения через `graph.getMergedInput(this.id)`.
- Если входов нет → `rows = [{ param: "No connections", value: "—" }]`, заголовок = `"No connections"`.
- Если есть значения → создаёт строку для каждого значения: `{ param: "Value N", value: val.toFixed(6) }`.
- Заголовок = `"Output (N values)"` (локализовано).

### getValue()

Возвращает массив всех входящих значений (используется для передачи в другие узлы, хотя у `OutputNode` нет выходов).

## ОТОБРАЖЕНИЕ

- Заголовок: `output-header`.
- Таблица с колонками:
  - **Parameter** (редактируемое имя параметра через `EditableTitle`);
  - **Value** (только для чтения, форматирование через `replaceSymbols`).
- Высота узла: `80 + rows.length * 35`.

## JSON-СЕРИАЛИЗАЦИЯ

```javascript
{
  id: number,
  type: "output",
  x: number,
  y: number,
  title: string,
  important: boolean,
  originalTitle: string,
  rows: Array<{ param: string, value: string }>
}
```

## ПРИМЕР ИСПОЛЬЗОВАНИЯ

```javascript
const outputNode = new OutputNode(null, 100, 100, "Результаты");
graph.addNode(outputNode);
// После подключения источника со значением 42:
// outputNode.rows = [{ param: "Value 1", value: "42.000000" }]
// outputNode.title = "Результаты (1 значение)"
```

## ЗАМЕЧАНИЯ

- Имена параметров (`param`) редактируемы пользователем и сохраняются в JSON.
- Значения автоматически форматируются с 6 знаками после запятой.

---

# MapNode

## ИДЕНТИФИКАЦИЯ

| Свойство | Значение |
|----------|----------|
| **Тип (`type`)** | `map` |
| **Ключ локализации** | `nodes.map` |
| **Иконка** | `fa-map` |
| **Автор** | [@inzexg-coder](https://github.com/inzexg-coder) |
| **Репозиторий** | [![GitHub](https://img.shields.io/badge/Amenodes-181717?style=flat-square&logo=github)](https://github.com/inzexg-coder/Amenodes) |

## ТИПЫ ДАННЫХ

| Направление | Тип | Описание |
|-------------|-----|----------|
| **Входы** | `num`, `array`, `uncert`, `list`, `wlist` | Принимает числовые данные для отображения. |
| **Выходы (порт `'main'`)** | `list`, `wlist`, `uncert` | Основной выход с преобразованными значениями. |
| **Выходы (порт `'unmapped'`)** | `list` | Дополнительный выход для неотображённых значений (только в режиме `separate`). |

## ПОВЕДЕНИЕ

Узел отображения (mapping) — преобразует входные числовые значения согласно заданным правилам `x → y`. Поддерживает два режима обработки неотображённых значений.

## РЕЖИМЫ РАБОТЫ

| Режим | Ключ локализации | Поведение |
|-------|------------------|-----------|
| `passthrough` | `map.passThrough` | Неотображённые значения передаются на основной выход без изменений. Порт `'unmapped'` не создаётся. |
| `separate` | `map.separateOutput` | Неотображённые значения выводятся через отдельный порт `'unmapped'`. Основной выход содержит только отображённые значения. |

## ПРАВИЛА ОТОБРАЖЕНИЯ

Пользователь определяет набор пар `(x, y)`. Каждая пара означает: если на вход поступает значение `x`, заменить его на `y`.

- Заголовки колонок (`xCol`, `yCol`) редактируемы (по умолчанию `"x"` и `"y"`).
- При добавлении правила проверяется уникальность `x` (нельзя создать два правила с одинаковым `x`).

## ВЫЧИСЛЕНИЯ

### getValue() — основной выход (порт `'main'`)

```javascript
getValue(): Array<number>
```

Применяет правила отображения к входному массиву:
- Если правило найдено — добавляет `y` в результат.
- Если правило не найдено и режим `passthrough` — добавляет исходное `x` в результат.
- Если правило не найдено и режим `separate` — пропускает значение (не включается в основной выход).

### getOutputValue(port, visited, graph) — полиморфный доступ

```javascript
getOutputValue(port: string, visited: Set, graph: Graph): Array<any>
```

- При `port === 'unmapped'` вызывает `getUnmapped()`.
- В остальных случаях вызывает `getValue()`.

### getUnmapped() — порт `'unmapped'`

```javascript
getUnmapped(): Array<number>
```

Возвращает массив входных значений, для которых не найдено правило отображения. Используется только в режиме `separate`. В режиме `passthrough` возвращает пустой массив.

## ОТОБРАЖЕНИЕ

- Заголовок: `map-header`.
- Редактируемые заголовки колонок (`xCol`, `yCol`).
- Таблица правил с полями ввода для `x` и `y`:
  - Поле `x` проверяет уникальность при изменении.
  - Поле `y` свободно редактируется.
- Кнопка добавления правила.
- Переключатель режимов (pass-through / separate output) с визуальным выделением активного режима.
- При активном режиме `separate` справа от узла (смещённый синий порт) появляется дополнительный выход `'unmapped'`.

## JSON-СЕРИАЛИЗАЦИЯ

```javascript
{
  id: number,
  type: "map",
  x: number,
  y: number,
  title: string,
  important: boolean,
  originalTitle: string,
  maps: Array<{ x: number, y: number }>,
  xCol: string,           // заголовок левой колонки
  yCol: string,           // заголовок правой колонки
  unmappedMode: "passthrough" | "separate"
}
```

## ПРИМЕР ИСПОЛЬЗОВАНИЯ

```javascript
const mapNode = new MapNode(null, 100, 100, "Преобразователь", {
  maps: [
    { x: 1, y: 10 },
    { x: 2, y: 20 },
    { x: 3, y: 30 }
  ],
  unmappedMode: "passthrough"
});
graph.addNode(mapNode);
// Вход [1, 2, 4] → основной выход [10, 20, 4]

// Переключение в режим separate:
mapNode.unmappedMode = "separate";
// Вход [1, 2, 4] → основной выход [10, 20], порт 'unmapped' → [4]
```

## ЗАМЕЧАНИЯ

- При переключении режима на `separate` динамически добавляется синий порт для `unmapped` значений через вызов `renderer.addHandles(div, this.id, 'unmapped')`.
- Существующие соединения к порту `unmapped` автоматически удаляются при переключении на `passthrough` (фильтрация `graph.edges`).
- Для порта `'unmapped'` используется цветовая схема `#44aaff` (синий) вместо стандартной `#ffaa55` (оранжевый).

---

# ConfidenceIntervalNode

## ИДЕНТИФИКАЦИЯ

| Свойство | Значение |
|----------|----------|
| **Тип (`type`)** | `confidenceInterval` |
| **Ключ локализации** | `nodes.confidenceInterval` |
| **Иконка** | `fa-chart-simple` |
| **Автор** | [@inzexg-coder](https://github.com/inzexg-coder) |
| **Репозиторий** | [![GitHub](https://img.shields.io/badge/Amenodes-181717?style=flat-square&logo=github)](https://github.com/inzexg-coder/Amenodes) |

## ТИПЫ ДАННЫХ

| Направление | Тип | Описание |
|-------------|-----|----------|
| **Входы** | `uncert` или `interval` (первый вход — неопределённость), `num`, `array`, `list`, `wlist` (второй вход — множитель) | Ровно **два** входа. |
| **Выходы** | `num`, `uncert` | Произведение неопределённости на множитель (поэлементно). |

**Важно:** Узел автоматически определяет тип каждого входа. Порядок подключения не имеет значения — если один из входов имеет тип `uncert` или `interval`, а другой — любой из числовых типов, соединение корректно обрабатывается.

## ВАЛИДАЦИЯ ВХОДОВ

### canAcceptEdge(source, port)

```javascript
canAcceptEdge(source: Node, port: string): { ok: boolean, message?: string }
```

Ограничивает количество входов до двух. При попытке создать третье соединение возвращает `{ ok: false, message: t('errors.maxTwoInputs') }`.

## ВЫЧИСЛЕНИЯ

### reevaluate(graph)

```javascript
reevaluate(graph: Graph): void
```

1. Проверяет наличие ровно двух входящих рёбер. Если входов не два — результат `null`, строка `"--"`.
2. Обходит оба входящих ребра, определяя тип источника через `typeSystem.getNodeType(source)`.
3. Если тип источника — `uncert` или `interval` — значение сохраняется как `uncertaintyValue`.
4. Если тип источника — `num`, `array`, `list` или `wlist` — значение сохраняется как `multiplierValue`.
5. Выполняет поэлементное умножение с выравниванием длины массивов (циклическое повторение более короткого массива).
6. Результат — массив произведений. Фильтрует `null` значения, возникающие при нечисловых входных данных.

## ОТОБРАЖЕНИЕ

- Стандартный заголовок `node-header`.
- Отображает (с автоматическим обновлением при изменении языка):
  - количество входов с неопределённостью (`uncertaintyInputs`);
  - количество входов с множителями (`multiplierInputs`);
  - результат в формате `[0.123456, 0.789012]` или `"--"`.

## JSON-СЕРИАЛИЗАЦИЯ

```javascript
{
  id: number,
  type: "confidenceInterval",
  x: number,
  y: number,
  title: string,
  important: boolean,
  originalTitle: string,
  result: Array<number> | null,
  resultStr: string
}
```

## ПРИМЕР ИСПОЛЬЗОВАНИЯ

```javascript
const ciNode = new ConfidenceIntervalNode(null, 100, 100, "Доверительный интервал");
graph.addNode(ciNode);

// Предположим:
// Вход 1 (uncert): [1, 2, 3]
// Вход 2 (multiplier): 1.96
// Результат: [1.96, 3.92, 5.88]

// Выравнивание длины:
// Вход 1: [1, 2]
// Вход 2: [1.96, 2.58, 3.14]
// Результат: [1.96, 5.16] (второй элемент: 2 * 2.58 = 5.16)
```

## ЗАМЕЧАНИЯ

- Узел чувствителен к типам, но не к порядку подключения — автоматически определяет тип каждого входа.
- Если любой из входов отсутствует или имеет нечисловые значения, результат становится `"--"`.
- Количество входов строго ограничено двумя (не более, не менее).
- При изменении количества входов (добавлении/удалении соединений) `reevaluate` обрабатывает все случаи корректно, включая промежуточные состояния с одним входом.

---

# Руководство по добавлению нового узла

## ОБЩИЕ ТРЕБОВАНИЯ

Для создания нового типа узла необходимо реализовать:

1. **Класс** — наследник `Node` из `core/Node.js`.
2. **Объект `metadata`** — экспортируемая константа.
3. **Регистрация** — добавление в `src/nodes/manifest/this-manifest.js`.
4. **Локализация** — файлы переводов в `src/nodes/locales/{en,ru}/{имяФайла}.js`.

## СТРУКТУРА КЛАССА

### Минимальная реализация

```javascript
import { Node } from '../core/Node.js';

export const metadata = {
  type: 'myNode',              // уникальный строковый идентификатор
  nameKey: 'nodes.myNode',     // ключ для перевода имени
  descriptionKey: 'nodeDescriptions.myNode',
  author: 'Ваше имя',
  icon: 'fa-circle',           // иконка Font Awesome
  dataType: 'num',             // один из типов данных
  canHaveIncomingEdges: true,  // может ли принимать соединения
  canHaveOutgoingEdges: true,  // может ли быть источником
  allowedInputTypes: ['num'],  // разрешённые типы на входе
  allowedOutputTypes: ['num'], // разрешённые типы на выходе (если есть)
  defaultValue: null
};

export class MyNode extends Node {
  constructor(id, x, y, title, options = {}) {
    super(id, 'myNode', x, y, title, options);
    // Инициализация пользовательских свойств
    this.myProperty = options.myProperty ?? 0;
  }

  getValue() {
    // Возвращает выходное значение (всегда массив)
    return [this.myProperty];
  }

  createDOM(graph, renderer) {
    const div = this.createBaseDiv(graph, renderer);
    // Добавление пользовательского содержимого
    const content = document.createElement('div');
    content.textContent = this.myProperty;
    div.appendChild(content);
    
    renderer.addHandles(div, this.id, null);
    renderer.applyOptStyles(div);
    return div;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      myProperty: this.myProperty
    };
  }
}
```

### Опциональные методы

| Метод | Сигнатура | Назначение |
|-------|-----------|------------|
| `reevaluate` | `reevaluate(graph: Graph): void` | Пересчёт внутреннего состояния при изменении входов. |
| `updateDisplay` | `updateDisplay(graph: Graph): void` | Обновление отображаемых данных без пересчёта логики. |
| `canAcceptEdge` | `canAcceptEdge(source: Node, port: string): { ok: boolean, message?: string }` | Валидация входящих соединений (например, ограничение количества). |
| `getOutputValue` | `getOutputValue(port: string, visited: Set, graph: Graph): Array<any>` | Возврат значения для указанного порта (для мультипортовых узлов). |
| `onAttach` | `onAttach(graph: Graph): void` | Вызывается при добавлении узла в граф. |
| `onDetach` | `onDetach(): void` | Вызывается при удалении узла из графа. |
| `getMinHeight` | `getMinHeight(): number` | Возвращает минимальную высоту узла в пикселях. |
| `static onCreate` | `static onCreate(graph: Graph, x: number, y: number, options: object): Promise<Node \| null>` | Кастомная логика создания (например, диалог ввода). |

## РЕГИСТРАЦИЯ В MANIFEST

В файле `src/nodes/manifest/this-manifest.js`:

```javascript
import { MyNode, metadata as myNodeMeta } from '../MyNode.js';

export const nodesManifest = [
  // ... существующие узлы
  { ctor: MyNode, metadata: myNodeMeta, fileName: 'myNode.js' },
];
```

## ЛОКАЛИЗАЦИЯ

### Английская версия (`src/nodes/locales/en/myNode.js`)

```javascript
export default {
  nodes: {
    myNode: 'My Node'
  },
  nodeDescriptions: {
    myNode: 'Description of my custom node'
  },
  myNode: {
    // специфичные для узла ключи
    someLabel: 'Some Label'
  }
};
```

### Русская версия (`src/nodes/locales/ru/myNode.js`)

```javascript
export default {
  nodes: {
    myNode: 'Мой узел'
  },
  nodeDescriptions: {
    myNode: 'Описание моего пользовательского узла'
  },
  myNode: {
    someLabel: 'Некоторый заголовок'
  }
};
```

## ПРИМЕЧАНИЯ ПО РАЗРАБОТКЕ

- Метод `getValue()` **всегда** должен возвращать массив, даже если узел выдаёт одно значение.
- При изменении состояния узла, влияющего на граф, необходимо вызывать `graph.reevaluateAll()` и `renderer.render()` (или `renderer.save()` для сохранения истории).
- Для редактируемых текстовых полей используйте `EditableTitle`.
- Для модальных диалогов используйте `modal.alert()`, `modal.confirm()`, `modal.prompt()`.
- При подписке на изменения i18n внутри `createDOM` необходимо сохранять `unsubscribe`-функцию и вызывать её при удалении DOM-элемента (см. `CalcNode` как пример).
- При реализации мультипортовых узлов используйте параметр `unmappedPort` в `renderer.addHandles()` для создания дополнительных портов.
- Для кастомных цветов портов используйте CSS-класс `node-handle-blue` (как в `MapNode` для порта `unmapped`).
