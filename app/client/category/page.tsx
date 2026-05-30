'use client';
import Link from 'next/link';
import MobileHeader from '@/components/ui/MobileHeader';
import { CATEGORIES } from '@/lib/mock-data';
import { ArrowRight, Users } from 'lucide-react';

const EXPERT_COUNTS: Record<string, number> = {
  accountant: 3,
  tax: 2,
  lawyer: 3,
  advocate: 2,
};

export default function CategoryPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <MobileHeader title="Выберите специалиста" backHref="/halyk-pro" />

      <div className="px-4 py-5">
        <p className="text-sm text-gray-500 mb-5 leading-relaxed">
          Опишите вашу задачу — AI поможет подобрать лучшего специалиста
        </p>

        <div className="flex flex-col gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/client/problem?category=${cat.id}`}
            >
              <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4 active:scale-98 transition-transform hover:border-halyk hover:shadow-sm">
                <div className={`w-14 h-14 rounded-2xl ${cat.color} flex items-center justify-center text-2xl flex-shrink-0`}>
                  {cat.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-base">{cat.label}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Users size={11} className="text-halyk" />
                    <span className="text-xs text-halyk font-medium">
                      {EXPERT_COUNTS[cat.id]} специалиста доступны
                    </span>
                  </div>
                </div>
                <ArrowRight size={18} className="text-gray-300 flex-shrink-0" />
              </div>
            </Link>
          ))}
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
