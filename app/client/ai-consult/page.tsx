'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState, useEffect, useRef } from 'react';
import MobileHeader from '@/components/ui/MobileHeader';
import { CATEGORIES, PROBLEMS, Category } from '@/lib/mock-data';
import { Shield, ChevronRight, Sparkles } from 'lucide-react';

function TypingDots() {
  return (
    <div className="flex gap-1 px-4 py-3 bg-gray-100 rounded-2xl w-fit">
      <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
      <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
      <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
    </div>
  );
}

function AiConsultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const category = searchParams.get('category') as Category || 'lawyer';
  const problemId = searchParams.get('problem') || '';

  const [stage, setStage] = useState<'typing' | 'answered' | 'needs_expert'>('typing');
  const [aiResponse, setAiResponse] = useState<{
    needs_expert: boolean;
    answer: string;
    why_expert?: string;
    disclaimer: string;
  } | null>(null);
  const [customText, setCustomText] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(problemId === 'custom');
  const hasCalledRef = useRef(false);

  const cat = CATEGORIES.find(c => c.id === category);
  const problem = PROBLEMS.find(p => p.id === problemId);

  const callAI = async (description?: string) => {
    if (hasCalledRef.current) return;
    hasCalledRef.current = true;
    setStage('typing');

    try {
      const res = await fetch('/api/ai/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          problemId: problemId !== 'custom' ? problemId : undefined,
          customDescription: description || customText,
        }),
      });
      const data = await res.json();
      setAiResponse(data);
      setStage(data.needs_expert ? 'needs_expert' : 'answered');
    } catch {
      setAiResponse({
        needs_expert: true,
        answer: '',
        why_expert: 'Ваш вопрос требует индивидуального анализа специалистом.',
        disclaimer: 'Не является официальной консультацией.',
      });
      setStage('needs_expert');
    }
  };

  useEffect(() => {
    if (problemId && problemId !== 'custom') {
      // Small delay for animation effect
      const t = setTimeout(() => callAI(), 1200);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToExperts = () => {
    const desc = problem?.title || customText || 'Общий вопрос';
    router.push(`/client/experts?category=${category}&desc=${encodeURIComponent(desc)}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <MobileHeader
        title="AI-анализ"
        subtitle={cat?.label}
        backHref={`/client/problem?category=${category}`}
      />

      <div className="flex-1 flex flex-col px-4 py-4 gap-4">
        {/* User message */}
        {problem && problemId !== 'custom' && (
          <div className="animate-fade-in">
            <div className="text-xs text-gray-400 mb-1.5 text-right">Вы</div>
            <div className="ml-10 bg-halyk text-white rounded-2xl rounded-tr-sm p-3.5">
              <p className="text-sm font-medium">{problem.icon} {problem.title}</p>
              <p className="text-xs text-white/80 mt-0.5">{problem.description}</p>
            </div>
          </div>
        )}

        {/* Custom input */}
        {showCustomInput && stage !== 'typing' && (
          <div className="animate-fade-in">
            <div className="text-xs text-gray-400 mb-1.5 text-right">Вы</div>
            <div className="ml-10 bg-halyk text-white rounded-2xl rounded-tr-sm p-3.5">
              <p className="text-sm">{customText}</p>
            </div>
          </div>
        )}

        {/* AI response */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-6 h-6 bg-halyk rounded-full flex items-center justify-center">
              <Sparkles size={12} className="text-white" />
            </div>
            <span className="text-xs text-gray-400">Halyk Pro AI</span>
          </div>

          {stage === 'typing' && (
            <div className="mr-10">
              <TypingDots />
            </div>
          )}

          {(stage === 'answered' || stage === 'needs_expert') && aiResponse && (
            <div className="mr-10 space-y-3 animate-fade-in">
              {/* Main answer */}
              <div className="bg-white rounded-2xl rounded-tl-sm border border-gray-200 p-4">
                <div className="prose prose-sm text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                  {aiResponse.answer}
                </div>

                {aiResponse.why_expert && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 leading-relaxed">
                      <span className="font-medium text-orange-600">⚠️ Рекомендация: </span>
                      {aiResponse.why_expert}
                    </p>
                  </div>
                )}

                {aiResponse.disclaimer && (
                  <div className="mt-2 flex items-start gap-1.5">
                    <Shield size={11} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-[10px] text-gray-400 leading-relaxed italic">
                      {aiResponse.disclaimer}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Custom input form */}
        {problemId === 'custom' && stage !== 'typing' && !aiResponse && (
          <div className="animate-fade-in">
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Опишите вашу задачу подробно..."
              className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-halyk"
              rows={4}
            />
            <button
              onClick={() => {
                if (!customText.trim()) return;
                setShowCustomInput(true);
                callAI(customText);
              }}
              disabled={!customText.trim()}
              className="mt-2 w-full bg-halyk text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-50"
            >
              Анализировать
            </button>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      {(stage === 'answered' || stage === 'needs_expert') && (
        <div className="px-4 pb-8 pt-3 space-y-2.5 animate-fade-in">
          <button
            onClick={goToExperts}
            className="w-full bg-halyk text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-semibold text-base shadow-lg shadow-halyk/30"
          >
            {stage === 'needs_expert' ? 'Найти специалиста' : 'Показать специалистов'}
            <ChevronRight size={18} />
          </button>

          {stage === 'answered' && (
            <button
              onClick={goToExperts}
              className="w-full bg-white text-halyk rounded-2xl py-3 flex items-center justify-center gap-2 font-medium text-sm border border-halyk/30"
            >
              Всё равно нужен эксперт
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function AiConsultPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-gray-400">Загрузка...</div>}>
      <AiConsultContent />
    </Suspense>
  );
}
