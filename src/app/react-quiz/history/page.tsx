"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Trophy,
  TrendingUp,
  Atom,
  ChevronRight,
  BarChart3,
  ArrowLeft,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/Loading";
import { useAuthStore } from "@/lib/store";
import { ReactQuizAttempt } from "@/types";

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ReactQuizHistoryPage() {
  const router = useRouter();
  const { isAuthenticated, userId } = useAuthStore();
  const [quizzes, setQuizzes] = useState<ReactQuizAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    averageScore: 0,
    bestScore: 0,
    totalTime: 0,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchHistory = async () => {
      try {
        const response = await fetch(
          `/api/react-quiz/history?userId=${userId}`,
        );
        const data = await response.json();

        if (response.ok) {
          setQuizzes(data.quizzes);
          setStats(data.stats);
        }
      } catch (error) {
        console.error("Failed to fetch React quiz history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchHistory();
    }
  }, [isAuthenticated, userId, router]);

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <LoadingSpinner size="lg" className="text-cyan-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button and Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Atom className="h-8 w-8 text-cyan-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              React Quiz History
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/react-quiz/analytics">
              <Button variant="outline" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                View Analytics
              </Button>
            </Link>
            <Link href="/react-quiz">
              <Button className="bg-cyan-600 hover:bg-cyan-700">
                Take New Quiz
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 text-center">
            <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.bestScore}/10
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Best Score
            </p>
          </Card>
          <Card className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.averageScore.toFixed(1)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Avg Score
            </p>
          </Card>
          <Card className="p-4 text-center">
            <Calendar className="h-8 w-8 text-cyan-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalQuizzes}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Quizzes
            </p>
          </Card>
          <Card className="p-4 text-center">
            <Clock className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatTime(stats.totalTime)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Time
            </p>
          </Card>
        </div>

        {/* Quiz List */}
        <Card>
          <CardHeader>
            <CardTitle>All Attempts ({quizzes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {quizzes.length > 0 ? (
              <div className="space-y-3">
                {quizzes.map((quiz) => (
                  <Link
                    key={quiz.id}
                    href={`/react-quiz/results/${quiz.id}`}
                    className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                          quiz.score >= 8
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : quiz.score >= 5
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {quiz.score}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Day {quiz.day_number} Challenge
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(quiz.completed_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(quiz.time_taken)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Atom className="h-16 w-16 text-cyan-300 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  No React quizzes yet
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Start your React learning journey by taking your first quiz!
                </p>
                <Link href="/react-quiz">
                  <Button className="bg-cyan-600 hover:bg-cyan-700">
                    Start First React Quiz
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
