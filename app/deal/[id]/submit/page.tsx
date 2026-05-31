'use client';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';
import { getDeal, sendMessage, currentUserId } from '@/lib/api';
import { DEMO_EXPERT } from '@/lib/mock-data';
import { ChevronLeft, Paperclip, X, FileText, Image, CheckCircle, Send } from 'lucide-react';

interface UploadedFile { name: string; size: number; type: string; }

function SubmitContent() {
  const { id: roomCode } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const role = searchParams.get('role') || 'expert';

  const [report, setReport] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selected.map(f => ({ name: f.name, size: f.size, type: f.type }))]);
    e.target.value = '';
  };

  const removeFile = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i));
  const formatSize = (b: number) => b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} КБ` : `${(b / (1024 * 1024)).toFixed(1)} МБ`;

  const handleSubmit = async () => {
    if (!report.trim()) return;
    setIsSubmitting(true);

    // Load deal to get id
    const deal = await getDeal(roomCode, currentUserId());

    if (deal) {
      const fileNames = files.map(f => f.name);
      const filesNote = fileNames.length > 0 ? `\n\n📎 Прикреплённые файлы: ${fileNames.join(', ')}` : '';
      const content = `📋 *Работа выполнена*\n\n${report}${filesNote}`;

      await sendMessage(deal.id, {
        sender_role: 'expert',
        sender_name: DEMO_EXPERT.name,
        content,
      }, currentUserId());
    }

    setIsSubmitting(false);
    setDone(true);
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white px-6 text-center">
        <div className="w-20 h-20 bg-halyk-light rounded-full flex items-center justify-center mb-5">
          <CheckCircle size={36} className="text-halyk" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Работа сдана!</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          Клиент получит уведомление и подтвердит результат. После подтверждения деньги будут переведены вам.
        </p>
        <div className="w-full bg-halyk-light rounded-2xl p-4 mb-6 text-left space-y-2">
          <div className="flex items-center gap-2 text-sm text-halyk-dark">
            <CheckCircle size={14} className="text-halyk flex-shrink-0" />
            <span>Отчёт отправлен клиенту</span>
          </div>
          {files.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-halyk-dark">
              <Paperclip size={14} className="text-halyk flex-shrink-0" />
              <span>{files.length} файл(ов) прикреплено</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-orange-600">
            <span className="text-base">⏳</span>
            <span>Ожидаем подтверждения клиента</span>
          </div>
        </div>
        <button
          onClick={() => router.push(`/deal/${roomCode}?role=expert`)}
          className="w-full bg-halyk text-white rounded-2xl py-4 font-bold text-base shadow-lg shadow-halyk/30"
        >
          Перейти в чат
        </button>
        <button
          onClick={() => router.push('/expert/dashboard')}
          className="w-full text-gray-400 text-sm py-3 mt-1"
        >
          На дашборд
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-halyk px-4 pt-8 pb-5">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-white/70 text-sm mb-3">
          <ChevronLeft size={16} />Назад
        </button>
        <p className="text-white font-bold text-lg">Сдать работу</p>
        <p className="text-white/70 text-xs mt-0.5">Опишите результат и прикрепите файлы</p>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3 pb-32">
        {/* Instructions */}
        <div className="bg-halyk-light rounded-2xl p-4 space-y-2">
          {[
            'Подробно опишите что вы сделали',
            'Прикрепите итоговые документы и файлы',
            'Клиент проверит и подтвердит выполнение',
            'После подтверждения деньги переведутся вам',
          ].map((t, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-halyk flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] text-white font-bold">{i + 1}</span>
              </div>
              <p className="text-xs text-halyk-dark leading-relaxed">{t}</p>
            </div>
          ))}
        </div>

        {/* Report textarea */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <label className="text-sm font-semibold text-gray-700 block mb-1">Отчёт о выполненной работе</label>
          <p className="text-xs text-gray-400 mb-2">Опишите что именно было сделано, какие документы подготовлены, какие шаги предприняты</p>
          <textarea
            value={report}
            onChange={e => setReport(e.target.value)}
            placeholder="Например: подготовил полный пакет документов для регистрации ТОО, включая устав, протокол учредителей и заявление. Проверил все данные, отправил в ЦОН. Срок регистрации — 3 рабочих дня..."
            className="w-full text-sm text-gray-700 placeholder:text-gray-300 resize-none focus:outline-none"
            rows={7}
            autoFocus
          />
        </div>

        {/* File upload */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-semibold text-gray-700">Итоговые файлы</label>
            <span className="text-xs text-gray-400">необязательно</span>
          </div>
          <p className="text-xs text-gray-400 mb-3">Договоры, отчёты, справки, сканы документов</p>

          {files.length > 0 && (
            <div className="space-y-2 mb-3">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-2">
                  {f.type.startsWith('image/') ? (
                    <Image size={16} className="text-blue-400 flex-shrink-0" />
                  ) : (
                    <FileText size={16} className="text-halyk flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{f.name}</p>
                    <p className="text-[10px] text-gray-400">{formatSize(f.size)}</p>
                  </div>
                  <button onClick={() => removeFile(i)} className="text-gray-300 hover:text-gray-500">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="flex items-center justify-center gap-2 w-full border border-dashed border-gray-300 rounded-xl py-3 cursor-pointer hover:border-halyk hover:bg-halyk-light/30 transition-colors">
            <Paperclip size={15} className="text-gray-400" />
            <span className="text-sm text-gray-500">Прикрепить файл</span>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white border-t border-gray-200 px-4 py-4">
        <button
          onClick={handleSubmit}
          disabled={!report.trim() || isSubmitting}
          className="w-full bg-halyk text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-bold text-base shadow-lg shadow-halyk/30 disabled:opacity-50"
        >
          {isSubmitting ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Отправляем...</>
          ) : (
            <><Send size={17} />Отправить результат клиенту</>
          )}
        </button>
        <p className="text-center text-[10px] text-gray-400 mt-2">
          Клиент получит уведомление и подтвердит выполнение
        </p>
      </div>
    </div>
  );
}

export default function SubmitWorkPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-gray-400">Загрузка...</div>}>
      <SubmitContent />
    </Suspense>
  );
}
