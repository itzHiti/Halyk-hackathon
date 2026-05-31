# BACKEND.md — контракт бэкенда Halyk Pro для фронтенда

Этот документ описывает **реально реализованный** FastAPI-бэкенд и заменяет прямые
обращения фронтенда к Supabase. Каждый эндпоинт ниже существует в коде (`app/api/*`)
и покрыт тестами (`tests/*`). Если вы мигрируете фронт с Supabase — здесь есть
прямое соответствие старым вызовам (§12).

> Источник истины по схемам ответов — Pydantic-модели в `app/schemas/*` и
> OpenAPI на `/openapi.json` (Swagger UI: `/docs`).

---

## 1. База, формат, версии

- **Base URL:** `http://<host>:8000`
- **Префикс API:** все REST-эндпоинты под `/api/v1`.
- **Формат:** JSON (`Content-Type: application/json`), кроме `/auth/token`
  (form-urlencoded) и `/uploads` (multipart/form-data).
- **Деньги:** целые числа в тенге (₸), без копеек.
- **Дата/время:** ISO-8601 в UTC (например `2026-05-31T08:30:00+00:00`). Форматируйте
  в браузере локалью `ru`.
- **Ошибки:** единый вид `{"detail": "<текст>"}` со статусами `401, 403, 404, 409, 422`.
- **CORS:** настроен на `CORS_ORIGINS` (по умолчанию `http://localhost:3000`),
  включая WebSocket-origin.

### Переменная окружения фронта

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 2. Авторизация (Bearer JWT)

Все **мутации** и часть запросов требуют заголовок `Authorization: Bearer <token>`.
Токен получают один раз и хранят на клиенте.

### `POST /api/v1/auth/token`  *(form-urlencoded)*

```
username=<user_id>&password=<любой>
```

- `username` — это `user_id` (субъект токена).
- **Обычные пользователи (MVP) — без пароля:** `password` принимается, но не
  проверяется. Для **клиента** передавайте его идентификатор (Halyk ID; на время MVP —
  любую стабильную строку, напр. `client-demo`); для **эксперта** — его `user_id`
  (в сидовых данных совпадает с `id`, напр. `exp-5`).
- **Пользователи с паролем (админ) — пароль проверяется.** Если у пользователя задан
  пароль (как у сид-админа), неверный пароль → `401`. Сид-админ:
  `username=admin@halyk.kz`, `password=pass123123`.

**Ответ `200`:**
```json
{ "access_token": "<jwt>", "token_type": "bearer" }
```

Пример клиента:
```ts
const res = await fetch(`${API}/api/v1/auth/token`, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ username: userId, password: "x" }),
});
const { access_token } = await res.json();
// далее: headers: { Authorization: `Bearer ${access_token}` }
```

При выдаче токена бэк автоматически создаёт пользователя (`User`) с ролью `client`.

> Можно временно отключить проверку на бэке (`AUTH_REQUIRED=false`) — тогда токен
> не требуется. В продакшене оставьте включённой.

---

## 2a. Пользователи, роли и верификация (User / Admin)

Каждый субъект токена (`user_id`) — это пользователь с ролью `client | expert | admin`.
**По умолчанию `client`.** Пользователь может подать заявку на статус эксперта,
приложив документы; заявку **вручную одобряет админ**. До одобрения эксперт
**не может принимать сделки** (`claim`/`offer` → `403`).

```
client (по умолчанию)
   │  POST /users/me/become-expert (+ documents)  → заявка verification_status="pending"
   ▼
expert/pending   ──── claim/offer → 403 «Expert profile is not verified yet»
   │  админ смотрит документы → одобряет / отклоняет
   ├── POST /admin/experts/{id}/approve  → approved, is_verified=true, role="expert"
   └── POST /admin/experts/{id}/reject   → rejected, is_verified=false
   ▼
expert/approved  ──── claim/offer доступны
```

### `GET /api/v1/users/me`  *(auth)*
```json
{ "id": "newbie", "display_name": "newbie", "role": "client",
  "is_expert": true, "is_verified_expert": false,
  "expert_id": "8e1c…", "expert_status": "pending", "created_at": "…" }
```
- `is_expert` — есть ли профиль эксперта (даже не одобренный);
- `is_verified_expert` — может ли принимать сделки;
- `expert_status` — `pending | approved | rejected | null`;
- `role` становится `"expert"` после одобрения.

