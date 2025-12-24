'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Send, Loader2 } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { LoadingOverlay } from '@/components/ui/Loading';
import { QuizTimer } from '@/components/quiz/QuizTimer';
import { QuestionCard } from '@/components/quiz/QuestionCard';
import { QuestionNavigator } from '@/components/quiz/QuestionNavigator';
import { useAuthStore, useQuizStore } from '@/lib/store';
import { generateQuiz, getDayNumber } from '@/lib/quiz';

export default function QuizPage() {
  const router = useRouter();
  const { isAuthenticated, userId } = useAuthStore();
  const {
    questions,
    currentQuestionIndex,
    answers,
    markedForReview,
    timeRemaining,
    isLoading,
    startTime,
    setQuestions,
    setCurrentQuestion,
    setAnswer,
    toggleMarkForReview,
    setTimeRemaining,
    decrementTime,
    setLoading,
    setStartTime,
    resetQuiz,
  } = useQuizStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const startNewQuiz = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // For demo, use day 1
      const dayNumber = getDayNumber(null);
      const generatedQuestions = await generateQuiz(dayNumber);
      
      setQuestions(generatedQuestions);
      setTimeRemaining(20 * 60); // 20 minutes
      setStartTime(Date.now());
    } catch (err) {
      console.error('Failed to generate quiz:', err);
      setError('Failed to generate quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setQuestions, setTimeRemaining, setStartTime]);

  useEffect(() => {
    // Only generate quiz if we don't have questions yet
    if (questions.length === 0 && !isLoading && isAuthenticated) {
      startNewQuiz();
    }
  }, [questions.length, isLoading, isAuthenticated, startNewQuiz]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || !userId || !startTime) return;
    
    setIsSubmitting(true);
    setShowConfirmSubmit(false);

    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const dayNumber = getDayNumber(null);

    try {
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          questions,
          answers,
          timeTaken,
          dayNumber,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        resetQuiz();
        router.push(`/quiz/results/${data.quizId}`);
      } else {
        setError(data.error || 'Failed to submit quiz');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('Failed to submit quiz. Please try again.');
      setIsSubmitting(false);
    }
  }, [isSubmitting, userId, startTime, questions, answers, resetQuiz, router]);

  const handleTimeUp = useCallback(() => {
    handleSubmit();
  }, [handleSubmit]);

  const handleTick = useCallback(() => {
    decrementTime();
  }, [decrementTime]);

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <LoadingOverlay message="Generating your quiz... This may take a moment." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Something went wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">{error}</p>
          <Button onClick={startNewQuiz}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <Button onClick={startNewQuiz} size="lg">
            Start Quiz
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = answers.filter((a) => a.trim() !== '').length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      {/* Quiz Header */}
      <div className="sticky top-16 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <QuizTimer
              timeRemaining={timeRemaining}
              onTimeUp={handleTimeUp}
              onTick={handleTick}
            />
            
            <div className="flex-1 max-w-md">
              <ProgressBar
                value={answeredCount}
                max={questions.length}
                showLabel
                color="green"
              />
            </div>

            <Button
              variant="primary"
              onClick={() => setShowConfirmSubmit(true)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Quiz
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <QuestionCard
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questions.length}
              userAnswer={answers[currentQuestionIndex]}
              onAnswerChange={(answer) =>
                setAnswer(currentQuestionIndex, answer)
              }
              isMarkedForReview={markedForReview[currentQuestionIndex]}
              onToggleReview={() => toggleMarkForReview(currentQuestionIndex)}
            />

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(currentQuestionIndex - 1)}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(currentQuestionIndex + 1)}
                disabled={currentQuestionIndex === questions.length - 1}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Question Navigator Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-40">
              <QuestionNavigator
                totalQuestions={questions.length}
                currentIndex={currentQuestionIndex}
                answers={answers}
                markedForReview={markedForReview}
                onNavigate={setCurrentQuestion}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Submit Confirmation Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Submit Quiz?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                You have answered {answeredCount} of {questions.length} questions.
              </p>
              {answeredCount < questions.length && (
                <p className="text-yellow-600 dark:text-yellow-400 mb-4">
                  ⚠️ {questions.length - answeredCount} questions are unanswered!
                </p>
              )}
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1"
                >
                  Keep Working
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  className="flex-1"
                  isLoading={isSubmitting}
                >
                  Submit
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
