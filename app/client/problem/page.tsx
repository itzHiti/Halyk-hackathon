'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import MobileHeader from '@/components/ui/MobileHeader';
import { CATEGORIES, PROBLEMS, Category } from '@/lib/mock-data';
import { ArrowRight } from 'lucide-react';

function ProblemList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const category = searchParams.get('category') as Category || 'accountant';

  const cat = CATEGORIES.find(c => c.id === category);
  const problems = PROBLEMS.filter(p => p.category === category);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <MobileHeader
        title="Ваша задача"
        subtitle={cat?.label}
        backHref="/client/category"
      />

      <div className="px-4 py-5">
        <p className="text-sm text-gray-500 mb-4">
          Выберите наиболее близкую к вашей ситуации:
        </p>

        <div className="flex flex-col gap-2.5">
          {problems.map((problem) => (
            <button
              key={problem.id}
              onClick={() => router.push(`/client/ai-consult?category=${category}&problem=${problem.id}`)}
              className="w-full text-left bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3 active:scale-98 transition-transform hover:border-halyk hover:shadow-sm"
            >
              <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">
                {problem.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">{problem.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{problem.description}</p>
                {problem.ai_can_answer && (
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium text-halyk bg-halyk-light px-2 py-0.5 rounded-full">
                    ✨ AI может ответить сразу
                  </span>
                )}
              </div>
              <ArrowRight size={16} className="text-gray-300 flex-shrink-0" />
            </button>
          ))}

          {/* Custom request */}
          <button
            onClick={() => router.push(`/client/ai-consult?category=${category}&problem=custom`)}
            className="w-full text-left bg-halyk-light rounded-2xl border border-halyk/20 p-4 flex items-center gap-3 active:scale-98 transition-transform"
          >
            <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-xl flex-shrink-0">
              ✍️
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-halyk-dark text-sm">Другой запрос</h3>
              <p className="text-xs text-halyk/70 mt-0.5">Опишите задачу своими словами</p>
            </div>
            <ArrowRight size={16} className="text-halyk flex-shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProblemPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="text-gray-400">Загрузка...</div></div>}>
      <ProblemList />
    </Suspense>
  );
}
