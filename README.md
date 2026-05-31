# Halyk Pro — MVP

Платформа верифицированных юристов, адвокатов, бухгалтеров и налоговых консультантов внутри экосистемы Halyk Bank. Прототип оформлен как мобильный экран (фрейм 390px) и проходит полный путь клиента: от выбора специалиста и AI-консультации до сделки с эскроу, чата в реальном времени и завершения с отзывом.

> Это MVP/демо. Авторизация, сделки, чат, отзывы, верификация эксперта, каталог (категории/задачи/эксперты) и AI-подбор работают через FastAPI-бэкенд. Если бэкенд недоступен, каталог делает graceful-фолбэк на статические моки (`lib/mock-data.ts`), а оплата/эскроу смоделированы на фронте. Подробности — в [`FRONTEND.md`](./FRONTEND.md).

## Стек

| Слой | Технология | Подтверждение |
|------|-----------|---------------|
| Фреймворк | Next.js **16.2.6** (App Router, `'use client'`) | `package.json`, `node_modules/next/package.json` |
| UI | React **19.2.4** | `package.json` |
| Стили | TailwindCSS **v4** (`@import "tailwindcss"` + `@theme inline`) | `app/globals.css`, `postcss.config.mjs` |
| Иконки | `lucide-react` | `package.json` |
| Markdown | `react-markdown` (ответы AI) | `app/client/ai-consult/page.tsx` |
| Данные + Realtime | FastAPI-бэкенд: REST (`/api/v1`) + WebSocket | `lib/api.ts`, [`BACKEND.md`](./BACKEND.md) |
| AI | FastAPI `/api/v1/ai/*` (на бэкенде — gpt-4o-mini) | `lib/api.ts`, [`BACKEND.md`](./BACKEND.md) §8 |

## Архитектура

```
Браузер (Next.js client components)
  └──► FastAPI-бэкенд  (BACKEND.md)
         REST  /api/v1/...        сделки, сообщения, AI, справочники, отзывы, файлы
         WS    /api/v1/ws/...     realtime: deal.updated / message.created / deal.created
```

Весь обмен с бэкендом идёт через единый клиент [`lib/api.ts`](./lib/api.ts): авторизация (Bearer JWT), REST-вызовы и WebSocket-каналы. Раньше фронт ходил напрямую в Supabase — теперь это заменено на FastAPI (детали миграции — [`BACKEND.md`](./BACKEND.md) §12). Контракт со стороны фронта — [`FRONTEND.md`](./FRONTEND.md).

> Прежняя архитектура (прямой Supabase из браузера + серверные роуты `app/api/ai/*` через OpenAI) убрана: эти роуты и `lib/openai.ts` удалены, AI идёт на FastAPI. Файлы `supabase-*.sql` оставлены как историческая схема Supabase и кодом не используются.

## Быстрый старт

```bash
pnpm install          # в репозитории есть pnpm-lock.yaml; npm install тоже работает
pnpm dev              # → http://localhost:3000
```

Доступные скрипты (`package.json`): `dev`, `build`, `start`, `lint`.

## Переменные окружения

Файл `.env.local` в репозитории отсутствует — создайте его вручную в корне проекта:

```env
# Базовый URL FastAPI-бэкенда (REST + WebSocket)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Где используется: `lib/api.ts` (по умолчанию `http://localhost:8000`, если переменная не задана). WebSocket-адрес выводится автоматически (`http→ws`, `https→wss`). Если бэкенд недоступен, создание сделки делает fallback-редирект на `/deal/demo-deal-1`, а AI-консультация показывает запасной ответ.

> `OPENAI_API_KEY` фронтенду больше не нужен — AI выполняется на стороне FastAPI (см. [`BACKEND.md`](./BACKEND.md) §8). Авторизация: на `/halyk-pro` есть экран входа — пользователь вводит `user_id` (или жмёт быстрый вход), фронт получает Bearer-токен через `POST /api/v1/auth/token` и работает под этой идентичностью (`lib/api.ts` → `login`/`currentUserId`). Подробнее — [`FRONTEND.md`](./FRONTEND.md) §11.5.

## Бэкенд и данные

