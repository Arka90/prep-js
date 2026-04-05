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
  Atom,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { LoadingOverlay } from "@/components/ui/Loading";
import { QuizTimer } from "@/components/quiz/QuizTimer";
import { ReactQuestionCard } from "@/components/quiz/ReactQuestionCard";
import { QuestionNavigator } from "@/components/quiz/QuestionNavigator";
import {
  useAuthStore,
  useReactQuizStore,
  useAIProviderStore,
} from "@/lib/store";
import { generateReactQuiz } from "@/lib/react-quiz";

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

export default function ReactQuizPage() {
  const router = useRouter();
  const { isAuthenticated, userId } = useAuthStore();
  const { provider } = useAIProviderStore();
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
  } = useReactQuizStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [todayStatus, setTodayStatus] = useState<TodayQuizStatus | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [currentDayNumber, setCurrentDayNumber] = useState(1);
  const targetSubtopicsRef = useRef<TargetSubtopic[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Reset stale loading state on mount
  useEffect(() => {
    if (isLoading && questions.length === 0) {
      // If loading but no questions, something went wrong before - reset
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check if user has already taken today's React quiz
  useEffect(() => {
    const checkTodayStatus = async () => {
      if (!userId || !isAuthenticated) {
        setIsCheckingStatus(false);
        return;
      }

      try {
        const response = await fetch(`/api/react-quiz/today?userId=${userId}`);
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
    console.log("Starting new React quiz for day:", currentDayNumber);
    setLoading(true);
    setError(null);

    try {
      const result = await generateReactQuiz(
        currentDayNumber,
        userId || undefined,
        provider,
      );
      console.log(
        "React quiz generated:",
        result.questions?.length,
        "questions",
      );

      if (!result.questions || result.questions.length === 0) {
        throw new Error("No questions received from API");
      }

      setQuestions(result.questions);
      setTimeRemaining(20 * 60); // 20 minutes
      setStartTime(Date.now());

      if (result.targetSubtopics) {
        targetSubtopicsRef.current = result.targetSubtopics;
      }
    } catch (err) {
      console.error("Failed to generate React quiz:", err);
      setError("Failed to generate React quiz. Please try again.");
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
    isCheckingStatus,
    todayStatus,
    startNewQuiz,
  ]);

  // Timer effect is handled by QuizTimer component
  // Auto-submit when time runs out
  useEffect(() => {
    if (timeRemaining === 0 && questions.length > 0 && !isSubmitting) {
      submitQuiz();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining, questions.length, isSubmitting]);

  const submitQuiz = async () => {
    if (!userId || !startTime) return;

    setIsSubmitting(true);
    setShowConfirmSubmit(false);

    try {
      const timeTaken = Math.round((Date.now() - startTime) / 1000);

      const response = await fetch("/api/react-quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          dayNumber: currentDayNumber,
          questions,
          answers,
          timeTaken,
          targetSubtopics: targetSubtopicsRef.current,
        }),
      });

      const data = await response.json();

      if (data.success) {
        resetQuiz();
        router.push(`/react-quiz/results/${data.attemptId}`);
      } else {
        setError("Failed to submit quiz. Please try again.");
      }
    } catch (err) {
      console.error("Failed to submit quiz:", err);
      setError("Failed to submit quiz. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    submitQuiz();
  };

  const handleTimeUp = () => {
    if (!isSubmitting) {
      submitQuiz();
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestion(index);
  };

  const goNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestion(currentQuestionIndex + 1);
    }
  };

  const goPrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestion(currentQuestionIndex - 1);
    }
  };

  const handleTick = useCallback(() => {
    decrementTime();
  }, [decrementTime]);

  if (!isAuthenticated) {
    return null;
  }

  // Show loading state while checking today's status
  if (isCheckingStatus) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <LoadingOverlay message="Checking React quiz status..." />
      </div>
    );
  }

  // Show "already completed" message if user has taken today's quiz
  if (todayStatus?.hasCompletedToday && todayStatus.todayQuiz) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-6 text-center">
              <Atom className="h-16 w-16 text-white mx-auto animate-pulse" />
            </div>
            <div className="p-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                You&apos;ve Already Completed Today&apos;s React Quiz!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Great job on Day {todayStatus.todayQuiz?.dayNumber}! You scored{" "}
                <span className="font-bold text-cyan-600 dark:text-cyan-400">
                  {todayStatus.todayQuiz?.score}/10
                </span>
              </p>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">Next quiz available in:</span>
                </div>
                <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                  {todayStatus.timeUntilNextQuiz?.hours}h{" "}
                  {todayStatus.timeUntilNextQuiz?.minutes}m
                </div>
              </div>

              <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-2 text-cyan-700 dark:text-cyan-400 mb-1">
                  <Calendar className="h-5 w-5" />
                  <span className="font-medium">
                    Tomorrow is Day {currentDayNumber + 1}
                  </span>
                </div>
                <p className="text-sm text-cyan-600 dark:text-cyan-300">
                  Come back tomorrow for new React challenges!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(
                      `/react-quiz/results/${todayStatus.todayQuiz?.id}`,
                    )
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

  // Loading state while generating quiz
  if (isLoading || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <LoadingOverlay message="Generating your React quiz questions..." />
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = answers.filter((a) => a !== "").length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      {/* Quiz Header - Sticky bar matching JS Quiz */}
      <div className="sticky top-16 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Left: React branding + Timer */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Atom className="h-5 w-5 text-cyan-500" />
                <span className="font-semibold text-gray-900 dark:text-white hidden sm:inline">
                  React Quiz
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Day {currentDayNumber}
                </span>
              </div>
              <QuizTimer
                timeRemaining={timeRemaining}
                onTimeUp={handleTimeUp}
                onTick={handleTick}
              />
            </div>

            {/* Center: Progress Bar */}
            <div className="flex-1 max-w-md">
              <ProgressBar
                value={answeredCount}
                max={questions.length}
                showLabel
                color="blue"
              />
            </div>

            {/* Right: Submit Button */}
            <Button
              variant="primary"
              onClick={() => setShowConfirmSubmit(true)}
              disabled={isSubmitting}
              className="bg-cyan-600 hover:bg-cyan-700"
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
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <ReactQuestionCard
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questions.length}
              selectedAnswer={answers[currentQuestionIndex]}
              onSelectAnswer={(answer) =>
                setAnswer(currentQuestionIndex, answer)
              }
              isMarkedForReview={markedForReview[currentQuestionIndex]}
              onToggleReview={() => toggleMarkForReview(currentQuestionIndex)}
            />

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={goPrev}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={goNext}
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
                onNavigate={goToQuestion}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Confirm Submit Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Submit React Quiz?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              You have answered {answeredCount} of {questions.length} questions.
            </p>
            {answeredCount < questions.length && (
              <p className="text-yellow-600 dark:text-yellow-400 mb-4">
                ⚠️ You have {questions.length - answeredCount} unanswered
                questions.
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowConfirmSubmit(false)}
              >
                Continue Quiz
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
