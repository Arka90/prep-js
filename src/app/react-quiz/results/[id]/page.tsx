"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  PlayCircle,
  BarChart3,
  Home,
  PartyPopper,
  Atom,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/Loading";
import { CodeSnippet } from "@/components/ui/CodeSnippet";
import { useAuthStore } from "@/lib/store";
import { ReactQuizAttempt, ReactQuizQuestion } from "@/types";
import { getDifficultyColor, getQuestionTypeIcon } from "@/lib/react-quiz";

interface QuizResultData extends ReactQuizAttempt {
  correct: boolean[];
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function ReactQuizResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [quiz, setQuiz] = useState<QuizResultData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(
    new Set(),
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchQuizResults = async () => {
      try {
        const response = await fetch(`/api/react-quiz/${id}`);
        const data = await response.json();

        if (response.ok) {
          setQuiz(data.quiz);
          // Expand incorrect questions by default
          const incorrect = new Set<number>();
          data.quiz.correct.forEach((isCorrect: boolean, idx: number) => {
            if (!isCorrect) incorrect.add(idx);
          });
          setExpandedQuestions(incorrect);
        }
      } catch (error) {
        console.error("Failed to fetch React quiz results:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizResults();
  }, [id, isAuthenticated, router]);

  const toggleQuestion = (index: number) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedQuestions(newExpanded);
  };

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
  (quiz.questions as ReactQuizQuestion[]).forEach((q, index) => {
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
        <Card
          className={`mb-8 ${
            isPerfectScore
              ? "bg-gradient-to-r from-yellow-400 to-amber-500"
              : isGreatScore
                ? "bg-gradient-to-r from-cyan-500 to-teal-600"
                : "bg-gradient-to-r from-purple-500 to-indigo-600"
          } border-0`}
        >
          <div className="text-white text-center py-6">
            {isPerfectScore && (
              <PartyPopper className="h-12 w-12 mx-auto mb-3 animate-bounce" />
            )}
            <div className="flex items-center justify-center gap-2 mb-2">
              <Atom className="h-8 w-8" />
              <h1 className="text-3xl font-bold">React Quiz Complete!</h1>
            </div>
            <p className="text-white/90">Day {quiz.day_number}</p>

            <div className="flex items-center justify-center gap-8 mt-6">
              <div className="text-center">
                <div className="text-5xl font-bold">{quiz.score}/10</div>
                <p className="text-white/80 text-sm mt-1">Score</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold flex items-center gap-2">
                  <Clock className="h-6 w-6" />
                  {formatTime(quiz.time_taken)}
                </div>
                <p className="text-white/80 text-sm mt-1">Time</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Topic Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Topic Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(topicBreakdown).map(([topic, stats]) => (
                <div
                  key={topic}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <span className="font-medium text-gray-900 dark:text-white">
                    {topic}
                  </span>
                  <span
                    className={`font-bold ${
                      stats.correct === stats.total
                        ? "text-green-600 dark:text-green-400"
                        : stats.correct === 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-yellow-600 dark:text-yellow-400"
                    }`}
                  >
                    {stats.correct}/{stats.total}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Questions Review */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Question Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(quiz.questions as ReactQuizQuestion[]).map(
                (question, index) => {
                  const isCorrect = quiz.correct[index];
                  const isExpanded = expandedQuestions.has(index);
                  const userAnswer = quiz.user_answers[index] || "Not answered";

                  return (
                    <div
                      key={index}
                      className={`rounded-lg border-2 ${
                        isCorrect
                          ? "border-green-200 dark:border-green-800"
                          : "border-red-200 dark:border-red-800"
                      }`}
                    >
                      {/* Question Header */}
                      <button
                        onClick={() => toggleQuestion(index)}
                        className="w-full p-4 flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-3">
                          {isCorrect ? (
                            <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
                          )}
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              Question {index + 1}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(question.difficulty)}`}
                              >
                                {question.difficulty}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {getQuestionTypeIcon(question.question_type)}{" "}
                                {question.topic}
                              </span>
                            </div>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </button>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                          {question.code_snippet && (
                            <div className="mb-4">
                              <CodeSnippet
                                code={question.code_snippet}
                                language="jsx"
                              />
                            </div>
                          )}

                          <p className="text-gray-900 dark:text-white font-medium mb-4">
                            {question.question_text}
                          </p>

                          <div className="space-y-2 mb-4">
                            {question.options.map((option, optIdx) => {
                              const letter = ["A", "B", "C", "D"][optIdx];
                              const isUserAnswer = userAnswer === letter;
                              const isCorrectAnswer =
                                question.correct_answer === letter;
                              const optionText = option.replace(
                                /^[A-D]\)\s*/,
                                "",
                              );

                              return (
                                <div
                                  key={optIdx}
                                  className={`p-3 rounded-lg border ${
                                    isCorrectAnswer
                                      ? "bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700"
                                      : isUserAnswer && !isCorrectAnswer
                                        ? "bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700"
                                        : "border-gray-200 dark:border-gray-700"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`font-bold ${
                                        isCorrectAnswer
                                          ? "text-green-600 dark:text-green-400"
                                          : isUserAnswer
                                            ? "text-red-600 dark:text-red-400"
                                            : "text-gray-500"
                                      }`}
                                    >
                                      {letter})
                                    </span>
                                    <span className="text-gray-900 dark:text-white">
                                      {optionText}
                                    </span>
                                    {isCorrectAnswer && (
                                      <span className="ml-auto text-green-600 dark:text-green-400 text-sm">
                                        ✓ Correct
                                      </span>
                                    )}
                                    {isUserAnswer && !isCorrectAnswer && (
                                      <span className="ml-auto text-red-600 dark:text-red-400 text-sm">
                                        ✗ Your answer
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                              Explanation:
                            </p>
                            <p className="text-blue-700 dark:text-blue-400">
                              {question.explanation}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                },
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/react-quiz/history">
            <Button variant="outline" className="w-full sm:w-auto">
              <BarChart3 className="h-5 w-5 mr-2" />
              View History
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" className="w-full sm:w-auto">
              <Home className="h-5 w-5 mr-2" />
              Dashboard
            </Button>
          </Link>
          <Link href="/react-quiz">
            <Button className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700">
              <PlayCircle className="h-5 w-5 mr-2" />
              Next React Quiz
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
