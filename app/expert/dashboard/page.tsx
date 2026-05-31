'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DEMO_EXPERT } from '@/lib/mock-data';
import { Deal, listDeals, openExpertChannel, claimDeal as apiClaimDeal, currentUserId, getCurrentUser, getExpert, rememberDeal, User, ApiExpert } from '@/lib/api';
import { timeAgo } from '@/lib/date';
import { LoadingScreen } from '@/components/ui/StatusScreen';
import { CheckCircle, MessageCircle, Clock, Bell, TrendingUp, Lock, Loader2, Flag, ChevronLeft } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ExpertDashboardPage() {
  const router = useRouter();

  const [pendingDeals, setPendingDeals] = useState<Deal[]>([]);
  const [activeDeals, setActiveDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ApiExpert | null>(null);

  // ── Гейтинг: только верифицированный специалист (is_verified_expert) ─────────
  useEffect(() => {
    const uid = currentUserId();
    getCurrentUser(uid).then(me => {
      if (!me.is_verified_expert) {
        router.replace('/expert/verify');
        return;
      }
      setUser(me);
      setAuthorized(true);
      if (me.expert_id) getExpert(me.expert_id).then(p => { if (p) setProfile(p); }).catch(() => {});
    });
  }, [router]);

  // Данные вошедшего специалиста: реальный профиль (/experts/{id}) с фолбэком на сид
  const expert = {
    ...DEMO_EXPERT,
    name: profile?.name || user?.display_name || DEMO_EXPERT.name,
    avatar: profile?.avatar || DEMO_EXPERT.avatar,
    categoryLabel: profile?.categoryLabel || DEMO_EXPERT.categoryLabel,
    rating: profile?.rating || DEMO_EXPERT.rating,
    completed_deals: profile?.completed_deals ?? DEMO_EXPERT.completed_deals,
  };

  // GET /deals возвращает ОБЩИЙ список (не скоупится по эксперту, BACKEND.md §5.3):
  //  • «Новые запросы» — это пул: pending и ещё никем не взятые (expert_user_id == null).
  //  • «Мои сделки» — только те, что взял текущий эксперт (expert_user_id == uid).
  const isPool = (d: Deal) => d.status === 'pending' && !d.expert_user_id;
  const isMine = (d: Deal, uid: string) =>
    d.expert_user_id === uid && (d.status === 'claimed' || d.status === 'offered' || d.status === 'active');

  // ── Load deals ─────────────────────────────────────────────────────────────
  const loadDeals = async () => {
    const uid = currentUserId();
    try {
      const data = await listDeals(
        { status: ['pending', 'claimed', 'offered', 'active'], order: 'created_at.desc' },
        uid,
      );
      setPendingDeals(data.filter(isPool));
      setActiveDeals(data.filter(d => isMine(d, uid)));
    } catch {
      // бэкенд недоступен — оставляем пустые списки
    }
    setLoading(false);
  };

  // ── Real-time subscriptions (WebSocket) ─────────────────────────────────────
  useEffect(() => {
    if (!authorized) return;
    const uid = currentUserId();
    loadDeals();
    const ws = openExpertChannel((ev) => {
      const deal = ev.data;
      const upsert = (prev: Deal[]) => [deal, ...prev.filter(d => d.id !== deal.id)];
      const drop = (prev: Deal[]) => prev.filter(d => d.id !== deal.id);

      if (ev.type === 'deal.created') {
        if (isPool(deal)) setPendingDeals(upsert);
        return;
      }
      // deal.updated: пересортировываем по принадлежности
      setPendingDeals(isPool(deal) ? upsert : drop);
      setActiveDeals(isMine(deal, uid) ? upsert : drop);
    });
    return () => ws.close();
  }, [authorized]);

  // ── Claim a deal ───────────────────────────────────────────────────────────
  const claimDeal = async (deal: Deal) => {
    setClaimingId(deal.id);
    try {
      await apiClaimDeal(deal.id, expert.name, currentUserId()); // 409 если уже занято
      rememberDeal(currentUserId(), deal.room_code);
      router.push(`/deal/${deal.room_code}?role=expert`);
    } catch {
      // сделку уже забрали или ошибка — убираем из списка
      setPendingDeals(prev => prev.filter(d => d.id !== deal.id));
      setClaimingId(null);
    }
  };

  // Пока проверяем верификацию — показываем загрузку (или редиректим на /expert/verify)
  if (authorized === null) return <LoadingScreen text="Проверяем доступ..." />;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-halyk px-4 pt-8 pb-5">
        <button onClick={() => router.push('/halyk-pro')}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors mb-3">
          <ChevronLeft size={22} className="text-white" />
        </button>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={expert.avatar} alt={expert.name} className="w-11 h-11 rounded-full bg-white/20" />
              <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full">
                <CheckCircle size={14} className="text-halyk fill-halyk" />
              </div>
            </div>
            <div>
              <p className="font-bold text-white">{expert.name}</p>
              <p className="text-white/80 text-xs">{expert.categoryLabel}</p>
            </div>
          </div>
          <button className="relative w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
            <Bell size={16} className="text-white" />
            {pendingDeals.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {pendingDeals.length}
              </span>
            )}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Рейтинг', value: expert.rating.toString(), icon: '⭐' },
            { label: 'Сделок', value: expert.completed_deals.toString(), icon: '✅' },
            { label: 'Заявок', value: pendingDeals.length.toString(), icon: '📨' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white/15 rounded-xl p-2.5 text-center">
              <p className="text-lg">{icon}</p>
              <p className="font-bold text-white text-sm">{value}</p>
              <p className="text-white/70 text-[10px]">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4">

        {/* Incoming requests */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 text-sm">
              Новые запросы
              {pendingDeals.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {pendingDeals.length}
                </span>
              )}
            </h2>
            {loading && <Loader2 size={14} className="text-gray-300 animate-spin" />}
          </div>

          {!loading && pendingDeals.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
              <p className="text-2xl mb-2">📭</p>
              <p className="text-sm text-gray-500 font-medium">Новых заявок пока нет</p>
              <p className="text-xs text-gray-400 mt-1">Страница обновляется автоматически</p>
              <div className="flex items-center justify-center gap-1.5 mt-3 text-halyk text-xs">
                <div className="w-1.5 h-1.5 bg-halyk rounded-full animate-pulse" />
                Ожидаем входящие запросы
              </div>
            </div>
          )}

          <div className="space-y-3">
            {pendingDeals.map((deal) => (
              <div key={deal.id} className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-gray-900 text-sm">{deal.client_name || 'Клиент'}</p>
                      <span className="bg-red-100 text-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full">НОВЫЙ</span>
                    </div>
                    <p className="text-[10px] text-gray-400">{timeAgo(deal.created_at)}</p>
                  </div>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed mb-3 line-clamp-3">
                  {deal.description || 'Описание не указано'}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => claimDeal(deal)}
                    disabled={claimingId === deal.id}
                    className="flex-1 bg-halyk text-white rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-70"
                  >
                    {claimingId === deal.id
                      ? <><Loader2 size={12} className="animate-spin" />Принимаем...</>
                      : 'Откликнуться'}
                  </button>
                  <button
                    onClick={() => setPendingDeals(prev => prev.filter(d => d.id !== deal.id))}
                    className="flex-1 bg-gray-100 text-gray-600 rounded-xl py-2.5 text-xs font-medium"
                  >
                    Пропустить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active deals */}
        {activeDeals.length > 0 && (
          <div>
            <h2 className="font-bold text-gray-900 text-sm mb-3">Активные сделки</h2>
            {activeDeals.map((deal) => (
              <div
                key={deal.id}
                className="w-full bg-white rounded-2xl border border-gray-200 p-4 text-left mb-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{deal.client_name || 'Клиент'}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{deal.description}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${deal.status === 'active' ? 'bg-halyk-light text-halyk' : 'bg-orange-100 text-orange-600'}`}>
                    {deal.status === 'active' ? 'В работе' : 'Ждём ответа'}
                  </span>
                </div>
                {deal.offer_price && (
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-1">
                      <Lock size={11} className="text-halyk" />
                      <span className="text-xs font-semibold text-halyk">{deal.offer_price.toLocaleString('ru')} ₸ в эскроу</span>
                    </div>
                    {deal.offer_deadline && (
                      <div className="flex items-center gap-1">
                        <Clock size={11} className="text-orange-500" />
                        <span className="text-[10px] text-gray-500">{deal.offer_deadline}</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/deal/${deal.room_code}?role=expert`); }}
                    className="flex items-center gap-1 bg-halyk-light text-halyk rounded-xl px-3 py-2 text-xs font-medium"
                  >
                    <MessageCircle size={12} />Чат
                  </button>
                  {deal.status === 'active' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/deal/${deal.room_code}/submit?role=expert`); }}
                      className="flex items-center gap-1 bg-halyk text-white rounded-xl px-3 py-2 text-xs font-semibold"
                    >
                      <Flag size={12} />Сдать работу
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Profile link */}
        <Link href="/expert/profile">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-halyk-light rounded-xl flex items-center justify-center">
              <TrendingUp size={18} className="text-halyk" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">Мой профиль</p>
              <p className="text-xs text-gray-400">Обновить портфолио и специализации</p>
            </div>
            <span className="text-gray-300">›</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
