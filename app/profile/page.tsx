'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileHeader from '@/components/ui/MobileHeader';
import {
  currentUserId, getCurrentUser, getRememberedDeals, getDeal, logout,
  User, Deal,
} from '@/lib/api';
import { Search, LayoutDashboard, MessageCircle, LogOut, UserCircle, Shield, Loader2, ChevronRight } from 'lucide-react';

interface MyDeal { deal: Deal; role: 'client' | 'expert' }

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  pending:   { text: 'Ожидает отклика',  cls: 'bg-orange-100 text-orange-600' },
  claimed:   { text: 'Специалист изучает', cls: 'bg-orange-100 text-orange-600' },
  offered:   { text: 'Предложение',       cls: 'bg-blue-100 text-blue-600' },
  active:    { text: 'В работе',          cls: 'bg-halyk-light text-halyk' },
  completed: { text: 'Завершено',         cls: 'bg-gray-100 text-gray-500' },
  cancelled: { text: 'Отменено',          cls: 'bg-gray-100 text-gray-400' },
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [deals, setDeals] = useState<MyDeal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const uid = currentUserId();
    (async () => {
      const me = await getCurrentUser(uid);
      if (cancelled) return;
      setUser(me);

      const rooms = getRememberedDeals(uid);
      const loaded = await Promise.all(rooms.map(code => getDeal(code, uid).catch(() => null)));
      if (cancelled) return;

      const mine: MyDeal[] = [];
      loaded.forEach(d => {
        if (!d) return;
        // Роль в этой сделке определяем по самой сделке (client_id / expert_user_id)
        let role: 'client' | 'expert';
        if (d.client_id && d.client_id === uid) role = 'client';
        else if (d.expert_user_id && d.expert_user_id === uid) role = 'expert';
        else role = me.is_verified_expert ? 'expert' : 'client';
        mine.push({ deal: d, role });
      });
      setDeals(mine);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const doLogout = () => { logout(); router.push('/halyk-pro'); };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <MobileHeader title="Профиль" backHref="/halyk-pro" />

      <div className="flex-1 px-4 py-4 space-y-4">
        {/* User card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3">
          <UserCircle size={44} className="text-halyk flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 truncate">{user?.display_name || user?.id || 'Гость'}</p>
            <div className="flex items-center gap-1 mt-0.5">
              {user?.is_verified_expert
                ? <><Shield size={11} className="text-halyk" /><span className="text-xs text-halyk font-medium">Специалист · верифицирован</span></>
                : <span className="text-xs text-gray-500">{user?.expert_status === 'pending' ? 'Заявка на верификацию на рассмотрении' : 'Клиент'}</span>}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5">
          <button onClick={() => router.push('/client/category')}
            className="w-full bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3 active:scale-98 transition-transform hover:border-halyk">
            <div className="w-10 h-10 bg-halyk-light rounded-xl flex items-center justify-center flex-shrink-0">
              <Search size={18} className="text-halyk" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-gray-900 text-sm">Найти специалиста</p>
              <p className="text-xs text-gray-400">Начать новый запрос</p>
            </div>
            <ChevronRight size={18} className="text-gray-300 flex-shrink-0" />
          </button>

          {user?.is_verified_expert && (
            <button onClick={() => router.push('/expert/dashboard')}
              className="w-full bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3 active:scale-98 transition-transform hover:border-halyk">
              <div className="w-10 h-10 bg-halyk-light rounded-xl flex items-center justify-center flex-shrink-0">
                <LayoutDashboard size={18} className="text-halyk" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-gray-900 text-sm">Кабинет специалиста</p>
                <p className="text-xs text-gray-400">Входящие заявки и активные сделки</p>
              </div>
              <ChevronRight size={18} className="text-gray-300 flex-shrink-0" />
            </button>
          )}
        </div>

        {/* My deals / dialogs */}
        <div>
          <h2 className="font-bold text-gray-900 text-sm mb-3">Мои диалоги</h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Loader2 size={20} className="text-halyk animate-spin" />
              <p className="text-sm text-gray-400">Загружаем ваши сделки...</p>
            </div>
          ) : deals.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
              <p className="text-2xl mb-2">💬</p>
              <p className="text-sm text-gray-500 font-medium">Пока нет диалогов</p>
              <p className="text-xs text-gray-400 mt-1">Начните с поиска специалиста — ваши сделки появятся здесь</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {deals.map(({ deal, role }) => {
                const partner = role === 'client'
                  ? (deal.expert_name || 'Специалист')
                  : (deal.client_name || 'Клиент');
                const st = STATUS_LABEL[deal.status] || { text: deal.status, cls: 'bg-gray-100 text-gray-500' };
                return (
                  <button key={deal.id} onClick={() => router.push(`/deal/${deal.room_code}?role=${role}`)}
                    className="w-full bg-white rounded-2xl border border-gray-200 p-4 text-left active:scale-98 transition-transform hover:border-halyk">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <MessageCircle size={14} className="text-halyk flex-shrink-0" />
                        <p className="font-semibold text-gray-900 text-sm truncate">{partner}</p>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">· вы {role === 'client' ? 'клиент' : 'специалист'}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${st.cls}`}>{st.text}</span>
                    </div>
                    {deal.description && (
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{deal.description}</p>
                    )}
                    {deal.offer_price ? (
                      <p className="text-xs text-halyk font-medium mt-1.5">{deal.offer_price.toLocaleString('ru')} ₸</p>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Logout */}
        <button onClick={doLogout}
          className="w-full flex items-center justify-center gap-2 text-gray-500 text-sm py-3 mt-2">
          <LogOut size={15} />Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}
