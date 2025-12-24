'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Key, 
  Download, 
  Trash2, 
  Trophy,
  Target,
  Flame,
  Star
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/Loading';
import { useAuthStore } from '@/lib/store';
import { calculateLevel, getPointsForNextLevel } from '@/lib/quiz';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface UserStats {
  totalQuizzes: number;
  averageScore: number;
  bestScore: number;
  currentStreak: number;
  totalPoints: number;
  level: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, userId, logout } = useAuthStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/user/stats?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch user stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [isAuthenticated, userId, router]);

  const handleExportData = async () => {
    try {
      const response = await fetch(`/api/user/stats?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prepjs-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <LoadingSpinner size="lg" className="text-blue-500" />
        </div>
      </div>
    );
  }

  const userStats = stats || {
    totalQuizzes: 0,
    averageScore: 0,
    bestScore: 0,
    currentStreak: 0,
    totalPoints: 0,
    level: 1,
  };

  const level = calculateLevel(userStats.totalPoints);
  const pointsToNextLevel = getPointsForNextLevel(userStats.totalPoints);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Profile
        </h1>

        {/* User Card */}
        <Card className="mb-8">
          <CardContent className="flex flex-col md:flex-row items-center gap-6 py-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <User className="h-12 w-12 text-white" />
            </div>
            <div className="text-center md:text-left flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                JavaScript Learner
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Level {level} • {userStats.totalPoints} points
              </p>
              <div className="mt-4 max-w-md">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span>Progress to Level {level + 1}</span>
                  <span>{pointsToNextLevel} points needed</span>
                </div>
                <ProgressBar
                  value={userStats.totalPoints}
                  max={userStats.totalPoints + pointsToNextLevel}
                  color="blue"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="text-center py-6">
              <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {userStats.totalQuizzes}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Quizzes Taken
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-6">
              <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {userStats.bestScore}/10
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Best Score
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-6">
              <Star className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {userStats.averageScore}/10
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Average Score
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-6">
              <Flame className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {userStats.currentStreak}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Day Streak
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="mb-3 sm:mb-0">
                <div className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-blue-500" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    Export Data
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Download your quiz history as JSON
                </p>
              </div>
              <Button variant="outline" onClick={handleExportData}>
                Export
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="mb-3 sm:mb-0">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    Logout
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Sign out of your account
                </p>
              </div>
              <Button variant="secondary" onClick={handleLogout}>
                Logout
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="mb-3 sm:mb-0">
                <div className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-red-500" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    Reset Progress
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Delete all quiz history and start fresh
                </p>
              </div>
              <Button variant="danger" onClick={() => setShowResetConfirm(true)}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reset Confirmation Modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <CardContent className="py-6">
                <div className="text-center">
                  <div className="text-6xl mb-4">⚠️</div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Reset All Progress?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    This will permanently delete all your quiz history, achievements, and statistics. This action cannot be undone.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => setShowResetConfirm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => {
                        // In a real app, this would call an API to reset data
                        setShowResetConfirm(false);
                        alert('This feature would reset your progress in a production environment.');
                      }}
                    >
                      Yes, Reset Everything
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
