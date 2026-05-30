'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getExpertById } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';
import { CheckCircle, MessageCircle, Clock, Bell, TrendingUp, Lock, Loader2, Flag } from 'lucide-react';
import { useState, useEffect } from 'react';

const DEMO_EXPERT = getExpertById('exp-5')!;

interface Deal {
  id: string;
  room_code: string;
  client_name: string;
  description: string | null;
  status: string;
  offer_price: number | null;
  offer_deadline: string | null;
  created_at: string;
}

export default function ExpertDashboardPage() {
  const router = useRouter();
  const expert = DEMO_EXPERT;

  const [pendingDeals, setPendingDeals] = useState<Deal[]>([]);
  const [activeDeals, setActiveDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  // ── Load deals ─────────────────────────────────────────────────────────────
  const loadDeals = async () => {
    const { data } = await supabase
      .from('deals')
      .select('*')
      .in('status', ['pending', 'claimed', 'offered', 'active'])
      .order('created_at', { ascending: false });

    if (data) {
      setPendingDeals((data as Deal[]).filter(d => d.status === 'pending' || d.status === 'claimed'));
      setActiveDeals((data as Deal[]).filter(d => d.status === 'offered' || d.status === 'active'));
    }
    setLoading(false);
  };

  // ── Real-time subscriptions ────────────────────────────────────────────────
  useEffect(() => {
    loadDeals();
    const ch = supabase.channel('expert-dashboard')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'deals' }, (payload) => {
        const deal = payload.new as Deal;
        if (deal.status === 'pending') {
          setPendingDeals(prev => [deal, ...prev]);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'deals' }, (payload) => {
        const deal = payload.new as Deal;
        if (deal.status === 'pending' || deal.status === 'claimed') {
          setPendingDeals(prev => {
            const exists = prev.find(d => d.id === deal.id);
            if (exists) return prev.map(d => d.id === deal.id ? deal : d);
            return [deal, ...prev];
          });
          setActiveDeals(prev => prev.filter(d => d.id !== deal.id));
        } else if (deal.status === 'offered' || deal.status === 'active') {
          setPendingDeals(prev => prev.filter(d => d.id !== deal.id));
          setActiveDeals(prev => {
            const exists = prev.find(d => d.id === deal.id);
            if (exists) return prev.map(d => d.id === deal.id ? deal : d);
            return [deal, ...prev];
          });
        } else {
          // completed / cancelled — remove from all
          setPendingDeals(prev => prev.filter(d => d.id !== deal.id));
          setActiveDeals(prev => prev.filter(d => d.id !== deal.id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // ── Claim a deal ───────────────────────────────────────────────────────────
  const claimDeal = async (deal: Deal) => {
    setClaimingId(deal.id);
    await supabase.from('deals').update({
      status: 'claimed',
      expert_name: expert.name,
    }).eq('id', deal.id).eq('status', 'pending'); // atomic: only claim if still pending
    router.push(`/deal/${deal.room_code}?role=expert`);
  };

  const timeAgo = (ts: string) => {
    const sec = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (sec < 60) return 'только что';
    if (sec < 3600) return `${Math.floor(sec / 60)} мин назад`;
    return `${Math.floor(sec / 3600)} ч назад`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-halyk px-4 pt-8 pb-5">
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
