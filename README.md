# Todolist (Wails + Go + JS)

Кросс-платформенное десктоп-приложение для управления задачами (To-Do List).
Стек: **Wails (Go + WebView) · Go (repo/service/usecase) · Postgres · Vite (vanilla JS/CSS)**.

## ✨ Возможности

- Добавление задач с валидацией ввода
- Поля задачи: **заголовок**, **дата/время** (не в прошлом), **приоритет** (low/medium/high)
- Отображение списка с адаптивной вёрсткой
- Пометка «выполнено» / возврат в «активные»
- Удаление с **подтверждением (модальное окно)**
- **Сохранение состояния** в PostgreSQL (после перезапуска всё на месте)
- Фильтры:

  - Статус: **All / Active / Completed**
  - Дата: **All dates / Today / This week / Overdue**

- Сортировка:

  - **Date added** (по дате добавления, как в Excel: ASC/ DESC по клику)
  - **Priority** (low→high или high→low, с устойчивыми тай-брейками)
  - **Reset** для возврата к дефолту

- Раздел Completed со сворачиваемой секцией
- **Тёмная/светлая тема**, аккуратные скроллы внутри карточки

---

## 🖼️ Скриншоты

---

## 📦 Быстрый старт

### Требования

- **Go** ≥ 1.21
- **Node.js** ≥ 18 + **npm**
- **Docker** + **docker compose**
- **Wails CLI**:

  ```bash
  go install github.com/wailsapp/wails/v2/cmd/wails@latest
  ```

### 1) Клонирование

```bash
git clone https://github.com/azatAkash/todolist
cd todolist
```

### 2) Дев-режим (одной командой)

```bash
make
```

Что делает `make`:

- скачивает Go-зависимости;
- ставит фронтенд-зависимости (`frontend/`);
- поднимает Postgres в Docker (порт хоста по умолчанию `5433`);
- ждёт healthcheck и применяет миграции (`/migrations/init.sql`);
- запускает `wails dev` (Live Reload).

После запуска:

- UI дев-сервер Vite: `http://localhost:5173/`
- Wails dev URL (для браузера): в консоли будет `http://localhost:34115`

> Если **Wails** не установлен, поставь его командой выше и перезапусти `make`.

### Частые команды

```bash
# только БД (поднять)
docker compose up -d

# посмотреть логи контейнера postgres
docker compose logs -f db

# открыть psql в контейнере
docker compose exec db psql -U postgres -d todolist

# снести данные БД (volume) и поднять чистую
docker compose down -v && docker compose up -d
```

---

## 🏗️ Сборка приложения

Сборка нативного бинарника (без DevServer):

```bash
wails build
```

Где искать:

- macOS: `build/bin/Todolist.app` (или соответствующий `.app`/бинарник)
- Windows: `build/bin/Todolist.exe`
- Linux: `build/bin/todolist`

Полезно:

```bash
wails doctor   # диагностика окружения
```

---

## 🗂️ Архитектура проекта

```
todolist/
├─ internal/
│  ├─ repo/                    # доступ к данным (Postgres)
│  │  ├─ task_repo.go          # PgTaskRepo: CRUD + выборки по статусу
│  │  └─ types.go              # модели: Task, CreateTaskInput, ListParams
│  ├─ service/                 # бизнес-логика (usecase)
│  │  └─ tasks_service.go      # фильтры по дате, доменная сортировка, нормализация
│  ├─ migrations/
│  │  └─ init.sql              # схема БД, индексы, вьюхи, триггеры
│  ├─ app.go                   # Wails App (биндинги к Go методам)
│  └─ main.go                  # bootstrap приложения
│
├─ frontend/
│  ├─ src/
│  │  ├─ js/helpers/           # utilы: theme, time, DOM
│  │  ├─ js/task/
│  │  │  ├─ controller.js      # точка сборки UI (инициализация)
│  │  │  ├─ bind.js            # разнесённые биндинги событий
│  │  │  ├─ filter.js          # UI для фильтров/сортировок + initPriorityDropdown
│  │  │  ├─ modal-delete.js    # модальное подтверждение удаления
│  │  │  ├─ model.js           # состояние UI (status/due/sort) + localStorage
│  │  │  ├─ view.js            # рендер разметки и строк списка
│  │  │  └─ api.js             # вызовы wailsjs Go методов + EventsOn
│  │  └─ styles/               # app.css, task.css, filter.css, modal-delete.css
│  └─ index.html               # корневой html
│
├─ docker-compose.yml          # Postgres + healthcheck
├─ Makefile                    # one-command dev
├─ wails.json                  # конфиг Wails
└─ README.md
```

### Слои

