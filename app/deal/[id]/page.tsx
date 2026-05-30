'use client';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState, useRef, useEffect, useCallback } from 'react';
import { getExpertById } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';
import { Lock, Send, Shield, Info, CheckCircle, Clock, Paperclip, ChevronLeft, Loader2 } from 'lucide-react';

const DEMO_EXPERT = getExpertById('exp-5')!;
const COMMISSION_PCT = 5;

interface Deal {
  id: string;
  room_code: string;
  client_name: string;
  expert_name: string | null;
  description: string | null;
  status: 'pending' | 'claimed' | 'offered' | 'active' | 'completed' | 'cancelled';
  offer_price: number | null;
  offer_deadline: string | null;
  offer_comment: string | null;
  commission_pct: number;
  created_at: string;
}

interface Message {
  id: string;
  deal_id: string;
  sender_role: 'client' | 'expert';
  sender_name: string;
  content: string;
  created_at: string;
}

function DealContent() {
  const params = useParams<{ id: string }>();
  const roomCode = params.id;
  const searchParams = useSearchParams();
  const router = useRouter();
  const role = (searchParams.get('role') || 'client') as 'client' | 'expert';

  const [deal, setDeal] = useState<Deal | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');

  // Expert offer form
  const [offerPrice, setOfferPrice] = useState('');
  const [offerDeadline, setOfferDeadline] = useState('');
  const [offerComment, setOfferComment] = useState('');
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);

  // Client accepting
  const [isAccepting, setIsAccepting] = useState(false);
  const [showInfoBanner, setShowInfoBanner] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Load deal ──────────────────────────────────────────────────────────────
  const loadDeal = useCallback(async () => {
    const { data } = await supabase.from('deals').select('*').eq('room_code', roomCode).single();
    if (data) setDeal(data as Deal);
    setLoading(false);
  }, [roomCode]);

  // ── Load messages ──────────────────────────────────────────────────────────
  const loadMessages = useCallback(async (dealId: string) => {
    const { data } = await supabase.from('messages').select('*').eq('deal_id', dealId).order('created_at', { ascending: true });
    if (data) setMessages(data as Message[]);
  }, []);

  // ── Deal realtime subscription ─────────────────────────────────────────────
  useEffect(() => {
    loadDeal();
    const ch = supabase.channel('deal-watch-' + roomCode)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'deals', filter: `room_code=eq.${roomCode}` },
        (payload) => setDeal(payload.new as Deal))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [roomCode, loadDeal]);

  // ── Messages realtime subscription ────────────────────────────────────────
  useEffect(() => {
    if (!deal?.id) return;
    loadMessages(deal.id);
    const ch = supabase.channel('messages-' + deal.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `deal_id=eq.${deal.id}` },
        (payload) => setMessages(prev => {
          const msg = payload.new as Message;
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [deal?.id, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Expert submits offer ───────────────────────────────────────────────────
  const submitOffer = async () => {
    if (!deal || !offerPrice || !offerDeadline) return;
    setIsSubmittingOffer(true);
    const price = parseInt(offerPrice.replace(/\D/g, ''));
    const commission = Math.round(price * COMMISSION_PCT / 100);
    await supabase.from('deals').update({
      status: 'offered',
      expert_name: DEMO_EXPERT.name,
      offer_price: price,
      offer_deadline: offerDeadline,
      offer_comment: offerComment || 'Изучил задачу — готов приступить к работе.',
      commission: commission,
      commission_pct: COMMISSION_PCT,
      escrow_amount: price,
    }).eq('id', deal.id);
    setIsSubmittingOffer(false);
  };

  // ── Client accepts offer ───────────────────────────────────────────────────
  const acceptOffer = async () => {
    if (!deal) return;
    setIsAccepting(true);
    await new Promise(r => setTimeout(r, 1500));
    await supabase.from('deals').update({ status: 'active' }).eq('id', deal.id);
    setIsAccepting(false);
  };

  // ── Client declines offer ──────────────────────────────────────────────────
  const declineOffer = async () => {
    if (!deal) return;
    await supabase.from('deals').update({ status: 'cancelled' }).eq('id', deal.id);
    router.push('/halyk-pro');
  };

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!newMessage.trim() || !deal) return;
    const content = newMessage.trim();
    setNewMessage('');
    await supabase.from('messages').insert({
      deal_id: deal.id,
      sender_role: role,
      sender_name: role === 'client' ? (deal.client_name || 'Клиент') : (deal.expert_name || DEMO_EXPERT.name),
      content,
    });
  };

  // ── Complete deal ──────────────────────────────────────────────────────────
  const completeDeal = async () => {
    if (!deal) return;
    await supabase.from('deals').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', deal.id);
    router.push('/deal/' + roomCode + '/complete?role=' + role);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-3">
        <Loader2 size={28} className="text-halyk animate-spin" />
        <p className="text-gray-400 text-sm">Загружаем сделку...</p>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-3 px-6 text-center">
        <p className="text-2xl">🔍</p>
        <p className="font-semibold text-gray-700">Сделка не найдена</p>
        <p className="text-sm text-gray-400">Проверьте ссылку или начните заново</p>
        <button onClick={() => router.push('/halyk-pro')} className="mt-2 bg-halyk text-white rounded-xl px-5 py-2.5 text-sm font-medium">На главную</button>
      </div>
    );
  }

  const { status } = deal;

  // ═══════════════════════════════════════════════════════════════════════════
  // CLIENT — Waiting for offer
  // ═══════════════════════════════════════════════════════════════════════════
  if (role === 'client' && (status === 'pending' || status === 'claimed')) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.push('/halyk-pro')} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <ChevronLeft size={20} className="text-gray-500" />
          </button>
          <p className="font-semibold text-gray-900">Запрос отправлен</p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-5">
          <div className="w-20 h-20 rounded-full bg-halyk-light flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-halyk border-t-transparent rounded-full animate-spin" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg">Ждём специалиста</p>
            <p className="text-sm text-gray-500 mt-1">Ваш запрос виден всем доступным специалистам.<br />Первый кто откликнется — свяжется с вами.</p>
          </div>
          {deal.description && (
            <div className="w-full bg-white rounded-2xl border border-gray-200 p-4 text-left">
              <p className="text-xs text-gray-400 mb-1.5">Ваш запрос</p>
              <p className="text-sm text-gray-700 leading-relaxed">{deal.description}</p>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-halyk text-xs">
            <div className="w-1.5 h-1.5 bg-halyk rounded-full animate-pulse" />
            {status === 'claimed' ? 'Специалист изучает заявку...' : 'Ожидаем первого отклика...'}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CLIENT — Review expert's offer
  // ═══════════════════════════════════════════════════════════════════════════
  if (role === 'client' && status === 'offered') {
    const price = deal.offer_price || 0;
    const commissionPct = deal.commission_pct || COMMISSION_PCT;
    const commission = Math.round(price * commissionPct / 100);
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <img src={DEMO_EXPERT.avatar} alt={DEMO_EXPERT.name} className="w-9 h-9 rounded-full bg-gray-100" />
          <div>
            <p className="font-semibold text-gray-900 text-sm">{deal.expert_name || DEMO_EXPERT.name}</p>
            <p className="text-[10px] text-halyk">прислал предложение</p>
          </div>
        </div>
        <div className="flex-1 px-4 py-4 space-y-3 pb-36">
          <div className="bg-halyk-light rounded-2xl p-4 flex gap-3">
            <CheckCircle size={20} className="text-halyk flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-halyk-dark">Специалист откликнулся!</p>
              <p className="text-xs text-halyk-dark/70 mt-0.5">Изучите предложение и примите решение</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <img src={DEMO_EXPERT.avatar} alt={DEMO_EXPERT.name} className="w-10 h-10 rounded-xl bg-gray-100" />
              <div>
                <p className="text-sm font-semibold text-gray-900">{deal.expert_name || DEMO_EXPERT.name}</p>
                <p className="text-xs text-gray-400">{DEMO_EXPERT.categoryLabel}</p>
              </div>
            </div>
            {deal.offer_comment && (
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-3">{deal.offer_comment}</p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-halyk-light rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-halyk-dark">{price.toLocaleString('ru')} ₸</p>
                <p className="text-[10px] text-halyk-dark/70">Стоимость работы</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-gray-800">{deal.offer_deadline}</p>
                <p className="text-[10px] text-gray-500">Срок выполнения</p>
              </div>
            </div>
            <div className="border border-gray-100 rounded-xl p-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Специалисту</span>
                <span>{(price - commission).toLocaleString('ru')} ₸</span>
              </div>
              <div className="flex justify-between text-orange-600">
                <span>Комиссия платформы ({commissionPct}%)</span>
                <span>{commission.toLocaleString('ru')} ₸</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 pt-1.5">
                <span>Итого в эскроу</span>
                <span>{price.toLocaleString('ru')} ₸</span>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3.5 flex gap-2.5">
            <span className="text-base flex-shrink-0">⚠️</span>
            <div>
              <p className="text-xs font-semibold text-orange-800 mb-0.5">Комиссия невозвратна</p>
              <p className="text-xs text-orange-700 leading-relaxed">
                После принятия оффера комиссия ({commissionPct}%) списывается в любом случае — это защита от обхода платформы.
              </p>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white border-t border-gray-200 px-4 py-4 space-y-2">
          <button onClick={acceptOffer} disabled={isAccepting}
            className="w-full bg-halyk text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-bold text-base shadow-lg shadow-halyk/30 disabled:opacity-70">
            {isAccepting
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Отправляем в эскроу...</>
              : <><Lock size={17} />Принять и оплатить {price.toLocaleString('ru')} ₸</>}
          </button>
          <p className="text-center text-[10px] text-orange-500 font-medium">
            Комиссия {commissionPct}% ({commission.toLocaleString('ru')} ₸) списывается при любом исходе
          </p>
          <button onClick={declineOffer} className="w-full text-gray-500 text-sm py-1">Отклонить предложение</button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPERT — Fill in offer form
  // ═══════════════════════════════════════════════════════════════════════════
  if (role === 'expert' && (status === 'claimed' || status === 'pending')) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <div className="bg-halyk px-4 pt-8 pb-4">
          <button onClick={() => router.push('/expert/dashboard')} className="flex items-center gap-1 text-white/70 text-sm mb-3">
            <ChevronLeft size={16} />Назад
          </button>
          <p className="text-white font-bold text-lg">Новый запрос</p>
          <p className="text-white/70 text-xs mt-0.5">Изучите задачу и отправьте предложение</p>
        </div>
        <div className="flex-1 px-4 py-4 space-y-3 pb-8">
          {/* Client request */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-sm">👤</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{deal.client_name || 'Клиент'}</p>
              <span className="ml-auto bg-red-100 text-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full">НОВЫЙ</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-3">
              {deal.description || 'Описание не указано'}
            </p>
          </div>

          {/* Offer form */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-900">Ваше предложение</p>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Стоимость работы (₸)</label>
              <input type="number" value={offerPrice} onChange={e => setOfferPrice(e.target.value)}
                placeholder="50 000" inputMode="numeric"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-halyk" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Срок выполнения</label>
              <div className="grid grid-cols-3 gap-2">
                {['1 день', '3 дня', '1 неделя', '2 недели', '1 месяц', 'По договору'].map(d => (
                  <button key={d} onClick={() => setOfferDeadline(d)}
                    className={`py-2 rounded-xl text-xs font-medium border transition-colors ${offerDeadline === d ? 'bg-halyk text-white border-halyk' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Комментарий (необязательно)</label>
              <textarea value={offerComment} onChange={e => setOfferComment(e.target.value)}
                placeholder="Опишите как будете решать задачу..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-halyk resize-none" rows={3} />
            </div>
            {offerPrice && (
              <div className="bg-halyk-light rounded-xl p-3 text-xs space-y-1">
                <div className="flex justify-between text-halyk-dark/70">
                  <span>Вы получите</span>
                  <span className="font-semibold">{Math.round(parseInt(offerPrice || '0') * (1 - COMMISSION_PCT / 100)).toLocaleString('ru')} ₸</span>
                </div>
                <div className="flex justify-between text-orange-600">
                  <span>Комиссия платформы ({COMMISSION_PCT}%)</span>
                  <span>{Math.round(parseInt(offerPrice || '0') * COMMISSION_PCT / 100).toLocaleString('ru')} ₸</span>
                </div>
              </div>
            )}
          </div>

          <button onClick={submitOffer} disabled={!offerPrice || !offerDeadline || isSubmittingOffer}
            className="w-full bg-halyk text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-bold text-base shadow-lg shadow-halyk/30 disabled:opacity-50">
            {isSubmittingOffer
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Отправляем...</>
              : 'Отправить предложение клиенту'}
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPERT — Waiting for client to accept
  // ═══════════════════════════════════════════════════════════════════════════
  if (role === 'expert' && status === 'offered') {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <div className="bg-halyk px-4 pt-8 pb-5">
          <p className="text-white font-bold text-lg">Предложение отправлено</p>
          <p className="text-white/70 text-xs mt-0.5">{deal.client_name || 'Клиент'} принимает решение</p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-5">
          <div className="w-20 h-20 rounded-full bg-halyk-light flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-halyk border-t-transparent rounded-full animate-spin" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg">Ждём клиента</p>
            <p className="text-sm text-gray-500 mt-1">Клиент изучает ваше предложение и примет решение</p>
          </div>
          <div className="w-full bg-white rounded-2xl border border-gray-200 p-4 text-left space-y-2">
            <p className="text-xs text-gray-400">Ваше предложение</p>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Стоимость</span>
              <span className="text-sm font-bold text-halyk-dark">{(deal.offer_price || 0).toLocaleString('ru')} ₸</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Срок</span>
              <span className="text-sm font-medium text-gray-800">{deal.offer_deadline}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-halyk text-xs">
            <div className="w-1.5 h-1.5 bg-halyk rounded-full animate-pulse" />
            Страница обновится автоматически
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAT (both roles, status = active)
  // ═══════════════════════════════════════════════════════════════════════════
  if (status === 'active' || status === 'completed') {
    const escrow = deal.offer_price || 0;
    const partnerName = role === 'client'
      ? (deal.expert_name || DEMO_EXPERT.name)
      : (deal.client_name || 'Клиент');

    return (
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push(role === 'expert' ? '/expert/dashboard' : '/halyk-pro')} className="text-gray-500">
              <ChevronLeft size={20} />
            </button>
            {role === 'client'
              ? <img src={DEMO_EXPERT.avatar} alt={partnerName} className="w-9 h-9 rounded-full bg-gray-100" />
              : <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center"><span className="text-sm">👤</span></div>
            }
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">{partnerName}</p>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <p className="text-[10px] text-green-600">Онлайн</p>
              </div>
            </div>
            {status === 'active' && role === 'client' && (
              <button onClick={completeDeal} className="bg-halyk text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                Завершить
              </button>
            )}
          </div>
        </div>

        {/* Escrow banner */}
        <div className="bg-halyk-light border-b border-halyk/20 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Lock size={13} className="text-halyk flex-shrink-0" />
            <span className="text-xs font-semibold text-halyk-dark flex-1">
              {escrow.toLocaleString('ru')} ₸ в эскроу
            </span>
            <span className="text-[10px] bg-halyk text-white px-2 py-0.5 rounded-full font-medium">
              {status === 'completed' ? 'Завершено' : 'В работе'}
            </span>
          </div>
        </div>

        {/* Privacy banner */}
        {showInfoBanner && (
          <div className="bg-blue-50 border-b border-blue-100 px-4 py-2.5">
            <div className="flex items-start gap-2">
              <Info size={13} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-blue-700 flex-1">
                Переписка защищена и может быть использована Halyk Bank для разрешения споров.
              </p>
              <button onClick={() => setShowInfoBanner(false)} className="text-blue-400 text-xs ml-1">✕</button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-2">
              <p className="text-2xl">💬</p>
              <p className="text-sm text-gray-500">Сделка начата! Можете общаться.</p>
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.sender_role === role;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[80%]">
                  <div className={`rounded-2xl px-3.5 py-2.5 ${isMe ? 'bg-halyk text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'}`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                  <p className={`text-[10px] text-gray-400 mt-0.5 ${isMe ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Complete prompt for client */}
        {status === 'active' && role === 'client' && (
          <div className="bg-white border-t border-gray-100 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle size={13} className="text-halyk flex-shrink-0" />
              <p className="text-xs text-gray-500 flex-1">
                Работа выполнена?{' '}
                <button onClick={completeDeal} className="font-semibold text-halyk underline">
                  Подтвердить и оплатить специалисту
                </button>
              </p>
            </div>
          </div>
        )}

        {/* Input */}
        {status === 'active' && (
          <div className="bg-white border-t border-gray-200 px-3 py-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2.5">
                <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Написать сообщение..." autoFocus
                  className="flex-1 bg-transparent text-sm focus:outline-none text-gray-700 placeholder:text-gray-400" />
              </div>
              <button onClick={sendMessage} disabled={!newMessage.trim()}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-halyk disabled:opacity-40">
                <Send size={15} className="text-white" />
              </button>
            </div>
            <div className="flex items-center gap-1 mt-1.5 justify-center">
              <Shield size={10} className="text-gray-300" />
              <p className="text-[9px] text-gray-300">Переписка защищена · Halyk Bank</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Cancelled
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-3 px-6 text-center">
      <p className="text-3xl">🚫</p>
      <p className="font-semibold text-gray-700">Сделка отменена</p>
      <button onClick={() => router.push('/halyk-pro')} className="mt-2 bg-halyk text-white rounded-xl px-5 py-2.5 text-sm font-medium">На главную</button>
    </div>
  );
}

export default function DealPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-gray-400"><Loader2 size={24} className="animate-spin" /></div>}>
      <DealContent />
    </Suspense>
  );
}
