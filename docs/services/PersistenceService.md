# `PersistenceService`

## ОПИСАНИЕ

`PersistenceService` – служебный класс, обеспечивающий сохранение и восстановление состояния графа в различных хранилищах: локальное хранилище браузера (localStorage) и файловая система (импорт/экспорт в формате JSON). 
Сервис также отвечает за синхронизацию с глобальными параметрами видимости (позиция viewport, масштаб, качество отображения).

**Важно:** класс не хранит собственное состояние графа, а работает с переданным экземпляром `Graph` через ссылку.

## ЗАВИСИМОСТИ

```javascript
import { modal } from '../ui/CustomModal.js';
```

| Импорт | Назначение |
|--------|------------|
| `modal` | Объект для отображения модальных диалогов (подтверждение удаления данных, уведомления). |

# КЛАСС PERSISTENCESERVICE

## Конструктор

```javascript
constructor(graph: Graph)
```

Создаёт новый экземпляр сервиса, связывая его с конкретным графом.

**Параметры:**

- `graph` – экземпляр класса `Graph`, состояние которого будет сохраняться и загружаться.

**Инициализируемые свойства:**

| Свойство | Тип | Описание |
|----------|-----|----------|
| `this.graph` | `Graph` | Ссылка на граф, с которым работает сервис. |

# МЕТОДЫ

## saveToStorage(viewport, zoom, quality)

```javascript
saveToStorage(viewport: Viewport | null, zoom: number | null, quality: number | null): void
```

Сохраняет текущее состояние графа и параметры отображения в `localStorage` по ключу `amenodes_autosave`.

**Параметры:**

- `viewport` – экземпляр класса `Viewport` (или `null`). Если передан, используются его координаты смещения через `getOffset()`.
- `zoom` – числовое значение масштаба (или `null`). Если не передан, в данных сохраняется `1`.
- `quality` – числовое значение качества дизайна от 0 до 100 (или `null`). Если не передан, сохраняется `100`.

**Алгоритм:**

1. Вызывается `this.graph.toSerial()` для получения сериализованного графа.
2. Если передан `viewport`, из него извлекаются координаты смещения `offset.x` и `offset.y`.
3. Если `viewport` не передан, используются глобальные переменные `window._viewportX` и `window._viewportY` (или `0`).
4. В объект данных добавляются поля:
   - `viewportOffsetX`, `viewportOffsetY`
   - `viewportZoom`
   - `designQuality`
5. Данные сериализуются в JSON и сохраняются в `localStorage`.
6. Вызывается `showAutosaveStatus()` для отображения уведомления.

- Запись в `localStorage`.
- Визуальное уведомление пользователя (появление надписи «Saved»).

**Пример:**

```javascript
// Сохранение с параметрами viewport
const viewport = new Viewport(container, canvasContainer);
persistence.saveToStorage(viewport, 1.5, 85);

// Сохранение без viewport (будут использованы глобальные переменные)
window._viewportX = 200;
window._viewportY = -150;
persistence.saveToStorage(null, 0.8, 50);
```

## loadFromStorage()

```javascript
loadFromStorage(): object | null
```

Загружает ранее сохранённое состояние графа из `localStorage` и восстанавливает его.

**Алгоритм:**

1. Чтение данных из `localStorage` по ключу `amenodes_autosave`.
2. Если данных нет, возвращается `null`.
3. Парсинг JSON в объект.
4. Вызов `this.graph.loadFrom(data)` для восстановления графа.
5. Если в данных присутствует поле `designQuality` и определена глобальная функция `window.applyDesignQuality`, она вызывается для применения качества.
6. Если в данных присутствуют поля `viewportOffsetX`, `viewportOffsetY` и определён глобальный объект `window._viewport`, вызывается `window._viewport.setOffset()`.
7. Если в данных присутствует поле `viewportZoom` и определена глобальная функция `window.setZoom`, она вызывается для установки масштаба.

