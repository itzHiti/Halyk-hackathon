'use client';
import Link from 'next/link';
import { Shield, Star, CheckCircle, ArrowRight, ChevronLeft, Loader2, LogOut, UserCircle, MessageCircle, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSessionUserId, getCurrentUser, login, register, loginOrRegister, logout, isLoggedIn, User, ApiError } from '@/lib/api';
import { LoadingScreen } from '@/components/ui/StatusScreen';

// Быстрый вход для тестирования (сид-пароли бэка: эксперты expert123, админ pass123123;
// демо-клиент не засеян — заходим через login-или-register). BACKEND.md §2/§13.
const QUICK_USERS: { id: string; label: string; hint: string; pw: string; reg?: boolean }[] = [
  { id: 'client-demo', label: 'Клиент', hint: 'демо-клиент', pw: 'demo1234', reg: true },
  { id: 'exp-5', label: 'Юрист', hint: 'exp-5 · эксперт', pw: 'expert123' },
  { id: 'exp-1', label: 'Бухгалтер', hint: 'exp-1 · эксперт', pw: 'expert123' },
  { id: 'admin@halyk.kz', label: 'Админ', hint: 'проверка экспертов', pw: 'pass123123' },
];

export default function HalykProPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [uidInput, setUidInput] = useState('');
  const [pwInput, setPwInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState('');
  const [checkingExpert, setCheckingExpert] = useState(false);

  // Проверяем сессию при входе на Halyk Pro: нужен валидный токен (иначе — разлогин).
  useEffect(() => {
    const uid = getSessionUserId();
    if (!uid || !isLoggedIn()) { if (uid) logout(); setChecking(false); return; }
    getCurrentUser(uid).then(u => { setUser(u); setChecking(false); });
  }, []);

  const friendlyError = (e: unknown, action: 'login' | 'register'): string => {
    if (e instanceof ApiError) {
      if (e.status === 401) return 'Неверный логин или пароль.';
      if (e.status === 409) return 'Такой пользователь уже существует — войдите.';
      if (e.status === 422) return 'Проверьте поля: пароль не короче 4 символов.';
      return e.detail || 'Ошибка сервера.';
    }
    return `Не удалось ${action === 'login' ? 'войти' : 'зарегистрироваться'}. Проверьте доступность сервера.`;
  };

  const submitAuth = async () => {
    const id = uidInput.trim();
    if (!id || !pwInput || loggingIn) return;
    setLoggingIn(true);
    setError('');
    try {
      const u = mode === 'register'
        ? await register(id, pwInput, nameInput)
        : await login(id, pwInput);
      setUser(u);
    } catch (e) {
      setError(friendlyError(e, mode));
    } finally {
      setLoggingIn(false);
    }
  };

  const quickLogin = async (q: typeof QUICK_USERS[number]) => {
    setLoggingIn(true);
    setError('');
    try {
      const u = q.reg ? await loginOrRegister(q.id, q.pw, q.label) : await login(q.id, q.pw);
      setUser(u);
    } catch (e) {
      setError(friendlyError(e, 'login'));
    } finally {
      setLoggingIn(false);
    }
  };

  const doLogout = () => {
    logout();
    setUser(null);
    setUidInput('');
    setPwInput('');
    setNameInput('');
  };

  const goExpert = async () => {
    if (!user) return;
    setCheckingExpert(true);
    // На случай, если статус изменился (верификация подтверждена) — перечитываем
    const me = await getCurrentUser(user.id);
    router.push(me.is_verified_expert ? '/expert/dashboard' : '/expert/verify');
  };

  // ── Проверка сессии ──────────────────────────────────────────────────────────
  if (checking) return <LoadingScreen />;

  // ── Экран входа ────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <div className="bg-halyk px-4 pt-10 pb-8">
          <button onClick={() => router.push('/')}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors mb-4">
            <ChevronLeft size={22} className="text-white" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-3xl">⚖️</span>
            <div>
              <h1 className="text-xl font-bold text-white">Halyk Pro</h1>
              <p className="text-white/80 text-xs">Вход и регистрация по Halyk ID</p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 py-5 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
            {/* Переключатель: вход / регистрация */}
            <div className="flex bg-gray-100 rounded-xl p-1">
              {(['login', 'register'] as const).map(m => (
                <button key={m} onClick={() => { setMode(m); setError(''); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${mode === m ? 'bg-white text-halyk shadow-sm' : 'text-gray-500'}`}>
                  {m === 'login' ? 'Войти' : 'Регистрация'}
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Halyk ID (логин)</label>
              <input value={uidInput} onChange={e => setUidInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitAuth()}
                placeholder="например my-login или exp-5" autoFocus
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-halyk" />
            </div>

            {mode === 'register' && (
              <div>
                <label className="text-xs text-gray-500 block mb-1">Отображаемое имя <span className="text-gray-300">(необязательно)</span></label>
                <input value={nameInput} onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submitAuth()}
                  placeholder="как вас показывать"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-halyk" />
              </div>
            )}

            <div>
              <label className="text-xs text-gray-500 block mb-1">Пароль</label>
              <input type="password" value={pwInput} onChange={e => setPwInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitAuth()}
                placeholder={mode === 'register' ? 'минимум 4 символа' : 'ваш пароль'}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-halyk" />
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button onClick={submitAuth} disabled={!uidInput.trim() || !pwInput || loggingIn}
              className="w-full bg-halyk text-white rounded-2xl py-3.5 flex items-center justify-center gap-2 font-bold text-base shadow-lg shadow-halyk/30 disabled:opacity-50">
              {loggingIn
                ? <><Loader2 size={16} className="animate-spin" />{mode === 'register' ? 'Создаём...' : 'Входим...'}</>
                : (mode === 'register' ? 'Зарегистрироваться' : 'Войти')}
            </button>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-2 px-1">Быстрый вход для теста:</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_USERS.map(u => (
                <button key={u.id} onClick={() => quickLogin(u)} disabled={loggingIn}
                  className="bg-white border border-gray-200 rounded-2xl p-3 text-left active:scale-98 transition-transform disabled:opacity-50">
                  <p className="text-sm font-semibold text-gray-900">{u.label}</p>
                  <p className="text-[10px] text-gray-400">{u.hint}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 pb-8">
          <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
            <Shield size={14} className="text-halyk mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-500 leading-relaxed">
              Вход определяет, под каким пользователем вы работаете. Экспертные функции доступны только верифицированным специалистам.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Выбор роли (после входа) ─────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <div className="bg-halyk px-4 pt-10 pb-8">
        <button onClick={() => router.push('/')}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors mb-4">
          <ChevronLeft size={22} className="text-white" />
        </button>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-3xl">⚖️</span>
          <div>
            <h1 className="text-xl font-bold text-white">Halyk Pro</h1>
            <p className="text-white/80 text-xs">Верифицированные специалисты</p>
          </div>
        </div>
        <p className="text-white/90 text-sm leading-relaxed">
          Юристы, адвокаты, бухгалтеры и налоговые консультанты — проверены Halyk Bank
        </p>
      </div>

      {/* Signed-in bar */}
      <div className="px-4 pt-4">
        <div className="bg-halyk-light rounded-2xl p-3 flex items-center gap-2.5">
          <UserCircle size={20} className="text-halyk flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user.display_name || user.id}</p>
            <p className="text-[10px] text-halyk-dark/70">
              {user.role === 'admin' ? 'Администратор' : user.is_verified_expert ? 'Специалист · верифицирован' : 'Клиент'} · {user.id}
            </p>
          </div>
          <button onClick={doLogout} className="flex items-center gap-1 text-xs text-gray-500 font-medium px-2 py-1 rounded-lg hover:bg-white">
            <LogOut size={13} />Выйти
          </button>
        </div>
      </div>

      {/* Trust badges */}
      <div className="px-4 py-5">
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: <Shield size={18} className="text-halyk" />, label: '100%\nверифицированы', bg: 'bg-halyk-light' },
            { icon: <Star size={18} className="text-yellow-500" />, label: '4.8\nсредний рейтинг', bg: 'bg-yellow-50' },
            { icon: <CheckCircle size={18} className="text-blue-500" />, label: 'Эскроу\nзащита', bg: 'bg-blue-50' },
          ].map(({ icon, label, bg }) => (
            <div key={label} className={`${bg} rounded-2xl p-3 flex flex-col items-center text-center gap-1.5`}>
              {icon}
              <p className="text-[10px] font-medium text-gray-700 whitespace-pre-line leading-tight">{label}</p>
            </div>
          ))}
        </div>

        <h2 className="text-base font-semibold text-gray-800 mb-4">Как вы хотите начать?</h2>

        {/* Admin panel (только для роли admin) */}
        {user.role === 'admin' && (
          <Link href="/admin">
            <div className="border-2 border-halyk bg-halyk-light rounded-2xl p-5 mb-3 active:scale-98 transition-transform">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <ShieldCheck size={28} className="text-halyk mb-2" />
                  <h3 className="font-bold text-gray-900 text-base mb-1">Проверка экспертов</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Заявки на верификацию: одобрить или отклонить, чтобы специалист мог получать клиентов
                  </p>
                </div>
                <ArrowRight size={20} className="text-halyk mt-1 flex-shrink-0" />
              </div>
            </div>
          </Link>
        )}

        {/* Client option */}
        <Link href="/client/category">
          <div className="border-2 border-halyk bg-halyk-light rounded-2xl p-5 mb-3 active:scale-98 transition-transform">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-3xl mb-2">🔍</div>
                <h3 className="font-bold text-gray-900 text-base mb-1">Ищу специалиста</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Нужна помощь юриста, адвоката, бухгалтера или налогового консультанта
                </p>
              </div>
              <ArrowRight size={20} className="text-halyk mt-1 flex-shrink-0" />
            </div>
          </div>
        </Link>

        {/* Expert option (гейтинг по верификации) */}
        <button onClick={goExpert} disabled={checkingExpert}
          className="w-full text-left border-2 border-gray-200 rounded-2xl p-5 active:scale-98 transition-transform disabled:opacity-70">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-3xl mb-2">👔</div>
              <h3 className="font-bold text-gray-900 text-base mb-1">Я специалист</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {user.is_verified_expert
                  ? 'Перейти в дашборд и принимать заявки'
                  : 'Пройти верификацию и предоставлять услуги'}
              </p>
            </div>
            {checkingExpert
              ? <Loader2 size={20} className="text-gray-400 mt-1 flex-shrink-0 animate-spin" />
              : <ArrowRight size={20} className="text-gray-400 mt-1 flex-shrink-0" />}
          </div>
        </button>

        {/* Общий профиль: вернуться к своим диалогам (клиент и специалист) */}
        <Link href="/profile">
          <div className="mt-3 bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3 active:scale-98 transition-transform hover:border-halyk">
            <div className="w-10 h-10 bg-halyk-light rounded-xl flex items-center justify-center flex-shrink-0">
              <MessageCircle size={18} className="text-halyk" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm">Мои диалоги и профиль</h3>
              <p className="text-xs text-gray-400">Вернуться к своим сделкам</p>
            </div>
            <ArrowRight size={18} className="text-gray-300 flex-shrink-0" />
          </div>
        </Link>
      </div>

      {/* Bottom info */}
      <div className="mt-auto px-4 pb-8">
        <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
          <Shield size={14} className="text-halyk mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-500 leading-relaxed">
            Все специалисты верифицированы через Halyk ID. Оплата защищена банковским эскроу.
          </p>
        </div>
      </div>
    </div>
  );
}
