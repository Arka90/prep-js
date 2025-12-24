'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Trophy, 
  Clock, 
  PlayCircle,
  BarChart3,
  Home,
  PartyPopper
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/Loading';
import { QuizResultCard } from '@/components/quiz/QuizResultCard';
import { useAuthStore } from '@/lib/store';
import { formatTime } from '@/lib/quiz';
import { QuizAttempt, QuizQuestion } from '@/types';

interface QuizResultData extends QuizAttempt {
  correct: boolean[];
}

export default function QuizResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [quiz, setQuiz] = useState<QuizResultData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchQuizResults = async () => {
      try {
        const response = await fetch(`/api/quiz/${id}`);
        const data = await response.json();

        if (response.ok) {
          setQuiz(data.quiz);
        }
      } catch (error) {
        console.error('Failed to fetch quiz results:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizResults();
  }, [id, isAuthenticated, router]);

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

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Quiz not found
          </h2>
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isGreatScore = quiz.score >= 8;
  const isPerfectScore = quiz.score === 10;

  // Calculate topic breakdown
  const topicBreakdown: Record<string, { correct: number; total: number }> = {};
  (quiz.questions as QuizQuestion[]).forEach((q, index) => {
    if (!topicBreakdown[q.topic]) {
      topicBreakdown[q.topic] = { correct: 0, total: 0 };
    }
    topicBreakdown[q.topic].total++;
    if (quiz.correct[index]) {
      topicBreakdown[q.topic].correct++;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <Card className={`mb-8 ${
          isPerfectScore 
            ? 'bg-gradient-to-r from-yellow-400 to-amber-500' 
            : isGreatScore 
            ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
            : 'bg-gradient-to-r from-blue-500 to-indigo-600'
        } border-0`}>
          <div className="text-white text-center py-6">
            {isPerfectScore && (
              <div className="flex justify-center gap-2 mb-4">
                <PartyPopper className="h-8 w-8 animate-bounce" />
                <PartyPopper className="h-8 w-8 animate-bounce" style={{ animationDelay: '0.1s' }} />
                <PartyPopper className="h-8 w-8 animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            )}
            
            <h1 className="text-4xl font-bold mb-2">
              {isPerfectScore ? '🏆 Perfect Score!' : isGreatScore ? '🎉 Great Job!' : 'Quiz Complete'}
            </h1>
            
            <div className="text-7xl font-bold my-6">
              {quiz.score}/10
            </div>

            <div className="flex justify-center gap-8 text-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>{formatTime(quiz.time_taken)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                <span>Day {quiz.day_number}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          <Link href="/quiz">
            <Button size="lg" variant="primary">
              <PlayCircle className="mr-2 h-5 w-5" />
              Take New Quiz
            </Button>
          </Link>
          <Link href="/analytics">
            <Button size="lg" variant="outline">
              <BarChart3 className="mr-2 h-5 w-5" />
              View Analytics
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="secondary">
              <Home className="mr-2 h-5 w-5" />
              Dashboard
            </Button>
          </Link>
        </div>

        {/* Topic Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Topic Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(topicBreakdown).map(([topic, stats]) => {
                const percentage = Math.round((stats.correct / stats.total) * 100);
                return (
                  <div
                    key={topic}
                    className={`p-3 rounded-lg ${
                      percentage >= 80
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                        : percentage >= 50
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {topic}
                      </span>
                      <span className={`font-bold ${
                        percentage >= 80
                          ? 'text-green-600 dark:text-green-400'
                          : percentage >= 50
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {stats.correct}/{stats.total}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Question-by-Question Breakdown */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Question Breakdown
          </h2>
          
          {(quiz.questions as QuizQuestion[]).map((question, index) => (
            <QuizResultCard
              key={index}
              question={question}
              questionNumber={index + 1}
              userAnswer={quiz.user_answers[index]}
              isCorrect={quiz.correct[index]}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