Данные, realtime, AI, справочники, отзывы и загрузка файлов обслуживаются FastAPI-бэкендом. Полный контракт — в [`BACKEND.md`](./BACKEND.md): эндпоинты `/api/v1/*`, WebSocket-каналы `/api/v1/ws/*`, модели ответов, конечный автомат `deal.status`, коды ошибок и песочница (`/docs`, `/openapi.json`).

> Файлы `supabase-*.sql` относятся к прежней архитектуре (прямой доступ из браузера к Supabase) и больше не отражают актуальную схему — её владелец теперь бэкенд.

## Карта маршрутов (Customer Journey)

```
/                         Мок главного экрана Halyk Bank → плитка «Halyk Pro»
└─ /halyk-pro             Вход / регистрация (логин + пароль) → POST /auth/register|token → GET /users/me.
                            Затем выбор роли. «Я специалист»: verified → /expert/dashboard, иначе → /expert/verify

КЛИЕНТ
└─ /client/category       Выбор категории → GET /categories (+ счётчики из /experts)
   └─ /client/problem            ?category=…           GET /problems?category=… или «Другой запрос»
      └─ /client/ai-consult      ?category=&problem=…  AI-чат  → POST /api/v1/ai/consult
         └─ /client/experts      ?category=&desc=&allCategories=  GET /experts + AI-подбор (POST /ai/match)
            └─ /client/experts/[id]                    Профиль эксперта → GET /experts/{id}
               └─ /client/deal/new   ?expert=…         Описание задачи → POST /deals (status=pending)
                  └─ /deal/[roomCode]?role=client      Комната сделки (см. ниже)

ОБЩИЙ ПРОФИЛЬ
└─ /profile               Профиль клиента и эксперта: вернуться к своим диалогам
                            (запомненные сделки → GET /deals/{room_code}) или искать нового специалиста

ЭКСПЕРТ
└─ /expert/verify         Верификация: анкета + загрузка документов → заявка (pending → verified)
└─ /expert/dashboard      Входящие заявки + активные сделки (Realtime, «Откликнуться») — только для verified
   └─ /expert/profile     Профиль эксперта (реальные данные с фолбэком на сид)
   └─ /deal/[roomCode]?role=expert
      └─ /deal/[roomCode]/submit?role=expert           Сдать работу (отправляет сообщение)

ОБЩЕЕ
└─ /deal/[roomCode]?role=client|expert                 Один экран — разные состояния по deal.status
   └─ /deal/[roomCode]/complete?role=&expert=          Release Payment + отзыв (симуляция, не сохраняется)

АДМИН
└─ /admin                 Проверка заявок экспертов (только роль admin):
                            GET /admin/expert-applications, approve/reject → эксперт получает доступ к клиентам.
                            Вход: admin@halyk.kz / pass123123 (быстрый вход «Админ» на /halyk-pro)

ДЕМО
└─ /demo  ·  /demo/client (→ /halyk-pro)  ·  /demo/expert (→ /expert/dashboard)
```

### Состояния сделки (`deal.status`)

```
pending ──(эксперт «Откликнуться»)──► claimed ──(эксперт шлёт цену)──► offered
   │                                                                      │
   │                                              (клиент принимает и платит)
   │                                                                      ▼
   └────────────────────────(клиент отклоняет)───► cancelled          active
                                                                          │
                                                       (клиент подтверждает)
                                                                          ▼
                                                                      completed
```

Один и тот же экран `/deal/[roomCode]` рендерит разные представления в зависимости от `role` (из query) и `status`: ожидание, форма оффера, просмотр оффера, чат. Realtime обновляет состояние без перезагрузки.

## Структура проекта