**Возвращает:** объект с загруженными данными (тот же, что был передан в `loadFrom`) или `null`, если сохранений нет или произошла ошибка.

**Перехватываемые исключения:** любые ошибки парсинга или восстановления логируются в консоль (`console.error`), метод возвращает `null`.

**Пример:**

```javascript
const loadedData = persistence.loadFromStorage();
if (loadedData) {
  console.log('Граф восстановлен из автосохранения');
} else {
  console.log('Сохранений не найдено');
}
```

## exportToFile()

```javascript
exportToFile(): void
```

Экспортирует текущее состояние графа в JSON-файл с расширением `.amnk`, инициируя скачивание через браузер.

**Алгоритм:**

1. Получение сериализованных данных через `this.graph.toSerial()`.
2. Добавление в данные параметров:
   - `viewportOffsetX` и `viewportOffsetY` из глобальных переменных `window._viewportX`/`_viewportY` (или `0`).
   - `viewportZoom` из `window.currentZoom` (или `1`).
   - `designQuality` из `window.currentQualityValue` (или `100`).
3. Создание `Blob` с MIME-типом `application/json`.
4. Создание временной ссылки через `URL.createObjectURL`.
5. Создание невидимого элемента `<a>` с атрибутами `download` (имя файла формируется как `diagram_YYYY-MM-DDTHH-MM-SS.amnk`) и `href`.
6. Программный клик по ссылке.
7. Освобождение URL через `URL.revokeObjectURL`.

**Пример имени файла:** `diagram_2026-05-21T14-30-45.amnk`
Инициируется скачивание файла; никакие данные не сохраняются в `localStorage`.

**Пример:**

```javascript
const saveBtn = document.getElementById('exportBtn');
saveBtn.onclick = () => persistence.exportToFile();
```

## importFromFile(file)

```javascript
importFromFile(file: File): Promise<boolean>
```

Импортирует граф из ранее экспортированного JSON-файла. Метод асинхронный, возвращает Promise.

**Параметры:**

- `file` – объект `File`, полученный из элемента `<input type="file">`.

**Алгоритм:**

1. Создаётся резервная копия текущего состояния графа через `this.graph.toSerial()` (на случай ошибки).
2. Создаётся `FileReader`.
3. При успешном чтении файла:
   - Данные парсятся в JSON.
   - Вызывается `this.graph.loadFrom(data)`.
   - Если в данных присутствуют поля `viewportOffsetX`, `viewportOffsetY` и определён `window._viewport`, восстанавливается позиция.
   - Если присутствует `viewportZoom` и определена `window.setZoom`, восстанавливается масштаб.
   - Если присутствует `designQuality` и определена `window.applyDesignQuality`, применяется качество.
   - Promise разрешается с `true`.
4. При ошибке парсинга или загрузки:
   - Восстанавливается состояние графа из резервной копии.
   - Promise разрешается с `false`.
5. Чтение файла выполняется асинхронно.

**Возвращает:** `Promise<boolean>` – `true` при успешной загрузке, `false` при ошибке.

**Пример:**

```javascript
const fileInput = document.getElementById('fileInput');
fileInput.onchange = async (event) => {
  const file = event.target.files[0];
  const success = await persistence.importFromFile(file);
  if (success) {
    console.log('Граф успешно загружен');
    renderer.render();
  } else {
    console.error('Ошибка при загрузке файла');
  }
  fileInput.value = ''; // Сброс для повторного выбора того же файла
};
```

## showAutosaveStatus()

```javascript
showAutosaveStatus(): void
```

Отображает временное уведомление об автосохранении. Метод находит элемент с идентификатором `autosaveStatus` и временно изменяет его прозрачность.

**Алгоритм:**

1. Поиск элемента `document.getElementById('autosaveStatus')`.
2. Если элемент существует:
   - Устанавливается `style.opacity = '1'`.
   - Через `setTimeout` (1500 мс) устанавливается `style.opacity = '0'`.