### `POST /api/v1/users/me/become-expert`  *(auth)*
Создаёт **заявку** (`pending`) на статус эксперта.
```json
{ "name": "Нурлан Жумабеков", "category": "lawyer",
  "specializations": ["Договоры"], "experience_years": 14, "hourly_rate": 35000,
  "bio": "…", "response_time": "~40 минут", "avatar": "https://…",
  "documents": ["/files/<id>_passport.pdf", "/files/<id>_diploma.pdf"] }
```
Обязательны только `name` (≥2 символов) и `category` (иначе `404`). `documents` —
массив URL-ов файлов, заранее загруженных через `POST /uploads` (паспорт, диплом,
лицензия и т.п.). → `201` заявка `is_verified:false`, `verification_status:"pending"`.
Повторная заявка → `409`. Профиль **не** виден в публичном `GET /experts` и **не**
даёт доступ к сделкам до одобрения.

### `POST /api/v1/users/me/expert-documents`  *(auth)*
Догрузить документы к существующей заявке (например после отклонения). Возвращает
заявку в статус `pending`.
```json
{ "documents": ["/files/<id>_license.pdf"] }
```

### Админские эндпоинты *(только роль `admin`)*

- `GET /api/v1/admin/expert-applications?status=pending` — список заявок с документами
  (`status` ∈ `pending|approved|rejected`, пусто = все). → массив заявок:
  ```json
  { "id": "8e1c…", "user_id": "newbie", "name": "…", "category": "lawyer",
    "category_label": "Юрист", "verification_status": "pending",
    "verification_note": null, "documents": ["/files/…"], "specializations": ["…"],
    "experience_years": 14, "hourly_rate": 35000, "bio": "…", "is_verified": false }
  ```
- `POST /api/v1/admin/experts/{id}/approve` — одобрить: `is_verified=true`,
  `status="approved"`, роль пользователя → `expert`.
- `POST /api/v1/admin/experts/{id}/reject` — отклонить: `{ "reason": "…" }` (опц.),
  `status="rejected"`, остаётся без доступа к сделкам.

Не-админ на любом `/admin/*` или approve/reject получает `403`. Админ определяется
ролью в БД (сид `admin@halyk.kz`) либо списком `ADMIN_USER_IDS` (env-override).

> **Важно для фронта:** перед показом экспертного UI проверяйте `GET /users/me` →
> `is_verified_expert`. Сидовые эксперты (`exp-1 … exp-6`) уже одобрены.
> Админ-панель верификации работает поверх `/admin/expert-applications` + approve/reject.

---

## 3. Модели ответов

### 3.1. `Deal` (полная строка сделки)

Возвращается всеми эндпоинтами сделок и в WebSocket-событиях `deal.*`.

```jsonc
{
  "id": "5f3c…",               // UUID, использовать в операциях claim/offer/...
  "room_code": "A1B2C3",        // 6 символов [A-Z0-9], для ссылки/комнаты
  "client_id": "client-demo",   // user_id клиента (auth)
  "expert_user_id": "exp-5",    // user_id эксперта или null
  "client_name": "Клиент",
  "expert_name": "Нурлан Жумабеков", // или null
  "description": "Текст задачи", // или null
  "status": "offered",          // см. §4
  "offer_price": 50000,          // или null
  "offer_deadline": "3 дня",     // строка-метка или null
  "offer_comment": "…",          // или null
  "escrow_amount": 50000,        // 0 пока нет оффера
  "commission": 2500,            // round(offer_price * commission_pct / 100)
  "commission_pct": 5,
  "created_at": "2026-05-31T08:30:00+00:00",
  "completed_at": null
}
```

`offer_deadline` — метка, не дата. Значения с UI: `'1 день'`, `'3 дня'`, `'1 неделя'`,
`'2 недели'`, `'1 месяц'`, `'По договору'`.

### 3.2. `Message`

```jsonc
{
  "id": "…",
  "deal_id": "…",
  "sender_role": "client",   // 'client' | 'expert'
  "sender_name": "Клиент",
  "content": "Когда начнём?",
  "created_at": "2026-05-31T08:31:00+00:00"
}
```

### 3.3. Справочники (`Category`, `Problem`, `Expert`)

