'use client';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState, useRef, useEffect } from 'react';
import { getExpertById } from '@/lib/mock-data';
import { Lock, Send, Shield, Info, CheckCircle, Paperclip } from 'lucide-react';

interface Message {
  id: string;
  sender: 'client' | 'expert';
  content: string;
  time: string;
}

const INITIAL_MESSAGES: Message[] = [
  { id: '1', sender: 'expert', content: 'Добрый день! Я получил ваш запрос. Расскажите подробнее о вашей задаче — что именно нужно сделать?', time: '14:32' },
  { id: '2', sender: 'client', content: 'Здравствуйте! Мне нужна помощь, детали отправил в описании задачи.', time: '14:35' },
  { id: '3', sender: 'expert', content: 'Понял, уже изучаю. Подготовлю для вас детальный план работы в течение часа. Деньги в эскроу я вижу — можем приступать! ✅', time: '14:38' },
];

function ChatContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const expertId = searchParams.get('expert') || 'exp-5';
  const expert = getExpertById(expertId);

  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [newMessage, setNewMessage] = useState('');
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const msg: Message = {
      id: Date.now().toString(),
      sender: 'client',
      content: newMessage,
      time: new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, msg]);
    setNewMessage('');

    // Simulate expert reply
    setTimeout(() => {
      const replies = [
        'Хорошо, принял к сведению. Продолжаю работу над вашим запросом.',
        'Спасибо за информацию. Если потребуются дополнительные документы — сообщу.',
        'Понял. Готовлю результат, скоро пришлю на проверку.',
        'Всё сделаю в лучшем виде! Если есть вопросы — задавайте.',
      ];
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'expert',
        content: replies[Math.floor(Math.random() * replies.length)],
        time: new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, reply]);
    }, 1500);
  };

  if (!expert) return null;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Chat header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-500">
            ‹
          </button>
          <img src={expert.avatar} alt={expert.name} className="w-9 h-9 rounded-full bg-gray-100" />
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-sm">{expert.name}</p>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <p className="text-[10px] text-green-600">Онлайн</p>
            </div>
          </div>
          <button
            onClick={() => router.push(`/deal/${id}/complete?expert=${expertId}`)}
            className="bg-halyk text-white text-xs font-semibold px-3 py-1.5 rounded-full"
          >
            Release Payment
          </button>
        </div>
      </div>

      {/* Escrow status banner */}
      <div className="bg-halyk-light border-b border-halyk/20 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Lock size={13} className="text-halyk flex-shrink-0" />
          <span className="text-xs font-semibold text-halyk-dark flex-1">
            Деньги в эскроу · 60 000 ₸
          </span>
          <span className="text-[10px] bg-halyk text-white px-2 py-0.5 rounded-full font-medium">
            В работе
          </span>
        </div>
      </div>

      {/* Privacy banner */}
      {showInfoBanner && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-2.5">
          <div className="flex items-start gap-2">
            <Info size={13} className="text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-blue-700 leading-relaxed flex-1">
              Переписка в рамках сделки может быть использована Halyk Bank для разрешения споров. Это защищает обе стороны.
            </p>
            <button onClick={() => setShowInfoBanner(false)} className="text-blue-400 text-xs ml-1">✕</button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`max-w-[80%] ${msg.sender === 'client' ? 'order-2' : 'order-1'}`}>
              <div className={`rounded-2xl px-3.5 py-2.5 ${
                msg.sender === 'client'
                  ? 'bg-halyk text-white rounded-tr-sm'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
              }`}>
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
              <p className={`text-[10px] text-gray-400 mt-0.5 ${msg.sender === 'client' ? 'text-right' : 'text-left'}`}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Deal completion prompt */}
      <div className="bg-white border-t border-gray-100 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <CheckCircle size={13} className="text-halyk flex-shrink-0" />
          <p className="text-xs text-gray-500 flex-1">
            Специалист завершил работу? Нажмите{' '}
            <button
              onClick={() => router.push(`/deal/${id}/complete?expert=${expertId}`)}
              className="font-semibold text-halyk underline"
            >
              Release Payment
            </button>
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-3 py-3">
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100">
            <Paperclip size={16} className="text-gray-400" />
          </button>
          <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2.5">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Написать сообщение..."
              className="flex-1 bg-transparent text-sm focus:outline-none text-gray-700 placeholder:text-gray-400"
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-halyk disabled:opacity-40"
          >
            <Send size={15} className="text-white" />
          </button>
        </div>
        <div className="flex items-center gap-1 mt-1.5 justify-center">
          <Shield size={10} className="text-gray-300" />
          <p className="text-[9px] text-gray-300">Переписка защищена · Halyk Bank</p>
        </div>
      </div>
    </div>
  );
}

export default function DealChatPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-gray-400">Загрузка...</div>}>
      <ChatContent />
    </Suspense>
  );
}