- **repo** — чистый доступ к данным (pgxpool). Без бизнес-логики.
  Пример: `List(ctx, params)` возвращает задачи по статусу; остальные сложные фильтры/сортировки не размазываются сюда.
- **service** — бизнес-правила (usecase): нормализация входов, **фильтры по дате** (today/week/overdue), **доменная сортировка** (priority/created, стабильные тай-брейки), возврат актуального списка после мутаций, логирование.
- **Wails App (`internal/app.go`)** — «фасад» над сервисом, экспортируемый в JS. При мутациях эмитит событие `todos:changed` → фронт перезагружает список с текущими фильтрами/сортами.

---

## 🔌 Переменные окружения

По умолчанию значения берутся из `docker-compose.yml`:

- `POSTGRES_USER=postgres`
- `POSTGRES_PASSWORD=12345678`
- `POSTGRES_DB=todolist`
- Порт хоста: `5433` → контейнер `5432`

Если нужен кастом — создай `.env` рядом с `docker-compose.yml` и поправь Makefile/инициализацию, либо меняй docker-compose.

---

## 🧑‍💻 Как пользоваться

1. Вверху — статус-фильтры: **All / Active / Completed**
2. Ниже — форма добавления (Title, Due date, Time, Priority)
3. Фильтр по датам: **All dates / Today / This week / Overdue**
4. Сортировка: **Date added** (ASC/ DESC по клику), **Priority** (ASC/ DESC), **Reset**
5. В таблице:

   - чекбокс — пометить «выполнено» / вернуть в активные;
   - `×` — удалить (откроется модальное подтверждение).

6. Внизу — сворачиваемый раздел **Completed** с количеством.

---

## ✅ Чеклист (из задания)

### 1. Интерфейс (25)

- [x] Поле ввода, кнопка добавления, список задач
- [x] Стили (CSS), подчёркивание статусов
- [x] Адаптивная вёрстка (мобайл/узкое окно)
- [x] Тёмная/светлая тема (toggle)

### 2. Добавление (20)

- [x] Добавление задачи
- [x] Валидация (непустой заголовок, дата/время не в прошлом)
- [x] Дата/время
- [x] Приоритет (low/medium/high)

### 3. Удаление (15)

- [x] Удаление
- [x] Подтверждение (модалка)

### 4. Выполнение (30)

- [x] Чекбокс «выполнено», зачёркивание
- [x] Перенос в «Completed»
- [x] Возврат в «Active»

### 5. Сохранение (50)

- [x] Сохранение состояния между запусками
- [x] Загрузка состояния на старте
- [x] **PostgreSQL** для хранения
- [x] **repo → service → usecase** (разделение слоёв)

### 6. Фильтрация и сортировка (20)

- [x] Фильтр по статусу
- [x] Сортировка по дате добавления (ASC/ DESC)
- [x] Сортировка по приоритету (ASC/ DESC)
- [x] Фильтр по дате: Today / This week / Overdue

---

## 🧰 Траблшутинг

- **Wails: command not found**

  ```bash
  go install github.com/wailsapp/wails/v2/cmd/wails@latest
  ```

- **Не видны биндинги `wailsjs` в фронтенде**
  Удали артефакты и перезапусти:

  ```bash
  rm -rf frontend/wailsjs frontend/dist
  wails dev
  ```

  (Wails сам сгенерирует `frontend/wailsjs/...`)

- **Vite/rollup: Could not resolve './styles/app.css'**
  Проверь путь импорта в `frontend/src/js/main.js` и наличие `frontend/src/styles/app.css`.
- **Postgres не поднимается/здоровье**
  Проверь `docker compose logs -f db`, порт 5433 не занят, повтори:

  ```bash
  docker compose down -v
  docker compose up -d
  ```

- **База пустая**
  Миграции применяются автоматически в `make`. Запусти `make` заново.

---

## 📹 Демонстрация

Добавь ссылку на видео (YouTube/Drive):
`[Demo Video](https://….)`

---

### Примечания по качеству кода

- Фронтенд без фреймворков, но логика разделена:

  - `model.js` — реактивное состояние + localStorage (status/due/sort)
  - `controller.js` — инициализация и композиция модулей
  - `bind.js` — обработчики событий
  - `filter.js` — UI-индикация для фильтров/сортов
  - `modal-delete.js` — доступная модалка (focus trap light, ESC, backdrop)

- Бэкенд:

  - repo — только SQL/данные (без доменной логики)
  - service — **фильтры по дате** и **устойчивая сортировка** (stable sort, тай-брейки по `created_at`, `id`)
  - App — тонкий слой, эмитит `todos:changed` после мутаций (фронт перезагружает с актуальными prefs)

Удачи на проверке!
