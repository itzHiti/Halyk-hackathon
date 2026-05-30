'use client';
import Link from 'next/link';
import { Search, Bell, QrCode, ArrowLeftRight, CreditCard, Home } from 'lucide-react';

const DISABLED_ICON = 'icon-disabled cursor-not-allowed';

function ServiceIcon({ label, emoji, href, isNew = false, badge }: {
  label: string;
  emoji: string;
  href?: string;
  isNew?: boolean;
  badge?: string;
}) {
  const content = (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl shadow-sm">
        {emoji}
        {isNew && (
          <span className="absolute -top-1 -right-1 bg-halyk text-white text-[9px] font-bold px-1 py-0.5 rounded-full">
            NEW
          </span>
        )}
        {badge && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <span className="text-[10px] text-center text-gray-700 leading-tight font-medium max-w-14">
        {label}
      </span>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return <div className={DISABLED_ICON}>{content}</div>;
}

function HalykProIcon() {
  return (
    <Link href="/halyk-pro">
      <div className="flex flex-col items-center gap-1.5">
        <div className="relative w-14 h-14 rounded-2xl bg-halyk flex items-center justify-center shadow-md">
          <span className="text-2xl">⚖️</span>
          <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full">
            NEW
          </span>
        </div>
        <span className="text-[10px] text-center text-halyk-dark leading-tight font-bold max-w-14">
          Halyk Pro
        </span>
      </div>
    </Link>
  );
}

export default function HalykHomeMock() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Status bar */}
      <div className="bg-halyk h-1.5 w-full" />

      {/* Header */}
      <div className="bg-white px-4 pt-3 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
            ИП
          </div>
          <div className="flex-1 flex items-center bg-gray-100 rounded-full px-3 h-9 gap-2">
            <Search size={14} className="text-gray-400" />
            <span className="text-sm text-gray-400">Поиск</span>
          </div>
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-halyk-light flex items-center justify-center">
              <span className="text-xs font-bold text-halyk">b</span>
            </div>
            <span className="absolute -top-0.5 -right-0.5 bg-gray-700 text-white text-[9px] font-bold px-1 rounded-full">
              123.9
            </span>
          </div>
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
              <Bell size={16} className="text-gray-600" />
            </div>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full">
              12
            </span>
          </div>
        </div>
      </div>

      {/* Banners */}
      <div className="px-4 pb-3">
        <div className="flex gap-2">
          <div className="flex-1 bg-halyk-dark rounded-2xl p-3 h-24 overflow-hidden relative">
            <p className="text-white font-bold text-sm leading-tight">50% БОНУС</p>
            <p className="text-white/80 text-[10px]">НА МЕЖГОРОД</p>
            <div className="absolute right-2 bottom-0 text-3xl">🚌</div>
          </div>
          <div className="flex-1 bg-halyk rounded-2xl p-3 h-24 overflow-hidden relative">
            <p className="text-white font-bold text-sm leading-tight">Halyk Pro</p>
            <p className="text-white/90 text-[10px]">Юристы и бухгалтеры</p>
            <p className="text-white font-bold text-lg">НОВИНКА</p>
          </div>
        </div>
      </div>

      {/* Main services grid */}
      <div className="px-4 pb-3">
        {/* Row 1 */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <ServiceIcon label="Карты" emoji="💳" />
          <ServiceIcon label="Депозиты" emoji="🏦" />
          <ServiceIcon label="Кредиты" emoji="💰" />
          <ServiceIcon label="Рассрочка" emoji="🛍️" />
        </div>
        {/* Row 2 */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <ServiceIcon label="Market" emoji="🛒" badge="0-24" />
          <ServiceIcon label="Travel" emoji="✈️" />
          <ServiceIcon label="Страховка" emoji="🛡️" />
          <ServiceIcon label="Kino.kz" emoji="🎬" />
        </div>
        {/* Row 3 — Halyk Pro is here */}
        <div className="grid grid-cols-4 gap-2">
          <HalykProIcon />
          <ServiceIcon label="Гос.услуги" emoji="🏛️" />
          <ServiceIcon label="Инвест" emoji="📈" />
          <ServiceIcon label="QR" emoji="⬛" />
        </div>
      </div>

      {/* All services */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-800">Все сервисы</span>
          <span className="text-xs text-halyk font-medium">›</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          {[
            { label: 'Halyk FX', emoji: '💱' },
            { label: 'Airba fresh', emoji: '🥦' },
            { label: 'Appteka', emoji: '💊' },
            { label: 'Restaurants', emoji: '🍽️' },
            { label: 'inDrive', emoji: '🚗' },
          ].map(({ label, emoji }) => (
            <div key={label} className={`flex flex-col items-center gap-1 flex-shrink-0 ${DISABLED_ICON}`}>
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-xl">
                {emoji}
              </div>
              <span className="text-[10px] text-gray-600 text-center max-w-12">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Featured section */}
      <div className="px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {['🛒 Market', '🎬 Kino.kz', '✈️ Halyk Travel'].map((tab) => (
            <div key={tab} className={`flex-shrink-0 bg-gray-100 rounded-full px-4 py-1.5 text-xs font-medium text-gray-600 ${DISABLED_ICON}`}>
              {tab}
            </div>
          ))}
        </div>
        <div className="mt-3 bg-gray-50 rounded-2xl p-4 h-32 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl mb-1">💻</div>
            <p className="text-xs text-gray-400">Загрузка товаров...</p>
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="mt-auto border-t border-gray-200 bg-white">
        <div className="flex">
          {[
            { icon: <Home size={20} />, label: 'Главная', active: true },
            { icon: <CreditCard size={20} />, label: 'Мой банк', active: false },
            { icon: <QrCode size={20} />, label: '', active: false, big: true },
            { icon: <ArrowLeftRight size={20} />, label: 'Переводы', active: false },
            { icon: <span className="text-lg">💳</span>, label: 'Платежи', active: false },
          ].map(({ icon, label, active, big }, i) => (
            <button
              key={i}
              className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 ${big ? '' : ''}`}
            >
              {big ? (
                <div className="w-12 h-12 bg-halyk rounded-full flex items-center justify-center -mt-5 shadow-lg">
                  <QrCode size={22} className="text-white" />
                </div>
              ) : (
                <>
                  <span className={active ? 'text-halyk' : 'text-gray-400'}>{icon}</span>
                  <span className={`text-[10px] ${active ? 'text-halyk font-medium' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