```jsonc
// Category
{ "id": "lawyer", "label": "Юристы", "icon": "scale",
  "color": "#24A148", "borderColor": "#A7F0BA", "description": "…" }

// Problem
{ "id": "tax-1", "category": "tax", "title": "Налоговая отчётность ИП",
  "description": "…", "icon": "chart", "ai_can_answer": true, "ai_answer": "…|null" }

// Expert
{ "id": "exp-5", "name": "Нурлан Жумабеков", "category": "lawyer",
  "categoryLabel": "Юрист", "specializations": ["…"], "experience_years": 14,
  "hourly_rate": 35000, "rating": 4.85, "completed_deals": 120, "bio": "…",
  "avatar": "https://…", "is_verified": true, "response_time": "~40 минут",
  "cases": ["…"], "reviews": [{ "author": "…", "rating": 5, "text": "…" }] }
```

---

## 4. Конечный автомат `deal.status`

```
pending ──claim──► claimed ──offer──► offered ──accept──► active ──complete──► completed
   │                                     │
   └────────── offer (напрямую) ─────────┘
                                         └──decline──► cancelled
```

| Переход | Эндпоинт | Кто | Условие |
|---|---|---|---|
| `pending → claimed` | `POST /deals/{id}/claim` | эксперт (верифиц.) | атомарно; занято → `409` |
| `pending|claimed → offered` | `POST /deals/{id}/offer` | эксперт (верифиц.) | считает `commission`, `escrow_amount` |
| `offered → active` | `POST /deals/{id}/accept` | клиент | фиксирует эскроу |
| `offered → cancelled` | `POST /deals/{id}/decline` | клиент | |
| `active → completed` | `POST /deals/{id}/complete` | клиент | ставит `completed_at`, выплата |
| (после completed) | `POST /deals/{id}/review` | клиент | отзыв + пересчёт рейтинга |

Чат (сообщения) доступен только в статусах `active` и `completed` — иначе `POST
/messages` вернёт `409`. `claim`/`offer` доступны только **верифицированному**
эксперту (см. §2a), иначе `403`.

---

## 5. Сделки

### 5.1. Создать — `POST /api/v1/deals`  *(auth)*

**Request** (все поля опциональны; `room_code` сгенерируется на бэке, если не передан):
```json
{ "description": "Текст задачи", "client_name": "Клиент", "room_code": "A1B2C3" }
```
**Response `201`** — полная строка `Deal`, `status="pending"`. Возьмите `room_code`
для редиректа, `id` — для последующих операций.

### 5.2. Получить по `room_code` — `GET /api/v1/deals/{room_code}`  *(auth)*
→ `Deal` или `404`.

### 5.3. Список для дашборда эксперта — `GET /api/v1/deals`  *(auth)*

Query: `?status=pending,claimed,offered,active&order=created_at.desc`
(`order` ∈ `created_at.desc | created_at.asc`).
→ массив `Deal`. Деление на «новые/активные» — на фронте (как и раньше).

### 5.4. Эксперт откликается — `POST /api/v1/deals/{id}/claim`  *(auth, верифиц. эксперт)*
```json
{ "expert_name": "Нурлан Жумабеков" }
```
→ `Deal` (`status="claimed"`). Сделку уже забрали — `409`. Свою сделку забрать
нельзя — `403`. Не верифицированный эксперт — `403`.

### 5.5. Эксперт отправляет оффер — `POST /api/v1/deals/{id}/offer`  *(auth, верифиц. эксперт)*
```json
{ "expert_name": "Нурлан Жумабеков", "offer_price": 50000,
  "offer_deadline": "3 дня", "offer_comment": "…", "commission_pct": 5 }
```
Бэкенд считает `commission = round(offer_price*commission_pct/100)`,
`escrow_amount = offer_price`, ставит `status="offered"`. → `Deal`.

### 5.6. Клиент принимает / отклоняет
- `POST /api/v1/deals/{id}/accept` *(auth, клиент)* → `status="active"`, фиксируется
  эскроу. (Никакой искусственной задержки на бэке нет — анимацию оплаты держите на фронте.)
- `POST /api/v1/deals/{id}/decline` *(auth, клиент)* → `status="cancelled"`.

### 5.7. Завершить — `POST /api/v1/deals/{id}/complete`  *(auth, клиент)*
→ `status="completed"`, `completed_at`, регистрируется выплата
(`payout = escrow_amount − commission`). → `Deal`.

### 5.8. Отзыв — `POST /api/v1/deals/{id}/review`  *(auth, клиент)*
Только после `completed`.
```json
{ "rating": 5, "comment": "Отлично" }
```
→ `Deal`. Рейтинг эксперта пересчитывается; профиль `GET /experts/{id}` это отразит.

