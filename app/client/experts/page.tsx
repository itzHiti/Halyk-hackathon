'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import MobileHeader from '@/components/ui/MobileHeader';
import ExpertCard from '@/components/ExpertCard';
import { EXPERTS, CATEGORIES, Category } from '@/lib/mock-data';
import { SlidersHorizontal, Sparkles } from 'lucide-react';

interface RankedExpert {
  id: string;
  score: number;
  reason: string;
}

function ExpertListContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get('category') as Category || 'lawyer';
  const desc = searchParams.get('desc') || '';

  const [rankedExperts, setRankedExperts] = useState<RankedExpert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'ai' | 'rating' | 'price'>('ai');

  const cat = CATEGORIES.find(c => c.id === category);
  const categoryExperts = EXPERTS.filter(e => e.category === category);

  useEffect(() => {
    const fetchRanking = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/ai/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category, problemDescription: desc || `Помощь по категории: ${cat?.label}` }),
        });
        const data = await res.json();
        if (data.ranked && data.ranked.length > 0) {
          setRankedExperts(data.ranked);
        } else {
          // Fallback ranking
          setRankedExperts(categoryExperts.map((e, i) => ({
            id: e.id,
            score: 90 - i * 5,
            reason: `${e.experience_years} лет опыта, рейтинг ${e.rating}`,
          })));
        }
      } catch {
        setRankedExperts(categoryExperts.map((e, i) => ({
          id: e.id,
          score: 90 - i * 5,
          reason: `${e.experience_years} лет опыта, рейтинг ${e.rating}`,
        })));
      } finally {
        setIsLoading(false);
      }
    };
    fetchRanking();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, desc]);

  const getSortedExperts = () => {
    if (sortBy === 'ai') {
      return [...categoryExperts].sort((a, b) => {
        const aRank = rankedExperts.find(r => r.id === a.id)?.score || 0;
        const bRank = rankedExperts.find(r => r.id === b.id)?.score || 0;
        return bRank - aRank;
      });
    }
    if (sortBy === 'rating') return [...categoryExperts].sort((a, b) => b.rating - a.rating);
    if (sortBy === 'price') return [...categoryExperts].sort((a, b) => a.hourly_rate - b.hourly_rate);
    return categoryExperts;
  };

  const sortedExperts = getSortedExperts();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <MobileHeader
        title="Специалисты"
        subtitle={cat?.label}
        backHref={`/client/category`}
      />

      <div className="px-4 py-4">
        {/* AI context banner */}
        {desc && (
          <div className="bg-halyk-light rounded-xl p-3 flex gap-2 mb-4">
            <Sparkles size={14} className="text-halyk mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-halyk-dark">AI-матчинг активен</p>
              <p className="text-xs text-halyk-dark/70 mt-0.5 line-clamp-2">{desc}</p>
            </div>
          </div>
        )}

        {/* Sort tabs */}
        <div className="flex gap-2 mb-4">
          <SlidersHorizontal size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="flex gap-1.5 overflow-x-auto">
            {[
              { key: 'ai', label: '✨ AI рейтинг' },
              { key: 'rating', label: '⭐ Рейтинг' },
              { key: 'price', label: '💰 Цена' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSortBy(key as 'ai' | 'rating' | 'price')}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
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

        {/* Loading state */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-14 h-14 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32" />
                    <div className="h-3 bg-gray-100 rounded w-20" />
                    <div className="h-3 bg-gray-100 rounded w-40" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedExperts.map((expert, index) => {
              const aiData = rankedExperts.find(r => r.id === expert.id);
              return (
                <ExpertCard
                  key={expert.id}
                  expert={expert}
                  isTopPick={sortBy === 'ai' && index === 0}
                  aiReason={sortBy === 'ai' ? aiData?.reason : undefined}
                />
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-4 pb-4">
          {categoryExperts.length} специалиста в категории {cat?.label}
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
