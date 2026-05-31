'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState, useEffect, useRef } from 'react';
import MobileHeader from '@/components/ui/MobileHeader';
import { CATEGORIES, PROBLEMS, Category } from '@/lib/mock-data';
import { Send, Sparkles, Users } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { aiConsult, currentUserId } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function TypingDots() {
  return (
    <div className="flex gap-1 px-4 py-3 bg-white border border-gray-100 rounded-2xl rounded-tl-sm w-fit shadow-sm">
      <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
      <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
      <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
    </div>
  );
}

function AiChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const category = searchParams.get('category') as Category || 'lawyer';
  const problemId = searchParams.get('problem') || '';

  const problem = PROBLEMS.find(p => p.id === problemId);
  const cat = CATEGORIES.find(c => c.id === category);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestExpert, setSuggestExpert] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(problemId === 'custom');
  const [customDraft, setCustomDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initializedRef = useRef(false);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const sendMessage = async (userText: string, history: Message[] = messages) => {
    const newMessages: Message[] = [...history, { role: 'user', content: userText }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const data = await aiConsult({
        messages: newMessages,
        category,
        problemId: problemId !== 'custom' ? problemId : undefined,
      }, currentUserId());
      const aiMessage: Message = { role: 'assistant', content: data.message || '' };
      setMessages([...newMessages, aiMessage]);
      if (data.suggest_expert) setSuggestExpert(true);
    } catch {
      setMessages([...newMessages, {
        role: 'assistant',
        content: 'Произошла ошибка. Попробуйте ещё раз или обратитесь к специалисту.',
      }]);
      setSuggestExpert(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-start chat for known problems
  useEffect(() => {
    if (initializedRef.current || problemId === 'custom' || !problemId) return;
    initializedRef.current = true;

    const firstMsg = problem
      ? `${problem.icon} ${problem.title}\n${problem.description}`
      : 'Здравствуйте, мне нужна помощь';

    setTimeout(() => sendMessage(firstMsg, []), 400);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const goToExperts = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    const desc = lastUserMsg?.content || problem?.title || customDraft || 'Общий вопрос';
    const base = `/client/experts?desc=${encodeURIComponent(desc)}`;
    const url = problemId === 'custom'
      ? `${base}&allCategories=true`
      : `${base}&category=${category}`;
    router.push(url);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <MobileHeader
        title="Halyk Pro AI"
        subtitle={cat?.label}
        backHref={`/client/problem?category=${category}`}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Intro bubble from AI */}
        {messages.length === 0 && !showCustomInput && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-6 h-6 bg-halyk rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles size={12} className="text-white" />
              </div>
              <span className="text-xs text-gray-400">Halyk Pro AI</span>
            </div>
            <div className="mr-10">
              <TypingDots />
            </div>
          </div>
        )}

        {/* Custom input — initial state */}
        {showCustomInput && messages.length === 0 && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-6 h-6 bg-halyk rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles size={12} className="text-white" />
              </div>
              <span className="text-xs text-gray-400">Halyk Pro AI</span>
            </div>
            <div className="mr-10 bg-white border border-gray-100 rounded-2xl rounded-tl-sm p-3.5 shadow-sm">
              <p className="text-sm text-gray-700">Здравствуйте! Опишите вашу ситуацию — я постараюсь помочь, а если понадоблюсь, подберём подходящего специалиста.</p>
            </div>
          </div>
        )}

        {/* Chat messages */}
        {messages.map((msg, i) => (
          <div key={i} className={`animate-fade-in ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-6 h-6 bg-halyk rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles size={12} className="text-white" />
                </div>
                <span className="text-xs text-gray-400">Halyk Pro AI</span>
              </div>
            )}
            <div
              className={`text-sm leading-relaxed rounded-2xl p-3.5 max-w-[85%] ${
                msg.role === 'user'
                  ? 'bg-halyk text-white rounded-tr-sm ml-10'
                  : 'bg-white border border-gray-100 shadow-sm rounded-tl-sm mr-10 text-gray-800'
              }`}
            >
              {msg.role === 'user' ? (
                <span className="whitespace-pre-line">{msg.content}</span>
              ) : (
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                    em: ({ children }) => <em className="italic text-gray-400">{children}</em>,
                    ul: ({ children }) => <ul className="list-disc pl-4 space-y-0.5 mb-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-4 space-y-0.5 mb-2">{children}</ol>,
                    li: ({ children }) => <li>{children}</li>,
                    table: ({ children }) => <div className="overflow-x-auto mb-2"><table className="text-xs border-collapse w-full">{children}</table></div>,
                    th: ({ children }) => <th className="border border-gray-200 px-2 py-1 bg-gray-50 font-medium text-left">{children}</th>,
                    td: ({ children }) => <td className="border border-gray-200 px-2 py-1">{children}</td>,
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-6 h-6 bg-halyk rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles size={12} className="text-white" />
              </div>
              <span className="text-xs text-gray-400">Halyk Pro AI</span>
            </div>
            <div className="mr-10">
              <TypingDots />
            </div>
          </div>
        )}

        {/* Expert suggestion banner */}
        {suggestExpert && !isLoading && (
          <div className="animate-fade-in bg-halyk-light border border-halyk/20 rounded-2xl p-4">
            <p className="text-sm font-semibold text-halyk-dark mb-1">Рекомендую специалиста</p>
            <p className="text-xs text-halyk-dark/70 mb-3">Ваша ситуация требует работы с документами. Я подберу подходящего эксперта на основе вашего запроса.</p>
            <button
              onClick={goToExperts}
              className="w-full bg-halyk text-white rounded-xl py-2.5 text-sm font-semibold"
            >
              Найти специалиста
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="bg-white border-t border-gray-100 px-4 pt-3 pb-4 safe-bottom space-y-2">
        <button
          onClick={goToExperts}
          className="w-full flex items-center justify-center gap-2 bg-halyk text-white rounded-2xl py-3 text-sm font-semibold shadow-lg shadow-halyk/20"
        >
          <Users size={16} />
          Перейти к экспертам
        </button>
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              if (showCustomInput && messages.length === 0) {
                setCustomDraft(e.target.value);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Напишите сообщение..."
            rows={1}
            className="flex-1 resize-none border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-halyk max-h-28 overflow-y-auto"
            style={{ lineHeight: '1.4' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 bg-halyk rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity"
          >
            <Send size={16} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AiConsultPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-gray-400">Загрузка...</div>}>
      <AiChatContent />
    </Suspense>
  );
}
