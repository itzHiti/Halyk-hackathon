'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';
import MobileHeader from '@/components/ui/MobileHeader';
import { getExpertById } from '@/lib/mock-data';
import { Shield, Lock, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

function NewDealContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const expertId = searchParams.get('expert') || 'exp-5';
  const expert = getExpertById(expertId);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEscrowInfo, setShowEscrowInfo] = useState(false);

  if (!expert) return null;

  const estimatedAmount = amount ? parseInt(amount.replace(/\D/g, '')) : expert.hourly_rate * 2;
  const commission = Math.round(estimatedAmount * 0.05);
  const expertReceives = estimatedAmount - commission;

  const handleStartDeal = async () => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 2000));
    router.push(`/deal/demo-deal-1?expert=${expertId}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <MobileHeader title="Подтверждение сделки" />

      <div className="flex-1 px-4 py-4 space-y-3">
        {/* Expert summary */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex gap-3 items-center">
          <img src={expert.avatar} alt={expert.name} className="w-12 h-12 rounded-xl bg-gray-100" />
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{expert.name}</p>
            <p className="text-xs text-halyk">{expert.categoryLabel}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-900">{expert.hourly_rate.toLocaleString('ru')} ₸</p>
            <p className="text-[10px] text-gray-400">/ час</p>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <label className="text-sm font-semibold text-gray-700 block mb-2">
            Опишите задачу
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Чем конкретно нужна помощь специалиста..."
            className="w-full text-sm text-gray-700 placeholder:text-gray-300 resize-none focus:outline-none"
            rows={3}
          />
        </div>

        {/* Amount */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <label className="text-sm font-semibold text-gray-700 block mb-1">
            Сумма в эскроу (₸)
          </label>
          <p className="text-xs text-gray-400 mb-2">Деньги замораживаются и переходят специалисту только после вашего подтверждения</p>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Рекомендовано: ${(expert.hourly_rate * 2).toLocaleString('ru')} ₸`}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-halyk"
          />
        </div>

        {/* Escrow breakdown */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <button
            className="w-full flex items-center justify-between"
            onClick={() => setShowEscrowInfo(!showEscrowInfo)}
          >
            <div className="flex items-center gap-2">
              <Lock size={15} className="text-halyk" />
              <span className="text-sm font-semibold text-gray-700">Детали эскроу</span>
            </div>
            {showEscrowInfo ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>

          {showEscrowInfo && (
            <div className="mt-3 space-y-2 text-sm animate-fade-in">
              <div className="flex justify-between">
                <span className="text-gray-500">Сумма сделки</span>
                <span className="font-medium">{estimatedAmount.toLocaleString('ru')} ₸</span>
              </div>
              <div className="flex justify-between text-orange-600">
                <span>Комиссия платформы (5%)</span>
                <span className="font-medium">−{commission.toLocaleString('ru')} ₸</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-500">Специалист получит</span>
                <span className="font-bold text-gray-900">{expertReceives.toLocaleString('ru')} ₸</span>
              </div>
            </div>
          )}
        </div>

        {/* Guarantees */}
        <div className="bg-halyk-light rounded-2xl p-4 space-y-2">
          <h3 className="text-sm font-semibold text-halyk-dark">Гарантии Halyk Pro</h3>
          {[
            'Деньги хранятся на счёте Halyk Bank — не у специалиста',
            'Оплата переходит только после вашего подтверждения',
            'Переписка записывается для разрешения споров',
            'Специалист верифицирован через Halyk ID',
          ].map((g, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle size={13} className="text-halyk mt-0.5 flex-shrink-0" />
              <p className="text-xs text-halyk-dark leading-relaxed">{g}</p>
            </div>
          ))}
        </div>

        <div className="h-24" />
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white border-t border-gray-200 px-4 py-4">
        <button
          onClick={handleStartDeal}
          disabled={isProcessing}
          className="w-full bg-halyk text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-bold text-base shadow-lg shadow-halyk/30 disabled:opacity-70"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Отправляем в эскроу...
            </>
          ) : (
            <>
              <Shield size={18} />
              Отправить в эскроу
            </>
          )}
        </button>
        <p className="text-center text-[10px] text-gray-400 mt-2">
          Нажимая кнопку, вы соглашаетесь с условиями сделки
        </p>
      </div>
    </div>
  );
}

export default function NewDealPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-gray-400">Загрузка...</div>}>
      <NewDealContent />
    </Suspense>
  );
}
