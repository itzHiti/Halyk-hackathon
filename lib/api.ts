// Клиент FastAPI-бэкенда Halyk Pro. Заменяет прямые обращения к Supabase.
// Контракт: см. BACKEND.md. Все мутации требуют Bearer-токен (§2).

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API = `${API_BASE}/api/v1`;
const WS_BASE = API_BASE.replace(/^http/, 'ws');

// ─── Типы ответов (BACKEND.md §3) ────────────────────────────────────────────

export type DealStatus = 'pending' | 'claimed' | 'offered' | 'active' | 'completed' | 'cancelled';

export interface Deal {
  id: string;
  room_code: string;
  client_id?: string | null;
  expert_user_id?: string | null;
  client_name: string;
  expert_name: string | null;
  description: string | null;
  status: DealStatus;
  offer_price: number | null;
  offer_deadline: string | null;
  offer_comment: string | null;
  escrow_amount: number;
  commission: number;
  commission_pct: number;
  created_at: string;
  completed_at: string | null;
}

export interface Message {
  id: string;
  deal_id: string;
  sender_role: 'client' | 'expert';
  sender_name: string;
  content: string;
  created_at: string;
}

export interface ConsultResult {
  message: string;
  suggest_expert: boolean;
}

export interface MatchResult {
  ranked: { id: string; score: number; reason: string }[];
}

// Справочники (BACKEND.md §3.3 / §9)
export interface ApiCategory {
  id: string;
  label: string;
  icon: string;        // на бэке — имя иконки/строка (например "scale")
  color: string;       // на бэке — hex (#24A148)
  borderColor: string;
  description: string;
}

export interface ApiProblem {
  id: string;
  category: string;
  title: string;
  description: string;
  icon: string;
  ai_can_answer: boolean;
  ai_answer?: string | null;
}

// ─── Ошибки ──────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(public status: number, public detail: string) {
    super(detail);
    this.name = 'ApiError';
  }
}

/** Единый разбор тела ошибки `{ detail }` → ApiError (бэкенд всегда отдаёт этот формат). */
async function toApiError(res: Response): Promise<ApiError> {
  let detail = res.statusText;
  try {
    const data = await res.json();
    if (data?.detail) detail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
  } catch { /* тело не JSON */ }
  return new ApiError(res.status, detail);
}

/** access_token из ответа auth-эндпоинтов (token/register). */
async function readAccessToken(res: Response): Promise<string> {
  const { access_token } = await res.json();
  if (!access_token) throw new ApiError(500, 'Сервер не вернул токен');
  return access_token;
}

// ─── Авторизация (Bearer JWT, BACKEND.md §2) ─────────────────────────────────
// Токен получаем по user_id через POST /auth/token и кешируем (память + localStorage).
// Best-effort: если бэк работает с AUTH_REQUIRED=false, продолжаем без токена.

const tokenCache = new Map<string, string>();
const TOKEN_KEY = (uid: string) => `halykpro_token_${uid}`;