---

## 6. Сообщения

- **Список** — `GET /api/v1/deals/{deal_id}/messages` *(auth)* → массив `Message`,
  отсортирован по `created_at ASC`.
- **Отправка** — `POST /api/v1/deals/{deal_id}/messages` *(auth)*
  ```json
  { "sender_role": "client", "sender_name": "Клиент", "content": "Когда начнём?" }
  ```
  → `201` `Message`. Доступно только при `status ∈ {active, completed}`.
- **Сдача работы** экспертом — это просто сообщение `sender_role:"expert"` с текстом
  отчёта (имена файлов — в тексте или через `/uploads`). Отдельного эндпоинта нет.

---

## 7. Realtime (WebSocket)

Замена Supabase Realtime. Клиент **только получает** события (входящие фреймы
игнорируются и нужны лишь чтобы держать соединение).

| Канал | URL | События |
|---|---|---|
| Комната сделки | `WS /api/v1/ws/deals/{room_code}` | `deal.updated`, `message.created` |
| Дашборд эксперта | `WS /api/v1/ws/expert/deals` | `deal.created`, `deal.updated` |

Формат события — полная строка в `data`:
```jsonc
{ "type": "deal.updated",    "data": { /* полный Deal */ } }
{ "type": "message.created", "data": { /* полный Message */ } }
{ "type": "deal.created",    "data": { /* полный Deal */ } }
```

Пример:
```ts
const ws = new WebSocket(`${WS_BASE}/api/v1/ws/deals/${roomCode}`);
ws.onmessage = (e) => {
  const { type, data } = JSON.parse(e.data);
  if (type === "deal.updated") setDeal(data);
  if (type === "message.created") appendMessage(data); // дедуп по data.id
};
```

`WS_BASE` — это `ws://`/`wss://` вместо `http(s)://`. Дедуп сообщений по `id`
оставляйте на фронте (бэк дубли без необходимости не шлёт).

---

## 8. AI-эндпоинты

Контракт совместим с прежними роутами Next.js. При наличии `OPENAI_API_KEY` бэк
использует `gpt-4o-mini`; иначе — детерминированный ответ (без сети).

### 8.1. `POST /api/v1/ai/consult`  *(auth)*
```json
{ "messages": [ { "role": "user", "content": "…" } ],
  "category": "tax", "problemId": "tax-1" }
```
`role ∈ {user, assistant}`. `problemId` опционален (для «custom» не передаётся).

**Response `200` (строго эти поля):**
```json
{ "message": "текст (markdown)", "suggest_expert": true }
```
Особое поведение: если `messages.length === 1` **и** у задачи есть готовый
`ai_answer` (`ai_can_answer:true`) — бэк сразу вернёт заготовку + дисклеймер, без LLM.

### 8.2. `POST /api/v1/ai/match`  *(auth)*
```json
{ "category": "lawyer", "problemDescription": "…", "allCategories": false }
```
**Response:**
```json
{ "ranked": [ { "id": "exp-5", "score": 92, "reason": "…ссылка на кейс…" } ] }
```
При `allCategories:true` ранжируются эксперты всех категорий.

---

## 9. Справочники

- `GET /api/v1/categories` → массив `Category`
- `GET /api/v1/categories/{category_id}/problems` → массив `Problem`
- `GET /api/v1/problems?category=tax` → массив `Problem`
- `GET /api/v1/experts?category=lawyer` → массив `Expert` (только верифицированные,
  по убыванию рейтинга)
- `GET /api/v1/experts/{id}` → `Expert` или `404`

Все справочники публичные (без токена).

---

## 10. Загрузка файлов

### `POST /api/v1/uploads`  *(auth, multipart/form-data)*
Поля формы: `file` (обязательно), `deal_id` (опц.), `message_id` (опц.).

**Response `201`:**
```json
{ "id": "…", "deal_id": "…|null", "message_id": "…|null",
  "filename": "report.pdf", "content_type": "application/pdf", "size": 12345,
  "url": "/files/<id>_report.pdf", "created_at": "…" }
```
Файл доступен по `GET {API}/files/<stored_name>` (статическая раздача). Лимит размера —
`MAX_UPLOAD_BYTES` (по умолчанию 10 МБ), иначе `422`.

---

## 11. Коды ошибок

