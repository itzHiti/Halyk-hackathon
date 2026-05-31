'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/api';

export default function DemoExpertRedirect() {
  const router = useRouter();
  useEffect(() => {
    login('exp-5', 'expert123').finally(() => router.replace('/expert/dashboard'));
  }, [router]);
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-800">
      <div className="text-center text-white">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Входим как специалист...</p>
      </div>
    </div>
  );
}
