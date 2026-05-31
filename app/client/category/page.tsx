'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import MobileHeader from '@/components/ui/MobileHeader';
import { CATEGORIES } from '@/lib/mock-data';
import { listCategories, listExperts } from '@/lib/api';
import { ArrowRight, Users } from 'lucide-react';

// Презентация (эмодзи + цвет фона) берётся из локальной карты по id категории —
// бэкенд отдаёт icon как имя (например "scale") и color как hex, что не вписывается
// в текущую визуальную сетку. Текст (label/description) и счётчики — реальные.
const PRESENTATION = Object.fromEntries(
  CATEGORIES.map(c => [c.id, { icon: c.icon, color: c.color }]),
) as Record<string, { icon: string; color: string }>;

interface CatRow { id: string; label: string; description: string }

export default function CategoryPage() {
  const [cats, setCats] = useState<CatRow[]>(
    CATEGORIES.map(c => ({ id: c.id, label: c.label, description: c.description })),
  );
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    listCategories()
      .then(real => { if (real.length) setCats(real.map(c => ({ id: c.id, label: c.label, description: c.description }))); })
      .catch(() => { /* бэкенд недоступен — остаются моки */ });

    listExperts()
      .then(experts => {
        const map: Record<string, number> = {};
        experts.forEach(e => { map[e.category] = (map[e.category] || 0) + 1; });
        setCounts(map);
      })
      .catch(() => { /* счётчик скрываем при недоступности */ });
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <MobileHeader title="Выберите специалиста" backHref="/halyk-pro" />

      <div className="px-4 py-5">
        <p className="text-sm text-gray-500 mb-5 leading-relaxed">
          Опишите вашу задачу — AI поможет подобрать лучшего специалиста
        </p>

        <div className="flex flex-col gap-3">
          {cats.map((cat) => {
            const pres = PRESENTATION[cat.id] || { icon: '📁', color: 'bg-gray-50' };
            const count = counts[cat.id];
            return (
              <Link key={cat.id} href={`/client/problem?category=${cat.id}`}>
                <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4 active:scale-98 transition-transform hover:border-halyk hover:shadow-sm">
                  <div className={`w-14 h-14 rounded-2xl ${pres.color} flex items-center justify-center text-2xl flex-shrink-0`}>
                    {pres.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-base">{cat.label}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>
                    {count !== undefined && count > 0 && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <Users size={11} className="text-halyk" />
                        <span className="text-xs text-halyk font-medium">
                          {count} {count === 1 ? 'специалист' : 'специалистов'} доступно
                        </span>
                      </div>
                    )}
                  </div>
                  <ArrowRight size={18} className="text-gray-300 flex-shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick tip */}
        <div className="mt-5 bg-halyk-light rounded-xl p-3.5 flex gap-2">
          <span className="text-lg flex-shrink-0">💡</span>
          <p className="text-xs text-halyk-dark leading-relaxed">
            <span className="font-semibold">Не знаете к кому обратиться?</span> AI-ассистент поможет определить нужного специалиста после описания вашей задачи.
          </p>
        </div>
      </div>
    </div>
  );
}
