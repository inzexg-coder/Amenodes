# `Edge`

## ОПИСАНИЕ

`Edge` – простой класс-контейнер, представляющий направленную связь (ребро) между двумя узлами в графе. Класс не содержит логики проверки или вычислений – только хранение идентификаторов и сериализацию.

**Важно:** экземпляры `Edge` создаются исключительно через метод `Graph.addEdge()`. Ручное создание экземпляров вне графа не рекомендуется.

## ЗАВИСИМОСТИ

Класс `Edge` не импортирует внешние модули – он является самодостаточным.

# КЛАСС EDGE

## Конструктор

```javascript
constructor(id: number, sourceId: number, targetId: number, port: string = 'main')
```

Создаёт новое ребро, соединяющее узел-источник с узлом-приёмником через указанный порт.

**Параметры:**

| Параметр | Тип | Обязательный | По умолчанию | Описание |
|----------|-----|--------------|--------------|----------|
| `id` | `number` | Да | — | Уникальный числовой идентификатор ребра. Управляется счётчиком `Graph.nextEdgeId`. |
| `sourceId` | `number` | Да | — | Идентификатор узла, из которого исходит связь. Должен существовать в графе. |
| `targetId` | `number` | Да | — | Идентификатор узла, в который входит связь. Должен существовать в графе. |
| `port` | `string` | Нет | `'main'` | Имя порта на узле-источнике. Позволяет узлам иметь несколько выходов. |

**Свойства экземпляра:**

| Свойство | Тип | Описание |
|----------|-----|----------|
| `this.id` | `number` | Уникальный идентификатор ребра (только для чтения). |
| `this.sourceId` | `number` | Идентификатор узла-источника. |
| `this.targetId` | `number` | Идентификатор узла-приёмника. |
| `this.sourcePort` | `string` | Имя порта на узле-источнике. |

**Пример:**

```javascript
// Обычно вызывается через Graph.addEdge, но возможно и прямое создание
const edge = new Edge(5, 1, 3, 'main');
console.log(edge.id);        // 5
console.log(edge.sourceId);  // 1
console.log(edge.targetId);  // 3
console.log(edge.sourcePort); // 'main'
```

# Методы

## toJSON()

```javascript
toJSON(): object
```

Сериализует ребро в простой JavaScript-объект для последующего сохранения в JSON. Метод вызывается автоматически при передаче экземпляра `Edge` в `JSON.stringify()`.

**Возвращает:** объект со следующей структурой:

```javascript
{
  id: number,           // идентификатор ребра
  sourceId: number,     // идентификатор узла-источника
  targetId: number,     // идентификатор узла-приёмника
  sourcePort: string    // имя порта (обычно 'main')
}
```

**Пример:**

```javascript
const edge = new Edge(7, 2, 4, 'unmapped');
const serialized = edge.toJSON();
console.log(serialized);
// {
//   id: 7,
//   sourceId: 2,
//   targetId: 4,
//   sourcePort: 'unmapped'
// }

// Также работает неявно через JSON.stringify:
const jsonString = JSON.stringify(edge);
// '{"id":7,"sourceId":2,"targetId":4,"sourcePort":"unmapped"}'
```

# ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ

### Получение рёбер из графа

```javascript
const graph = new Graph();
// ... добавление узлов и создание рёбер

const edges = graph.edges;
for (const edge of edges) {
  console.log(`Связь ${edge.id}: ${edge.sourceId} → ${edge.targetId} через порт ${edge.sourcePort}`);
}
```

### Фильтрация рёбер по узлу-источнику

```javascript
function getEdgesFromNode(graph, sourceId) {
  return graph.edges.filter(edge => edge.sourceId === sourceId);
}

const outgoing = getEdgesFromNode(graph, 1);
outgoing.forEach(edge => {
  console.log(`Исходящая связь к узлу ${edge.targetId}`);
});
```

### Проверка наличия связи между узлами

```javascript
function hasDirectEdge(graph, sourceId, targetId) {
  return graph.edges.some(edge => 
    edge.sourceId === sourceId && edge.targetId === targetId
  );
}

if (hasDirectEdge(graph, 1, 2)) {
  console.log('Узел 1 напрямую соединён с узлом 2');
}
```

### Десериализация рёбер из сохранённого состояния

```javascript
// Внутри Graph.loadFrom:
for (const edgeData of data.edges) {
  const edge = new Edge(
    edgeData.id,
    edgeData.sourceId,
    edgeData.targetId,
    edgeData.sourcePort || 'main'
  );
  this.edges.push(edge);
}
```

## ЗАМЕЧАНИЯ

- Класс `Edge` не проверяет существование узлов с идентификаторами `sourceId` и `targetId`
- Поле `sourcePort` используется для поддержки узлов с несколькими портами вывода.
- При удалении узла все связанные с ним рёбра удаляются автоматически.
- Два узла могут быть соединены несколькими рёбрами, если они используют разные порты или если логика графа не запрещает дублирование.
- Сериализация через `toJSON()` не включает метаданные, которые могут быть добавлены в будущих версиях.
