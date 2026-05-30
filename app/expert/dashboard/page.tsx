'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getExpertById, EXPERTS } from '@/lib/mock-data';
import StarRating from '@/components/ui/StarRating';
import { CheckCircle, MessageCircle, Clock, Bell, User, TrendingUp, Lock } from 'lucide-react';

const DEMO_EXPERT = getExpertById('exp-5')!;

const INCOMING_REQUESTS = [
  {
    id: 'req-1',
    clientName: 'Мирас Темиров',
    clientCompany: 'ТОО "TechStart"',
    category: 'Юрист',
    task: 'Составление пакета договоров для IT-стартапа: NDA, Оферта, Трудовые договоры',
    budget: '80 000 – 120 000 ₸',
    deadline: '5 дней',
    clientRating: 4.7,
    clientDeals: 8,
    time: '15 мин назад',
    isNew: true,
  },
  {
    id: 'req-2',
    clientName: 'Айнур Рахимова',
    clientCompany: 'ИП Рахимова',
    category: 'Юрист',
    task: 'Проверка договора аренды коммерческого помещения (450 кв.м)',
    budget: '40 000 – 60 000 ₸',
    deadline: '2 дня',
    clientRating: 4.9,
    clientDeals: 22,
    time: '2 часа назад',
    isNew: true,
  },
];

const ACTIVE_DEALS = [
  {
    id: 'deal-active-1',
    clientName: 'Бауыржан Сейт',
    task: 'Регистрация ТОО и оформление учредительных документов',
    status: 'В работе',
    escrow: 75000,
    deadline: '3 дня',
    unread: 2,
  },
];

export default function ExpertDashboardPage() {
  const router = useRouter();
  const expert = DEMO_EXPERT;

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
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
              {INCOMING_REQUESTS.length}
            </span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Рейтинг', value: expert.rating.toString(), icon: '⭐' },
            { label: 'Сделок', value: expert.completed_deals.toString(), icon: '✅' },
            { label: 'В эскроу', value: '75 000 ₸', icon: '🔒' },
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
              {INCOMING_REQUESTS.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {INCOMING_REQUESTS.length}
                </span>
              )}
            </h2>
          </div>

          <div className="space-y-3">
            {INCOMING_REQUESTS.map((req) => (
              <div key={req.id} className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-gray-900 text-sm">{req.clientName}</p>
                      {req.isNew && (
                        <span className="bg-red-100 text-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full">НОВЫЙ</span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400">{req.clientCompany} · {req.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-halyk-dark">{req.budget}</p>
                  </div>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed mb-2">{req.task}</p>

                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-1">
                    <Clock size={11} className="text-orange-500" />
                    <span className="text-[10px] text-gray-500">Дедлайн: {req.deadline}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User size={11} className="text-gray-400" />
                    <span className="text-[10px] text-gray-500">{req.clientDeals} сделок · ⭐ {req.clientRating}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/deal/demo-deal-1?expert=${expert.id}`)}
                    className="flex-1 bg-halyk text-white rounded-xl py-2 text-xs font-semibold"
                  >
                    Откликнуться
                  </button>
                  <button className="flex-1 bg-gray-100 text-gray-600 rounded-xl py-2 text-xs font-medium">
                    Пропустить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active deals */}
        <div>
          <h2 className="font-bold text-gray-900 text-sm mb-3">Активные сделки</h2>
          {ACTIVE_DEALS.map((deal) => (
            <button
              key={deal.id}
              onClick={() => router.push(`/deal/${deal.id}?expert=${expert.id}`)}
              className="w-full bg-white rounded-2xl border border-gray-200 p-4 text-left"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{deal.clientName}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{deal.task}</p>
                </div>
                {deal.unread > 0 && (
                  <span className="bg-halyk text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                    {deal.unread}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1">
                  <Lock size={11} className="text-halyk" />
                  <span className="text-xs font-semibold text-halyk">{deal.escrow.toLocaleString('ru')} ₸ в эскроу</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={11} className="text-orange-500" />
                  <span className="text-[10px] text-gray-500">{deal.deadline}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 mt-2">
                <MessageCircle size={13} className="text-halyk" />
                <span className="text-xs text-halyk font-medium">Открыть чат</span>
              </div>
            </button>
          ))}
        </div>

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
