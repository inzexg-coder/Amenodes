# ROADMAP — Статус реализации

Проверено по кодовой базе (ветка `main`, июнь 2026).

Условные обозначения:
- ✅ **Реализовано** — код присутствует, фича работает
- 🔶 **Частично** — есть основа, но не все детали из описания
- ❌ **Не реализовано** — кода нет
- ⚪ **Не применимо** — инфраструктура / нейминг / не для фронтенда

---

## Анимации и ховеры

**1.** transition: all 0.3s ease  
✅ Есть в CSS `--transition: all 0.3s ease` (main.css:23)

**2.** Ховер на нод — scale(1.02) + glow  
🔶 Есть hover-тень `--node-hover-shadow`, scale не выставлен

**3.** Ховер на ребро — подсветка + утолщение  
🔶 Подсветка есть (EdgeRenderer: клик добавляет класс `edge-highlighted`), утолщения/ховера нет

**4.** Ховер на порт — scale(1.5) + вспышка  
🔶 Есть анимация `handle-flash` в CSS, scale(1.5) не реализован

**5.** При drag нода — увеличенная тень + scale(1.03)  
🔶 Есть снятие transition при drag (DomRenderer:485), тени/scale нет

**6.** Курсор crosshair при перетаскивании связи  
❌ Не реализовано

## Горячие клавиши

**7.** Ctrl+C / Ctrl+V  
❌ Не реализовано

**8.** Ctrl+D  
❌ Не реализовано

**9.** Delete / Backspace  
🔶 Реализован только Delete через контекстное меню (main.js:818)

**10.** Ctrl+Z / Ctrl+Y  
❌ Есть только кнопки Undo/Redo, клавиш нет

**11.** + / -  
❌ Не реализовано

**12.** Стрелки  
❌ Не реализовано

**13.** Home / F  
❌ Не реализовано

**14.** F2  
❌ Не реализовано (есть EditableTitle по клику)

**15.** Tab  
❌ Не реализовано (NodeMenu открывается кнопкой +)

## CalcNode режимы

**16–20.** instrument_C2, instrument_C_sqrt12, instrument_class, instrument_digit, relative_error  
❌ Не реализованы. Существующие операции: `div3`, `div_sqrt12`, `sqrt_sum_sq`, `quadratic_sum`, `multiply_by_constant`

## Анимации появления/удаления

**21.** Анимация появления нода: scale(0.8→1) + fade  
❌ Не реализовано (ноды появляются мгновенно)

**22.** Анимация удаления нода: scale(1→0.5) + fade  
❌ Не реализовано (удаление мгновенное)

**23.** Splash-экран: логотип вращается + частицы  
🔶 Splash есть (splash.js), вращение логотипа есть (spin в CSS), частиц нет

**24.** Canvas выезжает снизу  
🔶 Splash скрывается через opacity (splash.js:154), анимации выезда нет

**25.** Toolbar stagger  
🔶 Есть класс `hidden` на appContainer, stagger-анимации нет

**26.** Status bar slide up  
❌ Не реализовано

**27.** Sidebar smooth slide  
✅ Есть `transition: width 0.2s ease` (main.css:394)

**28.** Node menu с scale + backdrop blur  
🔶 Есть `menuSlideIn` animation в CSS, backdrop blur есть в inline-стилях NodeMenu

**29.** Dropdown fade + slide  
🔶 Есть в CalcNode (inline-стили), CSS-анимаций нет

**30.** Линия «рисуется» при создании связи  
❌ Не реализовано

**31.** Линия исчезает с fade при удалении связи  
❌ Не реализовано

**32.** Кнопки в тулбаре — glow + scale + ripple  
🔶 glow есть (hover-стили в CSS), ripple нет

**33.** При mark IMPORTANT — волна синего свечения  
❌ Не реализовано (меняется только класс node-important)

**34.** Жёлтая вспышка при изменении значения  
❌ Не реализовано

**35.** Output-таблица — строки с задержкой  
❌ Не реализовано

**36.** Undo/Redo кнопки «отскакивают»  
❌ Не реализовано

## Селект и выделение

**37.** Multi-select: Shift+Click  
❌ Не реализовано

**38.** Rectangle select  
❌ Не реализовано

## CalcNode режимы (продолжение)

**39–40.** student_t, total_error  
❌ Не реализованы

## Анимации загрузки

**41.** Stagger появление нодов при загрузке  
❌ Не реализовано

**42.** Snap to grid — пружинка  
✅ Snap to grid есть (main.js:31, snap-логика на каждом чётном пикселе), пружинки нет

**43.** Auto-arrange с spring-физикой  
❌ Не реализовано

**44.** Инерция при панорамировании  
❌ Нет (Viewport — обычный drag без инерции)

**45.** Плавный zoom (easing)  
🔶 Zoom есть (main.js:100), easing не настроен

**46.** Сетка при зуме — плавное изменение  
❌ Сетка статична

**47.** LOD — уменьшение нодов на отдалении  
❌ Не реализовано

**48.** Space + drag  
❌ Не реализовано (только правая кнопка)

**49.** Ctrl+Mouse Wheel  
✅ Есть опция ctrlZoomOnly (main.js:101)

## Поиск

**50.** Ctrl+Shift+F — поиск в библиотеке  
❌ Не реализовано (поиск есть в NodeMenu по вводу, без клавиши)

**51.** Ctrl+F — поиск нода на канвасе  
❌ Не реализовано

## Макет

