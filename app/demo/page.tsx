'use client';
import { useRouter } from 'next/navigation';
import { QrCode } from 'lucide-react';

export default function DemoPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="bg-halyk px-4 pt-12 pb-8 text-center">
        <div className="text-4xl mb-3">⚖️</div>
        <h1 className="text-2xl font-bold text-white">Halyk Pro</h1>
        <p className="text-white/70 text-sm mt-1">Демо-режим</p>
      </div>

      <div className="px-4 py-6 space-y-4">
        <p className="text-center text-sm text-gray-500">Выберите свою роль</p>

        <button
          onClick={() => router.push('/demo/client')}
          className="w-full bg-halyk text-white rounded-2xl p-6 text-left shadow-lg shadow-halyk/20"
        >
          <div className="text-3xl mb-2">🔍</div>
          <p className="font-bold text-xl">Я клиент</p>
          <p className="text-white/70 text-sm mt-1">Опишу задачу и найду специалиста</p>
        </button>

        <button
          onClick={() => router.push('/demo/expert')}
          className="w-full bg-gray-800 text-white rounded-2xl p-6 text-left shadow-lg shadow-black/20"
        >
          <div className="text-3xl mb-2">👔</div>
          <p className="font-bold text-xl">Я специалист</p>
          <p className="text-white/70 text-sm mt-1">Получу запрос и назначу цену</p>
        </button>

        <div className="bg-halyk-light rounded-2xl p-4 mt-2">
          <div className="flex items-center gap-2 mb-2">
            <QrCode size={14} className="text-halyk" />
            <p className="text-xs font-semibold text-halyk-dark">Для демо-дня</p>
          </div>
          <p className="text-xs text-halyk-dark/70 leading-relaxed">
            Один человек открывает эту страницу и выбирает <b>«Я клиент»</b>,
            второй — <b>«Я специалист»</b>. Они автоматически подключаются друг к другу.
          </p>
        </div>
      </div>
    </div>
  );
}
