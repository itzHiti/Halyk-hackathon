'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileHeader from '@/components/ui/MobileHeader';
import { CATEGORIES } from '@/lib/mock-data';
import {
  currentUserId, getCurrentUser, becomeExpert, addExpertDocuments, uploadFile,
  User, ApiError,
} from '@/lib/api';
import { Shield, Upload, X, FileText, CheckCircle, Clock, Loader2, ChevronLeft } from 'lucide-react';

interface PickedFile { file: File; name: string; size: number; }

export default function ExpertVerifyPage() {
  const router = useRouter();
  // Кандидат в эксперты = текущий вошедший пользователь
  const UID = currentUserId();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('lawyer');
  const [specInput, setSpecInput] = useState('');
  const [experience, setExperience] = useState('');
  const [rate, setRate] = useState('');
  const [bio, setBio] = useState('');
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const u = await getCurrentUser(UID);
    setUser(u);
    setName(prev => prev || u.display_name || '');
    setLoading(false);
  };

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...picked.map(f => ({ file: f, name: f.name, size: f.size }))]);
    e.target.value = '';
  };
  const removeFile = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i));
  const fmtSize = (b: number) => (b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} КБ` : `${(b / (1024 * 1024)).toFixed(1)} МБ`);

  const status = user?.expert_status ?? null;
  const canSubmit = name.trim().length >= 2 && files.length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      // 1) Загружаем документы → собираем их URL-ы (BACKEND.md §10)
      const uploaded = await Promise.all(files.map(f => uploadFile(UID, f.file)));
      const documents = uploaded.map(u => u.url);

      // 2) Заявка: новая (become-expert) или догрузка после отклонения (expert-documents)
      if (status === 'rejected') {
        await addExpertDocuments(UID, documents);
      } else {
        const specializations = specInput.split(',').map(s => s.trim()).filter(Boolean);
        await becomeExpert(UID, {
          name: name.trim(),
          category,
          specializations,
          experience_years: parseInt(experience.replace(/\D/g, '')) || 0,
          hourly_rate: parseInt(rate.replace(/\D/g, '')) || 0,
          bio: bio.trim(),
          documents,
        });
      }

      // 3) Обновляем статус из /users/me (станет pending)
      setUser(await getCurrentUser(UID));
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setError('Заявка уже подана и находится на проверке.');
        setUser(await getCurrentUser(UID));
      } else {
        setError('Не удалось отправить заявку. Проверьте, что бэкенд запущен, и попробуйте снова.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const recheck = async () => {
    const u = await getCurrentUser(UID);
    setUser(u);
    if (u.is_verified_expert) router.push('/expert/dashboard');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-3">
        <Loader2 size={26} className="text-halyk animate-spin" />
        <p className="text-gray-400 text-sm">Загружаем...</p>
      </div>
    );
  }

  // Уже верифицированный специалист
  if (user?.is_verified_expert) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <MobileHeader title="Верификация" backHref="/halyk-pro" />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
          <div className="w-20 h-20 bg-halyk-light rounded-full flex items-center justify-center">
            <CheckCircle size={36} className="text-halyk" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg">Вы верифицированный специалист</p>
            <p className="text-sm text-gray-500 mt-1">Доступ к дашборду и приёму заявок открыт.</p>
          </div>
          <button onClick={() => router.push('/expert/dashboard')}
            className="w-full bg-halyk text-white rounded-2xl py-4 font-bold text-base shadow-lg shadow-halyk/30">
            Перейти в дашборд
          </button>
        </div>
      </div>
    );
  }

  // Заявка на проверке
  if (status === 'pending') {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <MobileHeader title="Верификация" backHref="/halyk-pro" />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center">
            <Clock size={34} className="text-orange-500" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg">Заявка на проверке</p>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
              Администратор проверяет ваши документы и квалификацию. После одобрения вы получите статус
              специалиста и доступ к заявкам клиентов.
            </p>
          </div>
          <button onClick={recheck}
            className="w-full bg-halyk text-white rounded-2xl py-4 font-bold text-base shadow-lg shadow-halyk/30">
            Проверить статус
          </button>
          <button onClick={() => router.push('/halyk-pro')} className="text-gray-400 text-sm">На главную</button>
        </div>
      </div>
    );
  }

  // Форма заявки (status null / rejected)
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="bg-halyk px-4 pt-8 pb-5">
        <button onClick={() => router.push('/halyk-pro')}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors mb-3">
          <ChevronLeft size={22} className="text-white" />
        </button>
        <div className="flex items-center gap-2">
          <Shield size={22} className="text-white" />
          <div>
            <p className="text-white font-bold text-lg">Стать специалистом</p>
            <p className="text-white/70 text-xs">Верификация через документы Halyk Pro</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3 pb-28">
        {status === 'rejected' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5">
            <p className="text-xs font-semibold text-red-700">Заявка отклонена</p>
            <p className="text-xs text-red-600 mt-0.5">Догрузите корректные документы — заявка снова уйдёт на проверку.</p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Имя специалиста</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Нурлан Жумабеков" disabled={status === 'rejected'}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-halyk disabled:bg-gray-50 disabled:text-gray-400" />
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1.5">Категория специалиста</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setCategory(c.id)} disabled={status === 'rejected'}
                  className={`py-2.5 rounded-xl text-xs font-medium border transition-colors disabled:opacity-50 ${category === c.id ? 'bg-halyk text-white border-halyk' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Специализации (через запятую)</label>
            <input value={specInput} onChange={e => setSpecInput(e.target.value)} disabled={status === 'rejected'}
              placeholder="Корпоративное право, Договоры, NDA"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-halyk disabled:bg-gray-50" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Опыт (лет)</label>
              <input type="number" inputMode="numeric" value={experience} onChange={e => setExperience(e.target.value)} disabled={status === 'rejected'}
                placeholder="8" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-halyk disabled:bg-gray-50" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Ставка (₸/час)</label>
              <input type="number" inputMode="numeric" value={rate} onChange={e => setRate(e.target.value)} disabled={status === 'rejected'}
                placeholder="25 000" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-halyk disabled:bg-gray-50" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">О себе</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} disabled={status === 'rejected'}
              placeholder="Образование, опыт, ключевые кейсы..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-halyk resize-none disabled:bg-gray-50" />
          </div>
        </div>

        {/* Документы для верификации */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <label className="text-sm font-semibold text-gray-700">Документы</label>
          <p className="text-xs text-gray-400 mb-3">Паспорт/удостоверение, диплом, лицензия адвоката/аудитора</p>

          {files.length > 0 && (
            <div className="space-y-2 mb-3">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-2">
                  <FileText size={16} className="text-halyk flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{f.name}</p>
                    <p className="text-[10px] text-gray-400">{fmtSize(f.size)}</p>
                  </div>
                  <button onClick={() => removeFile(i)} className="text-gray-300 hover:text-gray-500"><X size={14} /></button>
                </div>
              ))}
            </div>
          )}

          <button onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 w-full border border-dashed border-gray-300 rounded-xl py-3 hover:border-halyk hover:bg-halyk-light/30 transition-colors">
            <Upload size={15} className="text-gray-400" />
            <span className="text-sm text-gray-500">Прикрепить документ</span>
          </button>
          <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={onPickFiles} className="hidden" />
        </div>

        {error && <p className="text-xs text-red-600 text-center">{error}</p>}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white border-t border-gray-200 px-4 py-4">
        <button onClick={handleSubmit} disabled={!canSubmit}
          className="w-full bg-halyk text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-bold text-base shadow-lg shadow-halyk/30 disabled:opacity-50">
          {submitting
            ? <><Loader2 size={16} className="animate-spin" />Отправляем...</>
            : status === 'rejected' ? 'Догрузить документы' : 'Отправить на верификацию'}
        </button>
        <p className="text-center text-[10px] text-gray-400 mt-2">
          Имя и хотя бы один документ обязательны. После одобрения админом вы получите статус специалиста.
        </p>
      </div>
    </div>
  );
}
