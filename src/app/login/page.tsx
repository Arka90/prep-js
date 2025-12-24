'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/lib/store';

export default function LoginPage() {
  const [accessKey, setAccessKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setAuthenticated } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      setAuthenticated(true, data.user.id);
      router.push('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🧠</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              PrepJS
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              JavaScript Interview Quiz App
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="password"
              label="Access Key"
              placeholder="Enter your access key..."
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
              error={error}
              autoFocus
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              Enter
            </Button>
          </form>

          {/* Help Text */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This is a single-user application.
              <br />
              Contact the administrator for access.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="text-2xl mb-2">📝</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              AI-Generated Quizzes
            </p>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="text-2xl mb-2">📊</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Detailed Analytics
            </p>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="text-2xl mb-2">🏆</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Achievements
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