**52.** Expand/collapse selection  
❌ Не реализовано

**53.** Align left/center/right  
❌ Не реализовано

**54.** Distribute evenly  
❌ Не реализовано

**55.** Select all connected  
❌ Не реализовано

**56.** Invert selection  
❌ Не реализовано

**57.** Lock node  
❌ Не реализовано

**58.** Hide node  
❌ Не реализовано

**59.** Pin to view  
❌ Не реализовано

**60.** Инфраструктура атрибутов  
❌ Не реализовано

## UI

**61.** Auto-save indicator  
✅ Есть зелёная точка (autosaveStatus)

**62.** Zoom slider  
❌ Не реализовано (есть кнопки +/-, ползунка нет)

**63.** Canvas ruler  
❌ Не реализовано

**64.** Canvas bg color picker  
🔶 Есть пресеты цветов в splash-настройках, пикера нет

**65.** Toggle grid  
✅ Есть (gridStyleSelect в splash.js)

**66.** Bookmark position  
❌ Не реализовано

**67.** Collapse all sidebars  
✅ Есть кнопки collapse для каждой панели

**68.** Fullscreen mode  
❌ Не реализовано

**69.** Focus mode  
❌ Не реализовано

**70.** Tooltips  
❌ Не реализовано

**71.** Data types на портах  
❌ Не реализовано

**72.** Resizable sidebars  
❌ Не реализовано

**73.** Node value preview  
🔶 У OutputNode есть preview, на самих нодах — нет

**74.** Error badge  
❌ Не реализовано

**75.** Warning badge  
❌ Не реализовано

**76.** Recent files  
❌ Не реализовано

**77.** Auto-complete  
🔶 Есть в NodeMenu (searchInput), но без подсказок

**78.** Node favorites  
❌ Не реализовано

**79.** Recently used nodes  
❌ Не реализовано

**80.** Tutorial overlay  
❌ Не реализовано

**81.** Context-sensitive help (F1)  
❌ Не реализовано

**82.** RoundNode  
❌ Не реализовано

**83.** Пульсация при выделении в properties panel  
❌ Не реализовано

**84.** Edge rerouting  
🔶 Позиции обновляются при каждом render (EdgeRenderer.updatePositions), плавности нет

**85.** Connection preview  
❌ Не реализовано

**86.** Waves по связям  
❌ Не реализовано

**87.** Export as PNG  
❌ Не реализовано (есть только .amnk экспорт)

**88.** Export as SVG  
❌ Не реализовано

**89.** Export as JSON  
❌ Не реализовано

**90.** Copy to clipboard  
❌ Не реализовано

**91.** Import from clipboard  
❌ Не реализовано

**92.** Export selection  
❌ Не реализовано

**93.** Auto-export to file  
❌ Не реализовано (есть только auto-save в localStorage)

**94.** Node history  
❌ Не реализовано (есть только общий History)

**95.** Evaluation progress  
❌ Не реализовано

**96.** Node eval time  
❌ Не реализовано

**97.** Dependency graph overlay  
❌ Не реализовано

**98.** Bulk edit  
❌ Не реализовано

**99.** History slider  
❌ Не реализовано

**100.** Workspace presets  
❌ Не реализовано

**101.** Multi-language indicator  
✅ Есть LanguageSwitcher в тулбаре

**102.** ReferenceTableNode  
❌ Не реализовано

**103.** Background particles  
❌ Не реализовано

**104.** Particle flow по рёбрам  
❌ Не реализовано

**105.** Node pulse для IMPORTANT  
❌ Есть только класс node-important в CSS, pulse-анимации нет

**106.** Glow при connection  
❌ Не реализовано

**107.** Вспышка при создании нода  
❌ Не реализовано

**108.** Микро-частицы на портах  
❌ Не реализовано

**109.** Градиентные связи  
❌ Не реализовано

**110.** Highlight connected  
❌ Не реализовано

**111.** Cascade glow  
❌ Не реализовано

**112.** CompareNode  
❌ Не реализовано

**113.** Minimap  
❌ Не реализовано

**114.** Custom SVG иконки  
❌ Не реализовано (используются FontAwesome)

**115.** Node preview thumbnail  
❌ Не реализовано

**116.** Animated gradient background  
❌ Не реализовано

**117.** Авто-анимация высоты нода  
❌ Не реализовано

**118.** Theme system  
🔶 Есть CSS-переменные для тёмной темы, светлой нет, переключения нет

**119.** 3D perspective tilt  
❌ Не реализовано

**120.** FormulaNode  
❌ Не реализовано

**121–130.** 3D Graph View, Orbit controls, Force layout, VR и т.д.  
❌ Не реализовано

**131.** LinearScaleNode  
❌ Не реализовано

**132.** Sound effects  
❌ Не реализовано

**133.** Voice control  
❌ Не реализовано

**134.** Particle explosion  
❌ Не реализовано

**135.** Fireworks  
❌ Не реализовано

**136.** Chaos mode  
❌ Не реализовано

**137.** Session restore  
✅ Есть (автозагрузка из localStorage в History.loadFromStorage)

**138.** Skeleton loading  
❌ Не реализовано

**139.** Bounce animation  
❌ Не реализовано

**140.** Color themes per node type  
❌ Не реализовано

**141.** Edge arrow animation  
❌ Стрелки статичны (EdgeRenderer)

**142.** Drag ghost  
❌ Не реализовано

**143.** Multi-user collaboration  
❌ Не реализовано