| Код | Когда |
|---|---|
| `401` | нет/невалидный токен; неверный пароль при логине пользователя с паролем (админ) |
| `403` | действие не для этой роли (не клиент завершает сделку; claim своей сделки; **не верифицированный эксперт**; не админ верифицирует) |
| `404` | сделка/эксперт/категория не найдены |
| `409` | конфликт состояния (сделку уже забрали; неверный переход статуса; чат вне `active/completed`; повторная заявка в эксперты) |
| `422` | ошибка валидации тела запроса |

Тело ошибки всегда: `{ "detail": "<человекочитаемый текст>" }`.

---

## 12. Миграция фронта с Supabase → REST

Замените прямые вызовы `supabase.from(...)` на запросы к API. Соответствие:

| Было (Supabase, FRONTEND.md) | Стало (REST) |
|---|---|
| `insert({room_code, description, client_name, status:'pending'})` | `POST /api/v1/deals` |
| `select('*').eq('room_code', code).single()` | `GET /api/v1/deals/{room_code}` |
| `select('*').in('status',[…]).order('created_at',desc)` | `GET /api/v1/deals?status=…&order=created_at.desc` |
| `update({status:'claimed', expert_name}).eq('id',id).eq('status','pending')` | `POST /api/v1/deals/{id}/claim` |
| `update({status:'offered', offer_*, commission, escrow_amount})` | `POST /api/v1/deals/{id}/offer` |
| `update({status:'active'})` | `POST /api/v1/deals/{id}/accept` |
| `update({status:'cancelled'})` | `POST /api/v1/deals/{id}/decline` |
| `update({status:'completed', completed_at})` | `POST /api/v1/deals/{id}/complete` |
| (отзыв, ранее не сохранялся) | `POST /api/v1/deals/{id}/review` |
| `select('*').eq('deal_id',id).order('created_at',asc)` | `GET /api/v1/deals/{id}/messages` |
| `insert({deal_id, sender_role, sender_name, content})` | `POST /api/v1/deals/{id}/messages` |
| `supabase.channel(...)` на `deals` по `room_code` | `WS /api/v1/ws/deals/{room_code}` |
| `supabase.channel(...)` на `messages` по `deal_id` | то же (`message.created` в канале сделки) |
| `supabase.channel(...)` на `deals` (дашборд) | `WS /api/v1/ws/expert/deals` |
| роуты `app/api/ai/*` | `POST /api/v1/ai/consult`, `POST /api/v1/ai/match` |
| (нет) авторизация/профиль | `POST /api/v1/auth/token`, `GET /api/v1/users/me`, `become-expert` |

### Что изменится в коде фронта

1. **`lib/supabase.ts`** → тонкий API-клиент (fetch к `NEXT_PUBLIC_API_URL` + Bearer-токен).
2. **Получение токена** один раз при входе (`POST /auth/token`), хранение и подстановка
   в `Authorization` для всех мутаций. `client_name`/`expert_name`/`sender_name`
   по-прежнему передаются в теле — менять модель данных не нужно.
3. **Роль/верификация:** при входе дёрните `GET /users/me`; показывайте экспертный UI
   только при `is_verified_expert:true`. Онбординг эксперта — `become-expert` (§2a).
4. **Операции claim/offer/accept/decline/complete/review/messages** используют
   `deal.id` (UUID из ответа создания), а **получение** — `room_code`.
5. **Realtime** — заменить `supabase.channel` на нативный `WebSocket` (§7), семантика
   та же: в payload полная строка, дедуп по `id`.
6. **AI** — фронт ходит прямо на `/api/v1/ai/*` (контракт §8 не меняется).
7. **Файлы/эскроу/отзывы** — новые эндпоинты §10/§5.7/§5.8.

---

## 13. Песочница

- Swagger UI: `/docs` (кнопка **Authorize** → введите `user_id` как username).
- OpenAPI JSON: `/openapi.json`.
- Health: `/api/v1/health`.
- Сидовые логины экспертов (уже одобрены): `exp-1 … exp-6` (`exp-5` — юрист,
  `exp-2`/`exp-3` — налоговые, `exp-1` — бухгалтер, `exp-4` — юрист, `exp-6` — адвокат).
- **Админ (сид):** `username=admin@halyk.kz`, `password=pass123123`. Войдите им, чтобы
  смотреть `/admin/expert-applications` и одобрять/отклонять заявки.
- Дополнительно можно назначить админов через `ADMIN_USER_IDS` (CSV в env).
