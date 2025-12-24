'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  TrendingDown,
  Trophy,
  Target,
  Flame,
  Award
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { LoadingSpinner } from '@/components/ui/Loading';
import { useAuthStore } from '@/lib/store';
import { ACHIEVEMENTS, AchievementInfo, Achievement } from '@/types';

interface AnalyticsData {
  stats: {
    totalQuizzes: number;
    averageScore: number;
    bestScore: number;
    currentStreak: number;
    totalPoints: number;
    level: number;
    weakestTopic: string | null;
    strongestTopic: string | null;
  };
  scoreHistory: {
    date: string;
    score: number;
  }[];
  topicStats: {
    topic: string;
    totalAttempts: number;
    correctAttempts: number;
    accuracy: number;
  }[];
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated, userId } = useAuthStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [statsResponse, achievementsResponse] = await Promise.all([
          fetch(`/api/user/stats?userId=${userId}`),
          fetch(`/api/user/achievements?userId=${userId}`),
        ]);

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setData(statsData);
        }

        if (achievementsResponse.ok) {
          const achievementsData = await achievementsResponse.json();
          setAchievements(achievementsData.achievements);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, userId, router]);

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

  const stats = data?.stats || {
    totalQuizzes: 0,
    averageScore: 0,
    bestScore: 0,
    currentStreak: 0,
    totalPoints: 0,
    level: 1,
    weakestTopic: null,
    strongestTopic: null,
  };

  // Format score history for chart
  const chartData = data?.scoreHistory?.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: item.score,
  })) || [];

  // Sort topic stats by accuracy for bar chart
  const topicChartData = [...(data?.topicStats || [])].sort((a, b) => b.accuracy - a.accuracy);

  // Get unlocked achievement info
  const unlockedAchievementTypes = achievements.map(a => a.achievement_type);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Analytics
        </h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Quizzes"
            value={stats.totalQuizzes}
            icon={Target}
          />
          <StatCard
            title="Average Score"
            value={`${stats.averageScore}/10`}
            icon={TrendingUp}
          />
          <StatCard
            title="Best Score"
            value={`${stats.bestScore}/10`}
            icon={Trophy}
          />
          <StatCard
            title="Current Streak"
            value={`${stats.currentStreak} days`}
            icon={Flame}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Score Over Time Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9CA3AF"
                      fontSize={12}
                    />
                    <YAxis 
                      domain={[0, 10]} 
                      stroke="#9CA3AF"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: 'none',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#3B82F6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                  Complete more quizzes to see your progress
                </div>
              )}
            </CardContent>
          </Card>

          {/* Topic Accuracy Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Topic Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              {topicChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topicChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      type="number" 
                      domain={[0, 100]} 
                      stroke="#9CA3AF"
                      fontSize={12}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="topic" 
                      stroke="#9CA3AF"
                      fontSize={10}
                      width={120}
                      tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: 'none',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }}
                      formatter={(value) => [`${value}%`, 'Accuracy']}
                    />
                    <Bar dataKey="accuracy" radius={[0, 4, 4, 0]}>
                      {topicChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`}
                          fill={
                            entry.accuracy >= 80 
                              ? '#22C55E' 
                              : entry.accuracy >= 50 
                              ? '#F59E0B' 
                              : '#EF4444'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                  Complete more quizzes to see topic performance
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Strengths and Weaknesses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topicChartData.filter(t => t.accuracy >= 70).length > 0 ? (
                <div className="space-y-2">
                  {topicChartData
                    .filter(t => t.accuracy >= 70)
                    .map((topic) => (
                      <div
                        key={topic.topic}
                        className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                      >
                        <span className="text-gray-900 dark:text-gray-100">
                          {topic.topic}
                        </span>
                        <span className="font-bold text-green-600 dark:text-green-400">
                          {topic.accuracy}%
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Keep practicing to identify your strengths!
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                Needs Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topicChartData.filter(t => t.accuracy < 60).length > 0 ? (
                <div className="space-y-2">
                  {topicChartData
                    .filter(t => t.accuracy < 60)
                    .map((topic) => (
                      <div
                        key={topic.topic}
                        className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
                      >
                        <span className="text-gray-900 dark:text-gray-100">
                          {topic.topic}
                        </span>
                        <span className="font-bold text-red-600 dark:text-red-400">
                          {topic.accuracy}%
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Great job! No weak areas detected.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {ACHIEVEMENTS.map((achievement: AchievementInfo) => {
                const isUnlocked = unlockedAchievementTypes.includes(achievement.type);
                return (
                  <div
                    key={achievement.type}
                    className={`
                      p-4 rounded-lg text-center transition-all
                      ${isUnlocked
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700'
                        : 'bg-gray-100 dark:bg-gray-800 opacity-50 grayscale'
                      }
                    `}
                  >
                    <div className="text-3xl mb-2">{achievement.icon}</div>
                    <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {achievement.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {achievement.description}
                    </p>
                    {isUnlocked && (
                      <span className="inline-block mt-2 text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                        Unlocked!
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
