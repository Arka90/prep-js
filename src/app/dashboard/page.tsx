"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PlayCircle,
  Flame,
  Trophy,
  Target,
  TrendingUp,
  Clock,
  AlertTriangle,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { LoadingSpinner } from "@/components/ui/Loading";
import { useAuthStore } from "@/lib/store";
import { formatTime, formatDate, getPointsForNextLevel } from "@/lib/quiz";

interface DashboardData {
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
  recentQuizzes: {
    id: string;
    score: number;
    timeTaken: number;
    completedAt: string;
    dayNumber: number;
  }[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, userId } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showStartQuizPopup, setShowStartQuizPopup] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const response = await fetch(`/api/user/stats?userId=${userId}`);
        const result = await response.json();

        if (response.ok) {
          setData(result);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
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

  const pointsToNextLevel = getPointsForNextLevel(stats.totalPoints);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Ready to level up your JavaScript skills?
          </p>
        </div>

        {/* Start Quiz CTA */}
        <Card className="mb-8 bg-gradient-to-r from-blue-500 to-indigo-600 border-0">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-white">
            <div>
              <h2 className="text-2xl font-bold">Start a New Quiz</h2>
              <p className="text-blue-100 mt-1">
                Challenge yourself with 10 AI-generated JavaScript questions
              </p>
            </div>
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50 dark:bg-white dark:text-blue-600 dark:hover:bg-blue-500"
              onClick={() => setShowStartQuizPopup(true)}
            >
              <PlayCircle className="mr-2 h-5 w-5" />
              Start Quiz
            </Button>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Current Streak"
            value={`${stats.currentStreak} days`}
            icon={Flame}
          />
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
        </div>

        {/* Level Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              Level {stats.level}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {stats.totalPoints} points
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {pointsToNextLevel} to next level
                </span>
              </div>
              <ProgressBar
                value={stats.totalPoints}
                max={stats.totalPoints + pointsToNextLevel}
                color="blue"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Recent Quizzes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Quizzes</CardTitle>
              <Link href="/quiz/history">
                <Button variant="ghost" size="sm">
                  See All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {data?.recentQuizzes && data.recentQuizzes.length > 0 ? (
                <div className="space-y-3">
                  {data.recentQuizzes.map((quiz) => (
                    <Link
                      key={quiz.id}
                      href={`/quiz/results/${quiz.id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            quiz.score >= 8
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : quiz.score >= 5
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {quiz.score}/10
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Day {quiz.dayNumber}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(quiz.completedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">
                          {formatTime(quiz.timeTaken)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No quizzes taken yet. Start your first quiz!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Topics Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Topics Overview</CardTitle>
              <div className="flex gap-3 mt-4">
                <Link href="/quiz/mistakes" className="flex-1">
                  <Button variant="outline" className="w-full">
                    <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                    Mistakes
                  </Button>
                </Link>
                <Link href="/revision" className="flex-1">
                  <Button variant="outline" className="w-full">
                    <BookOpen className="mr-2 h-4 w-4 text-blue-500" />
                    Revision
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.weakestTopic && (
                  <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-2">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-medium">Needs Practice</span>
                    </div>
                    <p className="text-red-600 dark:text-red-300">
                      {stats.weakestTopic}
                    </p>
                    <Link href="/quiz">
                      <Button variant="outline" size="sm" className="mt-3">
                        Practice Now
                      </Button>
                    </Link>
                  </div>
                )}

                {stats.strongestTopic && (
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                      <Trophy className="h-5 w-5" />
                      <span className="font-medium">Your Strength</span>
                    </div>
                    <p className="text-green-600 dark:text-green-300">
                      {stats.strongestTopic}
                    </p>
                  </div>
                )}

                {!stats.weakestTopic && !stats.strongestTopic && (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    Complete more quizzes to see your topic performance
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Start Quiz Confirmation Popup */}
        {showStartQuizPopup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <div className="p-6">
                <div className="text-center mb-4">
                  <span className="text-5xl">🧠</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                  Ready to Start?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 text-center">
                  Youre about to start a quiz with 10 AI-generated JavaScript
                  questions.
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 mb-6 space-y-2">
                  <li className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span>20 minutes time limit</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-500" />
                    <span>10 questions to answer</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-blue-500" />
                    <span>Earn points and maintain your streak</span>
                  </li>
                </ul>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowStartQuizPopup(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => router.push("/quiz")}
                    className="flex-1"
                  >
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Start Quiz
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
