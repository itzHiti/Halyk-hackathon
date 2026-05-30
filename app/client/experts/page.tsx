'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import MobileHeader from '@/components/ui/MobileHeader';
import ExpertCard from '@/components/ExpertCard';
import { EXPERTS, CATEGORIES, Category } from '@/lib/mock-data';
import { SlidersHorizontal } from 'lucide-react';

function ExpertListContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get('category') as Category || 'lawyer';
  const desc = searchParams.get('desc') || '';
  const allCategories = searchParams.get('allCategories') === 'true';

  const [sortBy, setSortBy] = useState<'rating' | 'price'>('rating');

  const cat = CATEGORIES.find(c => c.id === category);
  const categoryExperts = allCategories ? EXPERTS : EXPERTS.filter(e => e.category === category);

  const getSortedExperts = () => {
    if (sortBy === 'price') return [...categoryExperts].sort((a, b) => a.hourly_rate - b.hourly_rate);
    return [...categoryExperts].sort((a, b) => b.rating - a.rating);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <MobileHeader
        title="Специалисты"
        subtitle={allCategories ? 'По вашему запросу' : cat?.label}
        backHref="/client/category"
      />

      <div className="px-4 py-4">
        {/* Context banner */}
        {desc && (
          <div className="bg-halyk-light rounded-xl p-3 mb-4">
            <p className="text-xs font-semibold text-halyk-dark mb-0.5">Ваш запрос</p>
            <p className="text-xs text-halyk-dark/70 line-clamp-2">{desc}</p>
          </div>
        )}

        {/* Sort tabs */}
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal size={14} className="text-gray-400 flex-shrink-0" />
          <div className="flex gap-1.5">
            {[
              { key: 'rating', label: '⭐ Рейтинг' },
              { key: 'price', label: '💰 Цена' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSortBy(key as 'rating' | 'price')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  sortBy === key
                    ? 'bg-halyk text-white'
                    : 'bg-white border border-gray-200 text-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {getSortedExperts().map(expert => (
            <ExpertCard key={expert.id} expert={expert} />
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4 pb-4">
          {categoryExperts.length} {allCategories ? 'специалистов по запросу' : `специалиста в категории ${cat?.label}`}
        </p>
      </div>
    </div>
  );
}

export default function ExpertsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-gray-400">Загрузка...</div>}>
      <ExpertListContent />
    </Suspense>
  );
}
