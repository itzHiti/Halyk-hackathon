'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileHeader from '@/components/ui/MobileHeader';
import { LoadingScreen, MessageScreen, MessageAction } from '@/components/ui/StatusScreen';
import {
  currentUserId, getCurrentUser, listExpertApplications, approveExpert, rejectExpert, fileUrl,
  User, ExpertApplication, ApiError,
} from '@/lib/api';
import {
  ShieldCheck, FileText, CheckCircle, XCircle, Loader2, Clock, Briefcase, ExternalLink,
} from 'lucide-react';

type Filter = 'pending' | 'approved' | 'rejected' | 'all';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'pending', label: 'Ожидают' },
  { key: 'approved', label: 'Одобрены' },
  { key: 'rejected', label: 'Отклонены' },
  { key: 'all', label: 'Все' },
];

const STATUS_BADGE: Record<string, { text: string; cls: string }> = {
  pending: { text: 'На рассмотрении', cls: 'bg-orange-100 text-orange-600' },
  approved: { text: 'Одобрен', cls: 'bg-halyk-light text-halyk' },
  rejected: { text: 'Отклонён', cls: 'bg-red-100 text-red-600' },
};

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [access, setAccess] = useState<boolean | null>(null);

  const [filter, setFilter] = useState<Filter>('pending');
  const [apps, setApps] = useState<ExpertApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // ── Доступ: только роль admin ───────────────────────────────────────────────
  useEffect(() => {
    getCurrentUser(currentUserId()).then(me => {
      setUser(me);
      setAccess(me.role === 'admin');
    });
  }, []);

  // ── Загрузка заявок ─────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listExpertApplications(currentUserId(), filter === 'all' ? undefined : filter);
      setApps(data);
    } catch (e) {
      setApps([]);
      if (e instanceof ApiError && e.status === 403) setError('Недостаточно прав. Войдите как администратор.');
      else setError('Не удалось загрузить заявки. Проверьте доступность сервера.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (access) load();
  }, [access, load]);

  const doApprove = async (app: ExpertApplication) => {
    setBusyId(app.id);
    try {
      await approveExpert(currentUserId(), app.id);
      await load();
    } catch {
      setError('Не удалось одобрить заявку.');
    } finally {
      setBusyId(null);
    }
  };

  const doReject = async (app: ExpertApplication) => {
    setBusyId(app.id);
    try {
      await rejectExpert(currentUserId(), app.id, rejectReason.trim() || undefined);
      setRejectingId(null);
      setRejectReason('');
      await load();
    } catch {
      setError('Не удалось отклонить заявку.');
    } finally {
      setBusyId(null);
    }
  };

  // ── Гейтинг доступа ───────────────────────────────────────────────────────
  if (access === null) return <LoadingScreen text="Проверяем доступ..." />;

  if (!access) {
    return (
      <MessageScreen
        icon={<ShieldCheck size={32} className="text-orange-500" />}
        title="Только для администраторов"
        description={<>Войдите как администратор (например <span className="font-medium">admin@halyk.kz</span>), чтобы проверять заявки экспертов.</>}
        action={<MessageAction label="На экран входа" onClick={() => router.push('/halyk-pro')} />}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <MobileHeader title="Проверка экспертов" subtitle={user?.display_name || user?.id} backHref="/halyk-pro" />

      {/* Filter tabs */}
      <div className="bg-white border-b border-gray-100 px-4 py-2.5">
        <div className="flex gap-1.5">
          {FILTERS.map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filter === key ? 'bg-halyk text-white' : 'bg-gray-100 text-gray-600'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600">{error}</div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Loader2 size={22} className="text-halyk animate-spin" />
            <p className="text-sm text-gray-400">Загружаем заявки...</p>
          </div>
        ) : apps.length === 0 && !error ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <p className="text-2xl mb-2">📭</p>
            <p className="text-sm text-gray-500 font-medium">
              {filter === 'pending' ? 'Нет заявок на рассмотрении' : 'Заявок нет'}
            </p>
          </div>
        ) : (
          apps.map(app => {
            const badge = STATUS_BADGE[app.verification_status] || { text: app.verification_status, cls: 'bg-gray-100 text-gray-500' };
            return (
              <div key={app.id} className="bg-white rounded-2xl border border-gray-200 p-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{app.name}</p>
                    <p className="text-xs text-halyk">{app.category_label || app.category}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">user_id: {app.user_id}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${badge.cls}`}>{badge.text}</span>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 mb-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Briefcase size={11} className="text-gray-400" />{app.experience_years} лет</span>
                  <span className="flex items-center gap-1"><Clock size={11} className="text-gray-400" />{app.hourly_rate.toLocaleString('ru')} ₸/час</span>
                </div>

                {app.bio && <p className="text-xs text-gray-600 leading-relaxed mb-2 line-clamp-3">{app.bio}</p>}

                {app.specializations?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {app.specializations.map(s => (
                      <span key={s} className="text-[10px] bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{s}</span>
                    ))}
                  </div>
                )}

                {/* Documents */}
                <div className="mb-3">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Документы</p>
                  {app.documents?.length > 0 ? (
                    <div className="space-y-1.5">
                      {app.documents.map((doc, i) => {
                        const name = doc.split('/').pop() || `Документ ${i + 1}`;
                        return (
                          <a key={i} href={fileUrl(doc)} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 hover:bg-halyk-light/40 transition-colors">
                            <FileText size={14} className="text-halyk flex-shrink-0" />
                            <span className="text-xs text-gray-700 truncate flex-1">{name}</span>
                            <ExternalLink size={12} className="text-gray-300 flex-shrink-0" />
                          </a>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">Документы не приложены</p>
                  )}
                </div>

                {app.verification_note && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-3">
                    <p className="text-[10px] text-red-500 font-semibold">Причина отклонения</p>
                    <p className="text-xs text-red-600">{app.verification_note}</p>
                  </div>
                )}

                {/* Reject reason input */}
                {rejectingId === app.id && (
                  <div className="mb-3">
                    <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                      placeholder="Причина отклонения (необязательно)" rows={2}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-halyk resize-none" />
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {app.verification_status !== 'approved' && (
                    <button onClick={() => doApprove(app)} disabled={busyId === app.id}
                      className="flex-1 bg-halyk text-white rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60">
                      {busyId === app.id && rejectingId !== app.id
                        ? <Loader2 size={12} className="animate-spin" />
                        : <CheckCircle size={13} />}
                      Одобрить
                    </button>
                  )}

                  {app.verification_status !== 'rejected' && (
                    rejectingId === app.id ? (
                      <button onClick={() => doReject(app)} disabled={busyId === app.id}
                        className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60">
                        {busyId === app.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={13} />}
                        Подтвердить отказ
                      </button>
                    ) : (
                      <button onClick={() => { setRejectingId(app.id); setRejectReason(''); }} disabled={busyId === app.id}
                        className="flex-1 bg-gray-100 text-gray-600 rounded-xl py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-60">
                        <XCircle size={13} />Отклонить
                      </button>
                    )
                  )}

                  {rejectingId === app.id && (
                    <button onClick={() => { setRejectingId(null); setRejectReason(''); }}
                      className="px-3 bg-gray-100 text-gray-500 rounded-xl py-2.5 text-xs font-medium">
                      Отмена
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
