'use client';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';
import { getExpertById } from '@/lib/mock-data';
import MobileHeader from '@/components/ui/MobileHeader';
import { CheckCircle, Star, PartyPopper } from 'lucide-react';

function CompleteContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const expertId = searchParams.get('expert') || 'exp-5';
  const expert = getExpertById(expertId);

  const [stage, setStage] = useState<'confirm' | 'review' | 'done'>('confirm');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!expert) return null;

  const handleRelease = async () => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 1800));
    setIsProcessing(false);
    setStage('review');
  };

  const handleSubmitReview = async () => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsProcessing(false);
    setStage('done');
  };

  if (stage === 'done') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white px-6 text-center animate-fade-in">
        <div className="w-20 h-20 bg-halyk-light rounded-full flex items-center justify-center mb-5">
          <PartyPopper size={36} className="text-halyk" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Сделка завершена!</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-2">
          Оплата переведена специалисту. Спасибо за использование Halyk Pro!
        </p>
        <div className="bg-halyk-light rounded-2xl p-4 w-full max-w-sm mb-6">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">Выплачено специалисту</span>
            <span className="font-bold text-gray-900">57 000 ₸</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">Кэшбэк Halyk Bonus</span>
            <span className="font-bold text-halyk">+600 ₸ 🎁</span>
          </div>
          <div className="flex justify-between text-sm border-t border-halyk/20 pt-2 mt-2">
            <span className="text-gray-500">Ваш отзыв</span>
            <div className="flex">
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={12} className={s <= rating ? 'star-filled' : 'star-empty'} />
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={() => router.push('/')}
          className="w-full bg-halyk text-white rounded-2xl py-4 font-bold text-base"
        >
          На главную
        </button>
        <button
          onClick={() => router.push('/halyk-pro')}
          className="w-full text-halyk text-sm font-medium mt-3"
        >
          Найти другого специалиста
        </button>
      </div>
    );
  }

  if (stage === 'review') {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <MobileHeader title="Оставьте отзыв" />
        <div className="px-4 py-5 space-y-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="w-16 h-16 bg-halyk rounded-full flex items-center justify-center">
              <CheckCircle size={28} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900">57 000 ₸ переведено</p>
              <p className="text-sm text-gray-500">Специалисту {expert.name}</p>
              <p className="text-xs text-halyk font-medium mt-0.5">+600 ₸ кэшбэк Halyk Bonus</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4 text-center">Как прошло сотрудничество?</h3>

            <div className="flex items-center justify-center gap-3 mb-5">
              {[1,2,3,4,5].map(s => (
                <button
                  key={s}
                  onClick={() => setRating(s)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={36}
                    className={s <= rating ? 'star-filled' : 'text-gray-200'}
                  />
                </button>
              ))}
            </div>

            {rating > 0 && (
              <div className="animate-fade-in">
                <p className="text-center text-sm font-medium text-gray-700 mb-3">
                  {rating === 5 ? '🎉 Отлично!' : rating >= 4 ? '👍 Хорошо' : rating >= 3 ? '🤔 Нормально' : '😕 Плохо'}
                </p>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Расскажите о вашем опыте..."
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-halyk"
                  rows={3}
                />
              </div>
            )}
          </div>

          <button
            onClick={handleSubmitReview}
            disabled={rating === 0 || isProcessing}
            className="w-full bg-halyk text-white rounded-2xl py-4 font-bold text-base disabled:opacity-50"
          >
            {isProcessing ? 'Отправляем...' : 'Отправить отзыв'}
          </button>
          <button
            onClick={() => setStage('done')}
            className="w-full text-gray-400 text-sm py-2"
          >
            Пропустить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <MobileHeader title="Завершить сделку" backHref={`/deal/${id}?expert=${expertId}`} />

      <div className="px-4 py-5 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex gap-3 items-center">
          <img src={expert.avatar} alt={expert.name} className="w-12 h-12 rounded-xl bg-gray-100" />
          <div>
            <p className="font-semibold text-gray-900">{expert.name}</p>
            <p className="text-xs text-halyk">{expert.categoryLabel}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
          <h3 className="font-semibold text-gray-900">Детали выплаты</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Сумма в эскроу</span>
              <span className="font-medium">60 000 ₸</span>
            </div>
            <div className="flex justify-between text-sm text-orange-600">
              <span>Комиссия платформы (5%)</span>
              <span>−3 000 ₸</span>
            </div>
            <div className="flex justify-between text-sm text-halyk">
              <span>Ваш кэшбэк Halyk Bonus (1%)</span>
              <span>+600 ₸ 🎁</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-bold">
              <span>Специалист получит</span>
              <span className="text-gray-900">57 000 ₸</span>
            </div>
          </div>
        </div>

        <div className="bg-halyk-light rounded-2xl p-4">
          <p className="text-sm text-halyk-dark leading-relaxed">
            ✅ Убедитесь, что специалист выполнил всю работу качественно перед тем как нажать кнопку. После подтверждения деньги будут переведены мгновенно.
          </p>
        </div>
      </div>

      <div className="px-4 mt-auto pb-8">
        <button
          onClick={handleRelease}
          disabled={isProcessing}
          className="w-full bg-halyk text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-bold text-base shadow-lg shadow-halyk/30 disabled:opacity-70"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Переводим оплату...
            </>
          ) : (
            <>
              <CheckCircle size={18} />
              Release Payment · 57 000 ₸
            </>
          )}
        </button>
        <p className="text-center text-[10px] text-gray-400 mt-2">
          Деньги переводятся мгновенно и не могут быть отменены
        </p>
      </div>
    </div>
  );
}

export default function CompleteDeailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-gray-400">Загрузка...</div>}>
      <CompleteContent />
    </Suspense>
  );
}
