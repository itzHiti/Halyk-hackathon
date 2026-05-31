'use client';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

/** Полноэкранный индикатор загрузки (единый стиль на всех страницах). */
export function LoadingScreen({ text = 'Загружаем...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-3">
      <Loader2 size={26} className="text-halyk animate-spin" />
      <p className="text-gray-400 text-sm">{text}</p>
    </div>
  );
}

/** Полноэкранное информационное состояние: иконка/эмодзи + заголовок + текст + действие. */
export function MessageScreen({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-3 px-6 text-center">
      {icon}
      <p className="font-semibold text-gray-800">{title}</p>
      {description && <p className="text-sm text-gray-400">{description}</p>}
      {action}
    </div>
  );
}

/** Кнопка-действие для MessageScreen (единый стиль). */
export function MessageAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="mt-2 bg-halyk text-white rounded-xl px-5 py-2.5 text-sm font-medium">
      {label}
    </button>
  );
}
