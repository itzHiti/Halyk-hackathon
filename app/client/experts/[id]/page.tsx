'use client';
import { useParams, useRouter } from 'next/navigation';
import { getExpertById } from '@/lib/mock-data';
import MobileHeader from '@/components/ui/MobileHeader';
import StarRating from '@/components/ui/StarRating';
import { CheckCircle, Clock, Briefcase, Star, Shield } from 'lucide-react';

export default function ExpertProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const expert = getExpertById(id);

  if (!expert) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-400">Специалист не найден</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <MobileHeader title="Профиль специалиста" />

      <div className="flex-1 overflow-y-auto">
        {/* Profile header */}
        <div className="bg-white px-4 pt-5 pb-5">
          <div className="flex gap-4">
            <div className="relative flex-shrink-0">
              <img
                src={expert.avatar}
                alt={expert.name}
                className="w-20 h-20 rounded-2xl bg-gray-100 object-cover"
              />
              {expert.is_verified && (
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                  <CheckCircle size={20} className="text-halyk fill-halyk" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">{expert.name}</h1>
              <p className="text-sm text-halyk font-medium">{expert.categoryLabel}</p>

              {expert.is_verified && (
                <div className="flex items-center gap-1 mt-1">
                  <Shield size={11} className="text-halyk" />
                  <span className="text-[10px] text-halyk font-medium">Верифицирован через Halyk ID</span>
                </div>
              )}

              <div className="flex items-center gap-3 mt-2">
                <StarRating rating={expert.rating} size={14} />
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { icon: <Briefcase size={15} className="text-halyk" />, value: `${expert.completed_deals}`, label: 'сделок' },
              { icon: <Star size={15} className="text-yellow-500" />, value: `${expert.experience_years}`, label: 'лет опыта' },
              { icon: <Clock size={15} className="text-blue-500" />, value: expert.response_time, label: 'ответ' },
            ].map(({ icon, value, label }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-2.5 flex flex-col items-center text-center">
                {icon}
                <p className="font-bold text-gray-900 text-sm mt-1">{value}</p>
                <p className="text-[10px] text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bio */}
        <div className="bg-white mt-2 px-4 py-4">
          <h2 className="font-semibold text-gray-900 mb-2 text-sm">О специалисте</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{expert.bio}</p>
        </div>

        {/* Specializations */}
        <div className="bg-white mt-2 px-4 py-4">
          <h2 className="font-semibold text-gray-900 mb-3 text-sm">Специализации</h2>
          <div className="flex flex-wrap gap-2">
            {expert.specializations.map(spec => (
              <span key={spec} className="bg-halyk-light text-halyk-dark text-xs font-medium px-3 py-1 rounded-full">
                {spec}
              </span>
            ))}
          </div>
        </div>

        {/* Cases */}
        <div className="bg-white mt-2 px-4 py-4">
          <h2 className="font-semibold text-gray-900 mb-3 text-sm">Ключевые кейсы</h2>
          <div className="space-y-2">
            {expert.cases.map((c, i) => (
              <div key={i} className="flex gap-2">
                <CheckCircle size={14} className="text-halyk mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600 leading-relaxed">{c}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Rate */}
        <div className="bg-white mt-2 px-4 py-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">Стоимость</h2>
            <div className="text-right">
              <p className="text-xl font-bold text-gray-900">
                {expert.hourly_rate.toLocaleString('ru')} ₸
              </p>
              <p className="text-xs text-gray-500">/ час</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            Итоговая стоимость обсуждается и фиксируется до начала работы
          </p>
        </div>

        {/* Reviews */}
        <div className="bg-white mt-2 px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 text-sm">
              Отзывы ({expert.reviews.length})
            </h2>
            <StarRating rating={expert.rating} size={12} />
          </div>
          <div className="space-y-3">
            {expert.reviews.map(review => (
              <div key={review.id} className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{review.author}</p>
                    {review.company && (
                      <p className="text-[10px] text-gray-400">{review.company}</p>
                    )}
                  </div>
                  <div className="flex flex-shrink-0">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={10} className={s <= review.rating ? 'star-filled' : 'star-empty'} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{review.comment}</p>
                <p className="text-[10px] text-gray-400 mt-1">{new Date(review.date).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="h-28" />
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white border-t border-gray-200 px-4 py-4">
        <button
          onClick={() => router.push(`/client/deal/new?expert=${expert.id}`)}
          className="w-full bg-halyk text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-bold text-base shadow-lg shadow-halyk/30"
        >
          Начать сделку
        </button>
      </div>
    </div>
  );
}