/** POST /auth/token (form-urlencoded). Возвращает access_token. Бросает ApiError при 401/прочих. */
async function requestToken(userId: string, password: string): Promise<string> {
  const res = await fetch(`${API}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: userId, password }),
  });
  if (!res.ok) throw await toApiError(res);
  return readAccessToken(res);
}

/** Срок жизни (exp) из JWT, либо null если не удалось прочитать. */
function jwtExp(token: string): number | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const json = typeof atob !== 'undefined' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
    const payload = JSON.parse(json);
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

/** Токен протух (с буфером 30с). Если exp прочитать не удалось — не считаем протухшим (решит сервер → 401-ретрай). */
function isExpired(token: string): boolean {
  const exp = jwtExp(token);
  if (exp === null) return false;
  return Date.now() / 1000 >= exp - 30;
}

/** Сбросить закешированный токен (память + localStorage). */
function clearToken(userId: string) {
  tokenCache.delete(userId);
  if (typeof window !== 'undefined') window.localStorage.removeItem(TOKEN_KEY(userId));
}

// Возвращает только уже выданный (при login/register) валидный токен.
// Заводить токен «на лету» больше нельзя: бэкенд требует пароль (passwordless убран).
// Нет валидного токена → null (вызов уйдёт без авторизации и получит 401 → нужен вход).
async function getToken(userId: string): Promise<string | null> {
  const cached = tokenCache.get(userId);
  if (cached && !isExpired(cached)) return cached;

  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(TOKEN_KEY(userId));
    if (stored && !isExpired(stored)) {
      tokenCache.set(userId, stored);
      return stored;
    }
    if (stored) window.localStorage.removeItem(TOKEN_KEY(userId)); // протух — выкидываем
  }
  return null;
}

// ─── Сессия / вход (выбор пользователя) ──────────────────────────────────────
// user_id текущей сессии хранится в localStorage. Позволяет входить под разными
// пользователями (экран входа на /halyk-pro) и тестировать клиента/экспертов.

const SESSION_KEY = 'halykpro_uid';
const DEFAULT_USER_ID = 'client-demo';

export function getSessionUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(SESSION_KEY);
}

/** user_id для API-вызовов: текущая сессия или демо-дефолт. */
export function currentUserId(): string {
  return getSessionUserId() || DEFAULT_USER_ID;
}

function storeSession(id: string, token: string) {
  tokenCache.set(id, token);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(TOKEN_KEY(id), token);
    window.localStorage.setItem(SESSION_KEY, id);
  }
}

/** Вход: POST /auth/token со строгой проверкой пароля. Бросает ApiError(401) при неверных кредах. */
export async function login(userId: string, password: string): Promise<User> {
  const id = userId.trim();
  clearToken(id);
  const token = await requestToken(id, password);
  storeSession(id, token);
  return getCurrentUser(id);
}

/** Регистрация нового пользователя (роль client). POST /auth/register → токен. 409 если занято. */
export async function register(username: string, password: string, displayName?: string): Promise<User> {
  const id = username.trim();
  const res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: id, password, display_name: displayName?.trim() || undefined }),
  });
  if (!res.ok) throw await toApiError(res);
  storeSession(id, await readAccessToken(res));
  return getCurrentUser(id);
}

/** Удобный демо-вход: войти, а если пользователя ещё нет (401) — зарегистрировать. */
export async function loginOrRegister(userId: string, password: string, displayName?: string): Promise<User> {
  try {
    return await login(userId, password);
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return register(userId, password, displayName);
    throw e;
  }
}

/** Есть ли валидный (не протухший) токен у пользователя текущей сессии. */
export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  const uid = window.localStorage.getItem(SESSION_KEY);
  if (!uid) return false;
  const stored = window.localStorage.getItem(TOKEN_KEY(uid));
  return !!(stored && !isExpired(stored));
}

export function logout() {
  if (typeof window === 'undefined') return;
  const uid = window.localStorage.getItem(SESSION_KEY);
  window.localStorage.removeItem(SESSION_KEY);
  if (uid) {
    tokenCache.delete(uid);
    window.localStorage.removeItem(TOKEN_KEY(uid));
  }
}

// ─── Память о сделках пользователя (для общего профиля) ──────────────────────
// Бэкенд не отдаёт «мои сделки» для клиента, поэтому room_code сделок, в которых
// пользователь участвовал (создал / откликнулся / открыл), запоминаем локально и
// затем подтягиваем реальные данные через getDeal — чтобы и клиент, и эксперт могли
// вернуться к своему диалогу из профиля.

const DEALS_KEY = (uid: string) => `halykpro_deals_${uid}`;

/** Запомнить room_code сделки для пользователя (без дублей, последние сверху). */
export function rememberDeal(userId: string, roomCode: string) {
  if (typeof window === 'undefined' || !roomCode) return;
  try {
    const key = DEALS_KEY(userId);
    const list: string[] = JSON.parse(window.localStorage.getItem(key) || '[]');
    const next = [roomCode, ...list.filter(c => c !== roomCode)].slice(0, 50);
    window.localStorage.setItem(key, JSON.stringify(next));
  } catch { /* localStorage недоступен */ }
}

/** room_code сделок пользователя (последние сверху). */
export function getRememberedDeals(userId: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(DEALS_KEY(userId)) || '[]');
  } catch {
    return [];
  }
}

// ─── Базовый запрос ──────────────────────────────────────────────────────────

interface RequestOpts {
  method?: string;
  body?: unknown;
  userId?: string; // если задан — пытаемся приложить Bearer-токен
}

async function request<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';

  if (opts.userId) {
    const token = await getToken(opts.userId);
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API}${path}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  // Токен протух / подпись не сошлась (перезапуск бэка) → сбрасываем; нужен повторный вход.
  if (res.status === 401 && opts.userId) clearToken(opts.userId);

  if (!res.ok) throw await toApiError(res);

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Сделки (BACKEND.md §5) ──────────────────────────────────────────────────

export function createDeal(
  data: { description?: string; client_name?: string; room_code?: string },
  userId: string,
): Promise<Deal> {
  return request<Deal>('/deals', { method: 'POST', body: data, userId });
}

/** Получить сделку по room_code. Возвращает null при 404. */
export async function getDeal(roomCode: string, userId: string): Promise<Deal | null> {
  try {
    return await request<Deal>(`/deals/${roomCode}`, { userId });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export function listDeals(
  params: { status: DealStatus[]; order?: 'created_at.desc' | 'created_at.asc' },
  userId: string,
): Promise<Deal[]> {
  const qs = new URLSearchParams({
    status: params.status.join(','),
    order: params.order || 'created_at.desc',
  });
  return request<Deal[]>(`/deals?${qs}`, { userId });
}

export function claimDeal(id: string, expertName: string, userId: string): Promise<Deal> {
  return request<Deal>(`/deals/${id}/claim`, { method: 'POST', body: { expert_name: expertName }, userId });
}

export function offerDeal(
  id: string,
  offer: { expert_name: string; offer_price: number; offer_deadline: string; offer_comment?: string; commission_pct?: number },
  userId: string,
): Promise<Deal> {
  return request<Deal>(`/deals/${id}/offer`, { method: 'POST', body: offer, userId });
}

export function acceptDeal(id: string, userId: string): Promise<Deal> {
  return request<Deal>(`/deals/${id}/accept`, { method: 'POST', body: {}, userId });
}

export function declineDeal(id: string, userId: string): Promise<Deal> {
  return request<Deal>(`/deals/${id}/decline`, { method: 'POST', body: {}, userId });
}

export function completeDeal(id: string, userId: string): Promise<Deal> {
  return request<Deal>(`/deals/${id}/complete`, { method: 'POST', body: {}, userId });
}

export function reviewDeal(id: string, review: { rating: number; comment?: string }, userId: string): Promise<Deal> {
  return request<Deal>(`/deals/${id}/review`, { method: 'POST', body: review, userId });
}

// ─── Сообщения (BACKEND.md §6) ───────────────────────────────────────────────

export function getMessages(dealId: string, userId: string): Promise<Message[]> {
  return request<Message[]>(`/deals/${dealId}/messages`, { userId });
}

export function sendMessage(
  dealId: string,
  msg: { sender_role: 'client' | 'expert'; sender_name: string; content: string },
  userId: string,
): Promise<Message> {
  return request<Message>(`/deals/${dealId}/messages`, { method: 'POST', body: msg, userId });
}

// ─── AI (BACKEND.md §8) ──────────────────────────────────────────────────────

export function aiConsult(
  body: { messages: { role: 'user' | 'assistant'; content: string }[]; category: string; problemId?: string },
  userId: string,
): Promise<ConsultResult> {
  return request<ConsultResult>('/ai/consult', { method: 'POST', body, userId });
}

export function aiMatch(
  body: { category: string; problemDescription: string; allCategories: boolean },
  userId: string,
): Promise<MatchResult> {
  return request<MatchResult>('/ai/match', { method: 'POST', body, userId });
}

// ─── Справочники (публичные, BACKEND.md §9) ──────────────────────────────────
// Бросают при недоступности бэка — вызывающий код делает фолбэк на статические моки.

export function listCategories(): Promise<ApiCategory[]> {
  return request<ApiCategory[]>('/categories');
}

export function listProblems(category: string): Promise<ApiProblem[]> {
  return request<ApiProblem[]>(`/problems?category=${encodeURIComponent(category)}`);
}

/** Список верифицированных экспертов (по убыванию рейтинга). category — фильтр. */
export function listExperts(category?: string): Promise<ApiExpert[]> {
  const qs = category ? `?category=${encodeURIComponent(category)}` : '';
  return request<ApiExpert[]>(`/experts${qs}`);
}

// ─── Идентичность пользователя (модель User, BACKEND.md §2a) ──────────────────

export type UserRole = 'client' | 'expert' | 'admin';
export type ExpertStatus = 'pending' | 'approved' | 'rejected' | null;

// GET /users/me
export interface User {
  id: string;
  display_name: string;
  role: UserRole;
  is_expert: boolean;            // есть профиль эксперта (даже не одобренный)
  is_verified_expert: boolean;   // может принимать сделки
  expert_id: string | null;
  expert_status: ExpertStatus;   // pending | approved | rejected | null
  created_at: string;
}

// Публичная карточка эксперта — GET /experts/{id} (BACKEND.md §3.3)
export interface ApiExpert {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  specializations: string[];
  experience_years: number;
  hourly_rate: number;
  rating: number;
  completed_deals: number;
  bio: string;
  avatar: string;
  is_verified: boolean;
  response_time: string;
  cases: string[];
  reviews: { author: string; rating: number; text: string }[];
}

export interface Upload {
  id: string;
  deal_id: string | null;
  message_id: string | null;
  filename: string;
  content_type: string;
  size: number;
  url: string;
  created_at: string;
}

// Фолбэк, когда /users/me недоступен или нет валидного токена (нужен вход).
// Fail-closed: никаких экспертных/админских прав — верификацию подтверждает только
// реальный /users/me (раньше тут «сидовые эксперты» считались верифицированными,
// но passwordless-вход убран, поэтому это больше небезопасно и неверно).
function fallbackUser(userId: string): User {
  return {
    id: userId,
    display_name: userId,
    role: 'client',
    is_expert: false,
    is_verified_expert: false,
    expert_id: null,
    expert_status: null,
    created_at: '',
  };
}

/** Текущий пользователь (GET /users/me). Без валидного токена / при недоступности бэка — фолбэк. */
export async function getCurrentUser(userId: string): Promise<User> {
  try {
    return await request<User>('/users/me', { userId });
  } catch {
    return fallbackUser(userId);
  }
}

// ─── Публичный профиль эксперта (GET /experts/{id}) ──────────────────────────

export async function getExpert(expertId: string): Promise<ApiExpert | null> {
  try {
    return await request<ApiExpert>(`/experts/${expertId}`); // публичный, без токена
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

/** Профиль текущего эксперта: /users/me → expert_id → /experts/{id}. */
export async function getMyExpert(userId: string): Promise<ApiExpert | null> {
  const me = await getCurrentUser(userId);
  if (!me.expert_id) return null;
  return getExpert(me.expert_id);
}

// ─── Верификация эксперта (BACKEND.md §2a) ───────────────────────────────────

export interface BecomeExpertPayload {
  name: string;
  category: string;
  specializations?: string[];
  experience_years?: number;
  hourly_rate?: number;
  bio?: string;
  response_time?: string;
  avatar?: string;
  documents?: string[]; // URL-ы файлов из POST /uploads (поле url)
}

/** Подать заявку на статус эксперта (→ pending). Повторная заявка → 409. */
export function becomeExpert(userId: string, payload: BecomeExpertPayload): Promise<unknown> {
  return request('/users/me/become-expert', { method: 'POST', body: payload, userId });
}

/** Догрузить документы к заявке (например после отклонения) → снова pending. */
export function addExpertDocuments(userId: string, documents: string[]): Promise<unknown> {
  return request('/users/me/expert-documents', { method: 'POST', body: { documents }, userId });
}

// ─── Загрузка файлов (multipart, BACKEND.md §10) ─────────────────────────────

export async function uploadFile(
  userId: string,
  file: File,
  opts: { deal_id?: string; message_id?: string } = {},
): Promise<Upload> {
  const headers: Record<string, string> = {};
  const token = await getToken(userId);
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const fd = new FormData(); // Content-Type выставит браузер (boundary)
  fd.append('file', file);
  if (opts.deal_id) fd.append('deal_id', opts.deal_id);
  if (opts.message_id) fd.append('message_id', opts.message_id);

  const res = await fetch(`${API}/uploads`, { method: 'POST', headers, body: fd });
  if (res.status === 401) clearToken(userId); // токен протух — нужен повторный вход

  if (!res.ok) throw await toApiError(res);
  return res.json() as Promise<Upload>;
}

/** Абсолютный URL файла из /uploads (поле url вида "/files/..."). */
export function fileUrl(path: string): string {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

// ─── Админ: верификация экспертов (BACKEND.md §2a, только роль admin) ─────────

export interface ExpertApplication {
  id: string;
  user_id: string;
  name: string;
  category: string;
  category_label: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  verification_note: string | null;
  documents: string[];
  specializations: string[];
  experience_years: number;
  hourly_rate: number;
  bio: string;
  is_verified: boolean;
}

/** GET /admin/expert-applications?status= — список заявок (пусто = все). Требует роль admin. */
export function listExpertApplications(
  userId: string,
  status?: 'pending' | 'approved' | 'rejected',
): Promise<ExpertApplication[]> {
  const qs = status ? `?status=${status}` : '';
  return request<ExpertApplication[]>(`/admin/expert-applications${qs}`, { userId });
}

/** Одобрить заявку: is_verified=true, статус approved, роль пользователя → expert. */
export function approveExpert(userId: string, applicationId: string): Promise<unknown> {
  return request(`/admin/experts/${applicationId}/approve`, { method: 'POST', body: {}, userId });
}

/** Отклонить заявку (опц. причина). */
export function rejectExpert(userId: string, applicationId: string, reason?: string): Promise<unknown> {
  return request(`/admin/experts/${applicationId}/reject`, { method: 'POST', body: reason ? { reason } : {}, userId });
}

// ─── Realtime (WebSocket, BACKEND.md §7) ─────────────────────────────────────

type DealChannelEvent =
  | { type: 'deal.updated'; data: Deal }
  | { type: 'message.created'; data: Message };

type ExpertChannelEvent =
  | { type: 'deal.created'; data: Deal }
  | { type: 'deal.updated'; data: Deal };

function openChannel<E>(url: string, onEvent: (ev: E) => void): WebSocket {
  const ws = new WebSocket(url);
  ws.onmessage = (e) => {
    try {
      onEvent(JSON.parse(e.data) as E);
    } catch { /* игнорируем некорректные фреймы */ }
  };
  return ws;
}

/** Канал комнаты сделки: события deal.updated и message.created. */
export function openDealChannel(roomCode: string, onEvent: (ev: DealChannelEvent) => void): WebSocket {
  return openChannel<DealChannelEvent>(`${WS_BASE}/api/v1/ws/deals/${roomCode}`, onEvent);
}

/** Канал дашборда эксперта: события deal.created и deal.updated. */
export function openExpertChannel(onEvent: (ev: ExpertChannelEvent) => void): WebSocket {
  return openChannel<ExpertChannelEvent>(`${WS_BASE}/api/v1/ws/expert/deals`, onEvent);
}
