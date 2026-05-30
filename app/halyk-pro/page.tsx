'use client';
import Link from 'next/link';
import { Shield, Star, CheckCircle, ArrowRight, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RoleSelectionPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <div className="bg-halyk px-4 pt-10 pb-8">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors mb-4"
        >
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

        {/* Expert option */}
        <Link href="/expert/dashboard">
          <div className="border-2 border-gray-200 rounded-2xl p-5 active:scale-98 transition-transform">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-3xl mb-2">👔</div>
                <h3 className="font-bold text-gray-900 text-base mb-1">Я специалист</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Хочу предоставлять услуги клиентам через Halyk Pro
                </p>
              </div>
              <ArrowRight size={20} className="text-gray-400 mt-1 flex-shrink-0" />
            </div>
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
