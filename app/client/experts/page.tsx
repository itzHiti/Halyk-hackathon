'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import MobileHeader from '@/components/ui/MobileHeader';
import ExpertCard, { ExpertCardData } from '@/components/ExpertCard';
import { EXPERTS, CATEGORIES, Category } from '@/lib/mock-data';
import { listExperts, aiMatch, currentUserId } from '@/lib/api';
import { SlidersHorizontal, Sparkles, Loader2 } from 'lucide-react';

type ListExpert = ExpertCardData & { category: string };
type RankInfo = { score: number; reason: string };

function ExpertListContent() {
  const searchParams = useSearchParams();
  const category = (searchParams.get('category') as Category) || 'lawyer';
  const desc = searchParams.get('desc') || '';
  const allCategories = searchParams.get('allCategories') === 'true';

  const cat = CATEGORIES.find(c => c.id === category);

  const [experts, setExperts] = useState<ListExpert[]>([]);
  const [loading, setLoading] = useState(true);
  const [ranks, setRanks] = useState<Record<string, RankInfo>>({});
  const [matching, setMatching] = useState(false);
  const [sortBy, setSortBy] = useState<'ai' | 'rating' | 'price'>(desc ? 'ai' : 'rating');

  // ── Загрузка экспертов (реальный бэкенд, фолбэк на моки) ───────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      let list: ListExpert[] = [];
      try {
        const real = await listExperts(allCategories ? undefined : category);
        list = real as ListExpert[];
      } catch {
        /* бэкенд недоступен */
      }
      if (!list.length) {
        const mock = allCategories ? EXPERTS : EXPERTS.filter(e => e.category === category);
        list = mock as unknown as ListExpert[];
      }
      if (!cancelled) { setExperts(list); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [category, allCategories]);

  // ── AI-подбор (POST /ai/match): ранжирование и обоснование ─────────────────
  useEffect(() => {
    if (!desc) return;
    let cancelled = false;
    setMatching(true);
    aiMatch({ category, problemDescription: desc, allCategories }, currentUserId())
      .then(res => {
        if (cancelled) return;
        const map: Record<string, RankInfo> = {};
        res.ranked.forEach(r => { map[r.id] = { score: r.score, reason: r.reason }; });
        setRanks(map);
      })
      .catch(() => { /* подбор недоступен — покажем обычную сортировку */ })
      .finally(() => { if (!cancelled) setMatching(false); });
    return () => { cancelled = true; };
  }, [desc, category, allCategories]);

  const hasRanks = Object.keys(ranks).length > 0;

  const sorted = (() => {
    const arr = [...experts];
    if (sortBy === 'price') return arr.sort((a, b) => a.hourly_rate - b.hourly_rate);
    if (sortBy === 'ai' && hasRanks) {
      return arr.sort((a, b) => {
        const sa = ranks[a.id]?.score ?? -1;
        const sb = ranks[b.id]?.score ?? -1;
        if (sb !== sa) return sb - sa;
        return b.rating - a.rating;
      });
    }
    return arr.sort((a, b) => b.rating - a.rating);
  })();

  const topPickId = sortBy === 'ai' && hasRanks ? sorted[0]?.id : undefined;

  const tabs: { key: 'ai' | 'rating' | 'price'; label: string }[] = [
    ...(hasRanks ? [{ key: 'ai' as const, label: '✨ AI-подбор' }] : []),
    { key: 'rating', label: '⭐ Рейтинг' },
    { key: 'price', label: '💰 Цена' },
  ];

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

        {/* AI matching status */}
        {desc && (matching || hasRanks) && (
          <div className="flex items-center gap-2 mb-3 text-xs">
            {matching ? (
              <><Loader2 size={13} className="text-halyk animate-spin" /><span className="text-gray-500">AI подбирает специалистов под вашу задачу...</span></>
            ) : (
              <><Sparkles size={13} className="text-halyk" /><span className="text-halyk-dark font-medium">AI отсортировал специалистов по соответствию запросу</span></>
            )}
          </div>
        )}

        {/* Sort tabs */}
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal size={14} className="text-gray-400 flex-shrink-0" />
          <div className="flex gap-1.5 flex-wrap">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  sortBy === key ? 'bg-halyk text-white' : 'bg-white border border-gray-200 text-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Loader2 size={22} className="text-halyk animate-spin" />
            <p className="text-sm text-gray-400">Загружаем специалистов...</p>
          </div>
        ) : sorted.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <p className="text-2xl mb-2">🔍</p>
            <p className="text-sm text-gray-500 font-medium">В этой категории пока нет специалистов</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {sorted.map(expert => (
                <ExpertCard
                  key={expert.id}
                  expert={expert}
                  aiReason={ranks[expert.id]?.reason}
                  isTopPick={expert.id === topPickId}
                />
              ))}
            </div>

            <p className="text-center text-xs text-gray-400 mt-4 pb-4">
              {sorted.length} {allCategories ? 'специалистов по запросу' : `в категории ${cat?.label}`}
            </p>
          </>
        )}
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
