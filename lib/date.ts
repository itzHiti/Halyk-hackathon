// Утилиты времени.
//
// Бэкенд может отдавать «naive» UTC-метку без указания зоны
// (например '2026-05-31T08:30:00'). JS трактует такую строку как ЛОКАЛЬНОЕ время,
// из-за чего в РК (UTC+5) свежий запрос показывался как «5 часов назад».
// Нормализуем: если в строке есть 'T', но нет признака зоны (Z или ±HH:MM) —
// считаем её UTC и дописываем 'Z'.

export function parseApiDate(ts: string): Date {
  if (!ts) return new Date(NaN);
  const hasTz = /([zZ])$|[+-]\d{2}:?\d{2}$/.test(ts);
  const needsZ = ts.includes('T') && !hasTz;
  return new Date(needsZ ? `${ts}Z` : ts);
}

/** «только что» / «N мин назад» / «N ч назад» / «N дн назад». */
export function timeAgo(ts: string): string {
  const t = parseApiDate(ts).getTime();
  if (Number.isNaN(t)) return '';
  const sec = Math.floor((Date.now() - t) / 1000);
  if (sec < 60) return 'только что';
  if (sec < 3600) return `${Math.floor(sec / 60)} мин назад`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} ч назад`;
  return `${Math.floor(sec / 86400)} дн назад`;
}

/** Время ЧЧ:ММ в локали ru (для сообщений чата). */
export function formatTime(ts: string): string {
  const d = parseApiDate(ts);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
}