```
app/
  page.tsx                     Мок главного экрана банка
  layout.tsx                   Корневой layout, обёртка .phone-frame (390px)
  globals.css                  Tailwind v4 + дизайн-токены Halyk + утилиты
  halyk-pro/                   Вход + выбор роли + ссылка на общий профиль
  client/                      category · problem · ai-consult · experts · experts/[id] · deal/new
  profile/                     Общий профиль (клиент + эксперт): свои диалоги, поиск нового
  expert/                      dashboard · profile · verify
  admin/                       Панель администратора: проверка заявок экспертов
  deal/[id]/                   page (комната) · submit · complete
  demo/                        page · client · expert
components/
  ExpertCard.tsx
  ui/MobileHeader.tsx · ui/StarRating.tsx
lib/
  mock-data.ts                 CATEGORIES, PROBLEMS, EXPERTS, типы, хелперы, MOCK_DEALS
  api.ts                       Клиент FastAPI: auth (Bearer), REST, WebSocket, User/профили/верификация, типы
supabase-*.sql                 (legacy) схема прежней Supabase-архитектуры
BACKEND.md                     Контракт бэкенда (эндпоинты, WS, модели)
FRONTEND.md                    Контракт со стороны фронта (+ §11: идентичность, профили, верификация)
```

## Что смоделировано и пока не реально

Перечислено здесь честно, чтобы не вводить в заблуждение (детали и приоритеты для бэкенда — в `FRONTEND.md`):

- **Идентичность / гейтинг** — на `/halyk-pro` есть **вход и регистрация** (`POST /auth/register` для новых клиентов, `POST /auth/token` со строгой проверкой пароля + `GET /users/me`), дальше весь фронт работает под вошедшим пользователем (`currentUserId()`). Токен хранится в `localStorage`; протухший/невалидный (401) сбрасывается, нужен повторный вход (пароль на клиенте не хранится — passwordless-вход на бэке убран). Экспертный UI (дашборд, «Откликнуться», «Оффер») доступен только при `is_verified_expert: true`. Сид-логины: эксперты `exp-1…exp-6` — пароль `expert123`, админ `admin@halyk.kz` / `pass123123`. Подробнее — `FRONTEND.md` §11.5.
- **Верификация эксперта** — реальный поток: анкета + загрузка документов (`POST /api/v1/uploads`) → `POST /api/v1/users/me/become-expert` → статус `pending`. Администратор на `/admin` (`GET /admin/expert-applications` + `approve`/`reject`) подтверждает заявку — пользователь получает `is_verified_expert` и доступ к сделкам клиентов. Вход админа: `admin@halyk.kz` / `pass123123`.
- **Профиль эксперта** (`/expert/profile`) грузится через бэкенд с фолбэком на сид-данные.
- **Общий профиль** (`/profile`) — единый для клиента и эксперта: список своих диалогов (room_code сделок запоминается локально, данные подтягиваются реальным `GET /deals/{room_code}`) и кнопка начать новый поиск. Доступен с `/halyk-pro` после входа.
- **Эксперты, задачи, категории (каталог)** — берутся из бэкенда: `GET /api/v1/categories`, `/problems?category=…`, `/experts[?category=…]`, `/experts/{id}`. При недоступности бэкенда — graceful-фолбэк на `lib/mock-data.ts`. Иконки/цвета категорий и задач — из локальной презентации (бэк отдаёт имена иконок и hex), остальной контент реальный. Отзыв-карточки на профиле приходят из бэка (`{author, rating, text}`), в фолбэке — моки.
- **AI-подбор экспертов** (`POST /api/v1/ai/match`) — вызывается на `/client/experts`, когда есть текст запроса (`desc`): эксперты сортируются по соответствию, у каждого показывается обоснование AI, лучший помечается рекомендацией.
- **Оплата / эскроу** — суммы на экране `complete` **реальные** (из сделки: `escrow_amount`, `commission`). Списание/выплата — на бэкенде при завершении; «Release Payment» — анимация подтверждения на фронте.
- **Отзыв клиента** — сохраняется через `POST /api/v1/deals/{id}/review` (best-effort).
- **Файлы сделки** — в `deal/new` и `submit` берутся только имена файлов (реальная загрузка через `/api/v1/uploads` подключена пока только в верификации эксперта).

## Документация

- [`BACKEND.md`](./BACKEND.md) — контракт реализованного FastAPI-бэкенда: эндпоинты `/api/v1/*`, WebSocket, модели, авторизация, коды ошибок, песочница.
- [`FRONTEND.md`](./FRONTEND.md) — контракт со стороны фронта: модели данных, операции, требования к Realtime, контракты AI-эндпоинтов.
- `AGENTS.md` / `CLAUDE.md` — правила для AI-ассистентов в этом репозитории.
