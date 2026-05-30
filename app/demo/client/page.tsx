'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DemoClientRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/halyk-pro'); }, [router]);
  return (
    <div className="flex items-center justify-center min-h-screen bg-halyk">
      <div className="text-center text-white">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Загружаем...</p>
      </div>
    </div>
  );
}
