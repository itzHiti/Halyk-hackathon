'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import MobileHeader from '@/components/ui/MobileHeader';
import { LoadingScreen, MessageScreen, MessageAction } from '@/components/ui/StatusScreen';
import { getExpertById } from '@/lib/mock-data';
import { Shield, CheckCircle, Paperclip, X, FileText, Image } from 'lucide-react';
import { createDeal, currentUserId, getExpert, rememberDeal } from '@/lib/api';

interface UploadedFile { name: string; size: number; type: string; }
interface DealExpert { id: string; name: string; avatar: string; categoryLabel: string; hourly_rate: number }

function NewDealContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const expertId = searchParams.get('expert') || 'exp-5';

  const [expert, setExpert] = useState<DealExpert | null>(null);
  const [loadingExpert, setLoadingExpert] = useState(true);
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let e: DealExpert | null = null;
      try {
        const real = await getExpert(expertId);
        if (real) e = { id: real.id, name: real.name, avatar: real.avatar, categoryLabel: real.categoryLabel, hourly_rate: real.hourly_rate };
      } catch { /* бэкенд недоступен */ }
      if (!e) {
        const m = getExpertById(expertId);
        if (m) e = { id: m.id, name: m.name, avatar: m.avatar, categoryLabel: m.categoryLabel, hourly_rate: m.hourly_rate };
      }
      if (!cancelled) { setExpert(e); setLoadingExpert(false); }
    })();
    return () => { cancelled = true; };
  }, [expertId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selected.map(f => ({ name: f.name, size: f.size, type: f.type }))]);
    e.target.value = '';
  };

  const removeFile = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i));
  const formatSize = (b: number) => b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} КБ` : `${(b / (1024 * 1024)).toFixed(1)} МБ`;

  const handleSend = async () => {
    if (!description.trim()) return;
    setIsProcessing(true);

    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const uid = currentUserId();
    try {
      const deal = await createDeal({ room_code: roomCode, description, client_name: 'Клиент' }, uid);
      rememberDeal(uid, deal.room_code);
      router.push(`/deal/${deal.room_code}?role=client`);
    } catch {
      // Fallback if backend not reachable
      router.push(`/deal/demo-deal-1?role=client`);
    }
    setIsProcessing(false);
  };

  if (loadingExpert) return <LoadingScreen text="Загружаем специалиста..." />;

  if (!expert) {
    return (
      <MessageScreen
        icon={<p className="text-2xl">🔍</p>}
        title="Специалист не найден"
        action={<MessageAction label="К выбору специалиста" onClick={() => router.push('/client/category')} />}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <MobileHeader title="Новый запрос" backHref={`/client/experts/${expertId}`} />
      <div className="flex-1 px-4 py-4 space-y-3">
        {/* Expert */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex gap-3 items-center">
          <img src={expert.avatar} alt={expert.name} className="w-12 h-12 rounded-xl bg-gray-100" />
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{expert.name}</p>
            <p className="text-xs text-halyk">{expert.categoryLabel}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-900">{expert.hourly_rate.toLocaleString('ru')} ₸</p>
            <p className="text-[10px] text-gray-400">/ час</p>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <label className="text-sm font-semibold text-gray-700 block mb-1">Опишите задачу</label>
          <p className="text-xs text-gray-400 mb-2">Чем подробнее — тем точнее специалист оценит стоимость и сроки</p>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Что нужно сделать, какие есть детали, сроки..."
            className="w-full text-sm text-gray-700 placeholder:text-gray-300 resize-none focus:outline-none" rows={5} autoFocus />
        </div>

        {/* Files */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-semibold text-gray-700">Документы</label>
            <span className="text-xs text-gray-400">необязательно</span>
          </div>
          <p className="text-xs text-gray-400 mb-3">Договоры, акты, выписки и другие файлы</p>
          {files.length > 0 && (
            <div className="space-y-2 mb-3">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-2">
                  {f.type.startsWith('image/') ? <Image size={16} className="text-blue-400 flex-shrink-0" /> : <FileText size={16} className="text-halyk flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{f.name}</p>
                    <p className="text-[10px] text-gray-400">{formatSize(f.size)}</p>
                  </div>
                  <button onClick={() => removeFile(i)} className="text-gray-300 hover:text-gray-500"><X size={14} /></button>
                </div>
              ))}
            </div>
          )}
          <label className="flex items-center justify-center gap-2 w-full border border-dashed border-gray-300 rounded-xl py-3 cursor-pointer hover:border-halyk hover:bg-halyk-light/30 transition-colors">
            <Paperclip size={15} className="text-gray-400" />
            <span className="text-sm text-gray-500">Прикрепить файл</span>
            <input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" onChange={handleFileChange} className="hidden" />
          </label>
        </div>

        {/* How it works */}
        <div className="bg-halyk-light rounded-2xl p-4 space-y-2.5">
          <h3 className="text-sm font-semibold text-halyk-dark">Как это работает</h3>
          {[
            'Вы отправляете запрос — специалист получает его',
            'Специалист изучает и отвечает с ценой и сроками',
            'Вы принимаете оффер и оплачиваете в эскроу',
            'После выполнения подтверждаете — деньги разблокируются',
          ].map((t, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-halyk flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] text-white font-bold">{i + 1}</span>
              </div>
              <p className="text-xs text-halyk-dark leading-relaxed">{t}</p>
            </div>
          ))}
        </div>

        {/* Guarantees */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <Shield size={14} className="text-halyk" /> Защита Halyk Pro
          </h3>
          {['Деньги в эскроу у Halyk Bank, не у специалиста', 'Оплата только после вашего подтверждения', 'Специалист верифицирован через Halyk ID'].map((g, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle size={12} className="text-halyk mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-600">{g}</p>
            </div>
          ))}
        </div>
        <div className="h-24" />
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white border-t border-gray-200 px-4 py-4">
        <button onClick={handleSend} disabled={!description.trim() || isProcessing}
          className="w-full bg-halyk text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-bold text-base shadow-lg shadow-halyk/30 disabled:opacity-50">
          {isProcessing ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Отправляем...</> : 'Отправить запрос специалисту'}
        </button>
        <p className="text-center text-[10px] text-gray-400 mt-2">Специалист ответит с ценой — вы ничего не платите сейчас</p>
      </div>
    </div>
  );
}

export default function NewDealPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-gray-400">Загрузка...</div>}>
      <NewDealContent />
    </Suspense>
  );
}
