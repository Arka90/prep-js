"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  Calendar,
  Clock,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { LoadingOverlay } from "@/components/ui/Loading";
import { QuizTimer } from "@/components/quiz/QuizTimer";
import { QuestionCard } from "@/components/quiz/QuestionCard";
import { QuestionNavigator } from "@/components/quiz/QuestionNavigator";
import { useAuthStore, useQuizStore } from "@/lib/store";
import { generateQuiz } from "@/lib/quiz";

interface TodayQuizStatus {
  hasCompletedToday: boolean;
  dayNumber: number;
  todayQuiz: {
    id: string;
    score: number;
    completedAt: string;
    dayNumber: number;
  } | null;
  timeUntilNextQuiz: {
    hours: number;
    minutes: number;
  } | null;
}

interface TargetSubtopic {
  mainTopic: string;
  subtopic: string;
}

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
  const [todayStatus, setTodayStatus] = useState<TodayQuizStatus | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [currentDayNumber, setCurrentDayNumber] = useState(1);
  // Store target subtopics for tracking after quiz completion
  const targetSubtopicsRef = useRef<TargetSubtopic[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Check if user has already taken today's quiz
  useEffect(() => {
    const checkTodayStatus = async () => {
      if (!userId || !isAuthenticated) {
        setIsCheckingStatus(false);
        return;
      }

      try {
        const response = await fetch(`/api/quiz/today?userId=${userId}`);
        const data = await response.json();

        if (response.ok) {
          setTodayStatus(data);
          setCurrentDayNumber(data.dayNumber);
        }
      } catch (err) {
        console.error("Failed to check today status:", err);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkTodayStatus();
  }, [userId, isAuthenticated]);

  const startNewQuiz = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Pass userId to get targeted subtopics based on syllabus progress
      const result = await generateQuiz(currentDayNumber, userId || undefined);

      setQuestions(result.questions);
      setTimeRemaining(20 * 60); // 20 minutes
      setStartTime(Date.now());
      
      // Store target subtopics for tracking after quiz completion
      if (result.targetSubtopics) {
        targetSubtopicsRef.current = result.targetSubtopics;
      }
    } catch (err) {
      console.error("Failed to generate quiz:", err);
      setError("Failed to generate quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [
    setLoading,
    setQuestions,
    setTimeRemaining,
    setStartTime,
    currentDayNumber,
    userId,
  ]);

  useEffect(() => {
    // Only generate quiz if we don't have questions yet and haven't completed today's quiz
    if (
      questions.length === 0 &&
      !isLoading &&
      isAuthenticated &&
      !isCheckingStatus &&
      !todayStatus?.hasCompletedToday
    ) {
      startNewQuiz();
    }
  }, [
    questions.length,
    isLoading,
    isAuthenticated,
    startNewQuiz,
    isCheckingStatus,
    todayStatus?.hasCompletedToday,
  ]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || !userId || !startTime) return;

    setIsSubmitting(true);
    setShowConfirmSubmit(false);

    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    try {
      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          questions,
          answers,
          timeTaken,
          dayNumber: currentDayNumber,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Mark the target subtopics as covered for syllabus tracking
        if (targetSubtopicsRef.current.length > 0) {
          try {
            await fetch("/api/syllabus", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId,
                subtopics: targetSubtopicsRef.current,
              }),
            });
          } catch (syllabusError) {
            // Don't block quiz completion for syllabus tracking errors
            console.error("Failed to track subtopics:", syllabusError);
          }
        }
        
        resetQuiz();
        router.push(`/quiz/results/${data.quizId}`);
      } else {
        setError(data.error || "Failed to submit quiz");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError("Failed to submit quiz. Please try again.");
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    userId,
    startTime,
    questions,
    answers,
    resetQuiz,
    router,
    currentDayNumber,
  ]);

  const handleTimeUp = useCallback(() => {
    handleSubmit();
  }, [handleSubmit]);

  const handleTick = useCallback(() => {
    decrementTime();
  }, [decrementTime]);

  if (!isAuthenticated) {
    return null;
  }

  // Show loading while checking if user already took today's quiz
  if (isCheckingStatus) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <LoadingOverlay message="Checking your quiz status..." />
      </div>
    );
  }

  // Show "Come Back Tomorrow" popup if user already completed today's quiz
  if (todayStatus?.hasCompletedToday) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-center">
              <span className="text-6xl">🌙</span>
            </div>
            <div className="p-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                You&apos;ve Already Completed Today&apos;s Quiz!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Great job on Day {todayStatus.todayQuiz?.dayNumber}! You scored{" "}
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {todayStatus.todayQuiz?.score}/10
                </span>
              </p>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">Next quiz available in:</span>
                </div>
                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  {todayStatus.timeUntilNextQuiz?.hours}h{" "}
                  {todayStatus.timeUntilNextQuiz?.minutes}m
                </div>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-2 text-indigo-700 dark:text-indigo-400 mb-1">
                  <Calendar className="h-5 w-5" />
                  <span className="font-medium">
                    Tomorrow is Day {currentDayNumber + 1}
                  </span>
                </div>
                <p className="text-sm text-indigo-600 dark:text-indigo-300">
                  Come back tomorrow for new challenges!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(`/quiz/results/${todayStatus.todayQuiz?.id}`)
                  }
                  className="flex-1"
                >
                  View Today&apos;s Results
                </Button>
                <Button
                  variant="primary"
                  onClick={() => router.push("/dashboard")}
                  className="flex-1"
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
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
  const answeredCount = answers.filter((a) => a.trim() !== "").length;

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
                You have answered {answeredCount} of {questions.length}{" "}
                questions.
              </p>
              {answeredCount < questions.length && (
                <p className="text-yellow-600 dark:text-yellow-400 mb-4">
                  ⚠️ {questions.length - answeredCount} questions are
                  unanswered!
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
