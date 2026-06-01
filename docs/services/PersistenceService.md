# `PersistenceService`

## ОПИСАНИЕ

`PersistenceService` – служебный класс, обеспечивающий сохранение и восстановление состояния графа в различных хранилищах: локальное хранилище браузера (localStorage) и файловая система (импорт/экспорт в формате JSON). 
Сервис также отвечает за синхронизацию с глобальными параметрами видимости (позиция viewport, масштаб, качество отображения).

После успешного сохранения (экспорт в файл, импорт из файла, сохранение в localStorage) сервис автоматически вызывает `graph.clearDirty()` для сброса dirty-флага.

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

- `viewport` – экземпляр класса `Viewport` (или `null`).
- `zoom` – числовое значение масштаба (или `null`).
- `quality` – числовое значение качества дизайна от 0 до 100 (или `null`).

**Алгоритм:**

1. Вызывает `this.graph.toSerial()` для получения сериализованного графа.
2. Добавляет параметры viewport, zoom и quality.
3. Сохраняет в `localStorage`.
4. Вызывает `showAutosaveStatus()`.
5. **Вызывает `this.graph.clearDirty()`** – после сохранения граф считается чистым.

## loadFromStorage()

```javascript
loadFromStorage(): object | null
```

Загружает ранее сохранённое состояние графа из `localStorage` и восстанавливает его.

**Алгоритм:**

1. Чтение данных из `localStorage`.
2. Парсинг JSON.
3. Вызов `this.graph.loadFrom(data)`.
4. Восстановление параметров viewport, zoom, quality.
5. **Вызов `this.graph.clearDirty()`** – после загрузки граф считается чистым.

**Возвращает:** объект с загруженными данными или `null`.

## exportToFile()

```javascript
exportToFile(): void
```

Экспортирует текущее состояние графа в JSON-файл с расширением `.amnk`, инициируя скачивание через браузер.

**Алгоритм:**

1. Получение сериализованных данных через `this.graph.toSerial()`.
2. Добавление параметров viewport, zoom, quality.
3. Создание `Blob` и ссылки для скачивания.
4. **Вызов `this.graph.clearDirty()`** – после экспорта граф считается чистым.

## importFromFile(file)

```javascript
importFromFile(file: File): Promise<boolean>
```

Импортирует граф из ранее экспортированного JSON-файла. Метод асинхронный, возвращает Promise.

**Параметры:**

- `file` – объект `File`, полученный из элемента `<input type="file">`.

**Алгоритм:**

1. Создаётся резервная копия текущего состояния графа.
2. Чтение файла через `FileReader`.
3. Парсинг JSON и вызов `this.graph.loadFrom(data)`.
4. Восстановление параметров viewport, zoom, quality.
5. **Вызов `this.graph.clearDirty()`** – после импорта граф считается чистым.
6. При ошибке – восстановление из резервной копии.

**Возвращает:** `Promise<boolean>` – `true` при успешной загрузке, `false` при ошибке.

## showAutosaveStatus()

```javascript
showAutosaveStatus(): void
```

Отображает временное уведомление об автосохранении.

# ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ

### Полный цикл с dirty-состоянием

```javascript
const persistence = new PersistenceService(graph);

// Подписываемся на dirty-состояние
graph.onDirtyChange((isDirty) => {
  console.log(`Граф ${isDirty ? 'грязный' : 'чистый'}`);
});

// Экспорт в файл
persistence.exportToFile();
// После экспорта: graph.isDirty === false

// Импорт из файла
const file = await getFileFromUser();
const success = await persistence.importFromFile(file);
if (success) {
  // После импорта: graph.isDirty === false
  renderer.render();
}

// Автосохранение
persistence.saveToStorage(viewport, zoom, quality);
// После автосохранения: graph.isDirty === false
```

### Кнопки сохранения с состоянием

```javascript
const exportBtn = document.getElementById('exportBtn');
const saveIndicator = document.getElementById('saveIndicator');

graph.onDirtyChange((isDirty) => {
  exportBtn.style.opacity = isDirty ? '1' : '0.5';
  saveIndicator.style.display = isDirty ? 'block' : 'none';
});

exportBtn.onclick = () => {
  persistence.exportToFile();
  // dirty сбрасывается автоматически
  showToast('Graph exported successfully');
};
```

# ЗАМЕЧАНИЯ

- **Ключ localStorage:** `amenodes_autosave` – используется также классом `History` для автосохранения.
- **Резервное копирование:** метод `importFromFile` создаёт резервную копию перед загрузкой.
- **Сброс dirty-флага:** происходит после успешного сохранения в любой форме (экспорт, импорт, автосохранение).
- **Глобальные зависимости:** методы полагаются на глобальные переменные `window._viewportX`, `window._viewportY`, `window.currentZoom`, `window.currentQualityValue`, `window._viewport`, `window.setZoom`, `window.applyDesignQuality`.
- **Расширение файлов:** `.amnk` – не влияет на формат (внутри JSON), но служит идентификатором для приложения.