**Примечание:** метод вызывается автоматически из `saveToStorage`. Прямой вызов обычно не требуется.

**Пример:**

```javascript
// Ручное отображение статуса (редко требуется)
persistence.showAutosaveStatus();
```

# ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ

### Полный цикл: автосохранение при каждом изменении

```javascript
import { Graph } from './core/Graph.js';
import { Viewport } from './renderer/Viewport.js';
import { PersistenceService } from './services/PersistenceService.js';

const graph = new Graph();
const viewport = new Viewport(container, canvasContainer);
const persistence = new PersistenceService(graph);

// Функция-обёртка для сохранения после любого действия
function saveState() {
  persistence.saveToStorage(viewport, window.currentZoom, window.currentQualityValue);
}

// Использование
graph.addNode(someNode);
saveState();

renderer.on('nodeMoved', () => saveState());
```

### Инициализация приложения с восстановлением

```javascript
class Application {
  constructor() {
    this.graph = new Graph();
    this.persistence = new PersistenceService(this.graph);
    this.init();
  }
  
  init() {
    const loaded = this.persistence.loadFromStorage();
    if (!loaded) {
      // Создание графа по умолчанию
      this.createDefaultGraph();
    }
    this.renderer.render();
  }
  
  createDefaultGraph() {
    const output = new OutputNode(null, 100, 100, 'Output');
    this.graph.addNode(output);
    this.persistence.saveToStorage(null, 1, 100);
  }
}
```

### Кнопки экспорта/импорта с обработкой ошибок

```javascript
// Экспорт
document.getElementById('exportBtn').onclick = () => {
  try {
    persistence.exportToFile();
  } catch (err) {
    modal.alert(`Ошибка экспорта: ${err.message}`);
  }
};

// Импорт
document.getElementById('importBtn').onclick = () => {
  document.getElementById('fileInput').click();
};

document.getElementById('fileInput').onchange = async (e) => {
  if (!e.target.files.length) return;
  
  const success = await persistence.importFromFile(e.target.files[0]);
  
  if (success) {
    modal.alert('Граф успешно загружен');
    renderer.render();
  } else {
    modal.alert('Ошибка: неверный формат файла');
  }
  
  e.target.value = ''; // Сброс
};
```

### Периодическое автосохранение

```javascript
// Сохранение каждые 30 секунд
setInterval(() => {
  persistence.saveToStorage(viewport, window.currentZoom, window.currentQualityValue);
}, 30000);

// Сохранение при закрытии страницы
window.addEventListener('beforeunload', () => {
  persistence.saveToStorage(viewport, window.currentZoom, window.currentQualityValue);
});
```

# ЗАМЕЧАНИЯ

- **Ключ localStorage:** `amenodes_autosave` – используется также классом `History` для автосохранения. Не рекомендуется изменять этот ключ в других частях приложения.
- **Резервное копирование:** метод `importFromFile` создаёт резервную копию перед загрузкой, что позволяет откатить изменения при ошибке. Резервная копия не сохраняется в `localStorage`.
- **Глобальные зависимости:** методы полагаются на глобальные переменные `window._viewportX`, `window._viewportY`, `window.currentZoom`, `window.currentQualityValue`, `window._viewport`, `window.setZoom`, `window.applyDesignQuality`. Их отсутствие не вызывает ошибок, но соответствующие параметры не будут восстановлены.
- **Расширение файлов:** метод `exportToFile` создаёт файлы с расширением `.amnk`. Это не влияет на формат (внутри JSON), но служит идентификатором для приложения.
- **Потокобезопасность:** все операции синхронны, за исключением `importFromFile`, который асинхронен из-за `FileReader`.
- **Уведомления:** `showAutosaveStatus` предполагает наличие элемента DOM с `id="autosaveStatus"`. Если элемент отсутствует, метод завершается без ошибок.
