'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-bounce">🧠</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          PrepJS
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Loading...
        </p>
      </div>
    </div>
  );
}
