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
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Learn from Mistakes
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Review concepts you missed to improve your skills
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {mistakes.length > 0 ? (
            mistakes.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden border-l-4 border-l-red-500"
              >
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  onClick={() => toggleExpand(item.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className="mt-1">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            {item.question.topic}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(item.date)}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          Day {item.dayNumber} Quiz Question
                        </h3>
                      </div>
                    </div>
                    <div>
                      {expandedId === item.id ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {expandedId === item.id && (
                  <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 p-4 sm:p-6">
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          <CodeIcon className="h-4 w-4" />
                          Code Snippet
                        </div>
                        <CodeSnippet code={item.question.code_snippet} />
                      </div>

                    {/* Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                        <div className="flex items-center gap-2 mb-2 text-red-700 dark:text-red-400 font-medium">
                          <XCircle className="h-4 w-4" />
                          Your Answer
                        </div>
                        <p className="font-mono text-sm text-gray-900 dark:text-gray-200 break-words">
                          {item.userAnswer || "(No answer provided)"}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30">
                        <div className="flex items-center gap-2 mb-2 text-green-700 dark:text-green-400 font-medium">
                          <CheckCircle className="h-4 w-4" />
                          Correct Answer
                        </div>
                        <p className="font-mono text-sm text-gray-900 dark:text-gray-200 break-words">
                          {item.question.expected_output}
                        </p>
                      </div>
                    </div>

                    {/* Explanation */}
                    <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 border border-blue-100 dark:border-blue-900/30">
                      <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                        Explanation
                      </h4>
                      <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
                        {item.question.explanation}
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            ))
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-4">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No mistakes found!
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                Great job! You haven't made any mistakes in your recent quizzes.
                Keep up the good work!
              </p>
              <Link href="/quiz">
                <Button className="mt-6">Take another quiz</Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
