"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/Loading";
import { useAuthStore } from "@/lib/store";
import { formatTime, formatDate } from "@/lib/quiz";

interface QuizHistoryItem {
  id: string;
  score: number;
  timeTaken: number;
  completedAt: string;
  dayNumber: number;
}

export default function QuizHistoryPage() {
  const router = useRouter();
  const { isAuthenticated, userId } = useAuthStore();
  const [quizzes, setQuizzes] = useState<QuizHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchHistory = async () => {
      try {
        const response = await fetch(`/api/user/quizzes?userId=${userId}`);
        const result = await response.json();

        if (response.ok) {
          setQuizzes(result.quizzes);
        }
      } catch (error) {
        console.error("Failed to fetch quiz history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [isAuthenticated, userId, router]);

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quiz History
          </h1>
        </div>

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
                    href={`/quiz/results/${quiz.id}`}
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
                          Day {quiz.dayNumber} Challenge
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(quiz.completedAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(quiz.timeTaken)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-12">
                No quizzes taken yet.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
