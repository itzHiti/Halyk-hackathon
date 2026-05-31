'use client';
import { useEffect, useState } from 'react';
import { DEMO_EXPERT } from '@/lib/mock-data';
import MobileHeader from '@/components/ui/MobileHeader';
import StarRating from '@/components/ui/StarRating';
import { currentUserId, getCurrentUser, getExpert, User, ApiExpert } from '@/lib/api';
import { CheckCircle, Shield, Upload, ExternalLink } from 'lucide-react';

export default function ExpertProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ApiExpert | null>(null);

  useEffect(() => {
    const uid = currentUserId();
    getCurrentUser(uid).then(me => {
      setUser(me);
      if (me.expert_id) getExpert(me.expert_id).then(p => { if (p) setProfile(p); }).catch(() => {});
    });
  }, []);

  // Реальный профиль (/experts/{id}) с фолбэком на сид-эксперта (exp-5).
  // reviews оставляем из сид-данных (форма отзывов на бэке иная: {author,rating,text}).
  const expert = {
    ...DEMO_EXPERT,
    name: profile?.name || user?.display_name || DEMO_EXPERT.name,
    bio: profile?.bio || DEMO_EXPERT.bio,
    specializations: profile?.specializations?.length ? profile.specializations : DEMO_EXPERT.specializations,
    hourly_rate: profile?.hourly_rate || DEMO_EXPERT.hourly_rate,
    rating: profile?.rating || DEMO_EXPERT.rating,
    completed_deals: profile?.completed_deals ?? DEMO_EXPERT.completed_deals,
    experience_years: profile?.experience_years ?? DEMO_EXPERT.experience_years,
    cases: profile?.cases?.length ? profile.cases : DEMO_EXPERT.cases,
    avatar: profile?.avatar || DEMO_EXPERT.avatar,
    categoryLabel: profile?.categoryLabel || DEMO_EXPERT.categoryLabel,
    is_verified: profile?.is_verified ?? user?.is_verified_expert ?? DEMO_EXPERT.is_verified,
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <MobileHeader title="Мой профиль" backHref="/expert/dashboard" />

      <div className="flex-1 space-y-3 pb-6">
        {/* Profile header */}
        <div className="bg-white px-4 py-5">
          <div className="flex gap-4 items-center mb-4">
            <div className="relative">
              <img src={expert.avatar} alt={expert.name} className="w-16 h-16 rounded-2xl bg-gray-100" />
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full">
                <CheckCircle size={18} className="text-halyk fill-halyk" />
              </div>
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-lg">{expert.name}</h1>
              <p className="text-sm text-halyk">{expert.categoryLabel}</p>
              <div className="flex items-center gap-1 mt-1">
                <Shield size={11} className="text-halyk" />
                <span className="text-[10px] text-halyk">Верифицирован через Halyk ID</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Рейтинг', value: expert.rating.toString() },
              { label: 'Сделок', value: expert.completed_deals.toString() },
              { label: 'Лет опыта', value: expert.experience_years.toString() },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-2.5 text-center">
                <p className="font-bold text-gray-900 text-base">{value}</p>
                <p className="text-[10px] text-gray-500">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-3">
            <StarRating rating={expert.rating} />
          </div>
        </div>

        {/* Verification status */}
        <div className="bg-white px-4 py-4">
          <h2 className="font-semibold text-gray-900 mb-3 text-sm">Верификация</h2>
          <div className="space-y-2">
            {[
              { label: 'Halyk ID', status: 'verified', desc: 'ИИН подтверждён' },
              { label: 'Диплом юриста', status: 'verified', desc: 'НАО «КазГЮУ», 2014' },
              { label: 'Членство в коллегии адвокатов', status: 'pending', desc: 'Загрузите удостоверение' },
            ].map(({ label, status, desc }) => (
              <div key={label} className="flex items-center gap-3">
                {status === 'verified' ? (
                  <CheckCircle size={16} className="text-halyk flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-orange-400 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
                {status === 'pending' && (
                  <button className="flex items-center gap-1 text-xs text-halyk font-medium">
                    <Upload size={12} />
                    Загрузить
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Specializations */}
        <div className="bg-white px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 text-sm">Специализации</h2>
            <button className="text-xs text-halyk font-medium">Изменить</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {expert.specializations.map(spec => (
              <span key={spec} className="bg-halyk-light text-halyk-dark text-xs font-medium px-3 py-1.5 rounded-full">
                {spec}
              </span>
            ))}
            <button className="border border-dashed border-gray-300 text-gray-400 text-xs px-3 py-1.5 rounded-full">
              + Добавить
            </button>
          </div>
        </div>

        {/* Bio */}
        <div className="bg-white px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-900 text-sm">О себе</h2>
            <button className="text-xs text-halyk font-medium">Изменить</button>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{expert.bio}</p>
        </div>

        {/* Rate */}
        <div className="bg-white px-4 py-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">Ставка</h2>
            <button className="text-xs text-halyk font-medium">Изменить</button>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {expert.hourly_rate.toLocaleString('ru')} ₸
            <span className="text-sm font-normal text-gray-400"> / час</span>
          </p>
        </div>

        {/* Portfolio links */}
        <div className="bg-white px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 text-sm">Портфолио</h2>
            <button className="text-xs text-halyk font-medium">Добавить</button>
          </div>
          <div className="space-y-2">
            {expert.cases.map((c, i) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl">
                <CheckCircle size={13} className="text-halyk mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-600 leading-relaxed flex-1">{c}</p>
                <ExternalLink size={12} className="text-gray-300 flex-shrink-0 mt-0.5" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
