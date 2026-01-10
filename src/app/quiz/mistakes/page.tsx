"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  XCircle,
  Code as CodeIcon,
  ChevronDown,
  ChevronUp,
  Search,
  BookOpen,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/Loading";
import { CodeSnippet } from "@/components/ui/CodeSnippet";
import { useAuthStore } from "@/lib/store";
import { formatDate } from "@/lib/quiz";
import { QuizQuestion } from "@/types";

interface MistakeItem {
  id: string;
  quizId: string;
  date: string;
  dayNumber: number;
  question: QuizQuestion;
  userAnswer: string;
}

export default function MistakesPage() {
  const router = useRouter();
  const { isAuthenticated, userId } = useAuthStore();
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchMistakes = async () => {
      try {
        const response = await fetch(`/api/user/mistakes?userId=${userId}`);
        const result = await response.json();

        if (response.ok) {
          setMistakes(result.mistakes);
        }
      } catch (error) {
        console.error("Failed to fetch mistakes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMistakes();
  }, [isAuthenticated, userId, router]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleMarkRevision = async (item: MistakeItem) => {
    try {
      if (!isAuthenticated || !userId) return;

      const response = await fetch("/api/revision/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          question: item.question,
          userAnswer: item.userAnswer,
        }),
      });

      if (response.ok) {
        // Optionally show toast or change button state locally
        // For now we'll just alert or could add local state to disable button
        alert("Marked for revision!");
      } else {
        console.error("Failed to mark for revision");
      }
    } catch (error) {
      console.error("Error marking for revision:", error);
    }
  };

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Learning from Mistakes
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Review questions you missed to strengthen your understanding.
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        {mistakes.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              No mistakes found!
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              You haven't made any mistakes in your quizzes yet. Keep up the great work!
            </p>
            <Link href="/quiz">
              <Button>Take a Quiz</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {mistakes.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md"
              >
                <div
                  className="p-6 cursor-pointer"
                  onClick={() => toggleExpand(item.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-xs font-medium">
                          Mistake
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(item.date)} • Day {item.dayNumber}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
                          {item.question.topic}
                        </span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Question {item.question.question_number}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                       <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkRevision(item);
                        }}
                      >
                         Example Revise
                      </Button>
                      {expandedId === item.id ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {expandedId === item.id && (
                  <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          <CodeIcon className="h-4 w-4" />
                          Code Snippet
                        </div>
                        <CodeSnippet code={item.question.code_snippet} />
                      </div>

                    {/* Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <div className="flex items-center gap-2 mb-2 text-sm font-medium text-red-700 dark:text-red-400">
                          <XCircle className="h-4 w-4" />
                          Your Answer
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg p-3 font-mono text-sm text-red-800 dark:text-red-200">
                          {item.userAnswer || "(no answer)"}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2 text-sm font-medium text-green-700 dark:text-green-400">
                          <CheckCircle className="h-4 w-4" />
                          Expected Output
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-lg p-3 font-mono text-sm text-green-800 dark:text-green-200">
                          {item.question.expected_output}
                        </div>
                      </div>
                    </div>

                    {/* Explanation */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Explanation
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                        {item.question.explanation}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex justify-end gap-3">
                       <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                           e.stopPropagation(); // Prevent collapse
                           handleMarkRevision(item);
                        }}
                      >
                         <BookOpen className="mr-2 h-4 w-4" />
                         Mark for Revision
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
