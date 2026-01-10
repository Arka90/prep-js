"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  Trash2, 
  Bot, 
  BookOpen, 
  CheckCircle,
  XCircle,
  Code as CodeIcon
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/Loading";
import { CodeSnippet } from "@/components/ui/CodeSnippet";
import { useAuthStore } from "@/lib/store";
import { RevisionItem } from "@/types";
import ReactMarkdown from 'react-markdown';

export default function RevisionPage() {
  const router = useRouter();
  const { isAuthenticated, userId } = useAuthStore();
  const [items, setItems] = useState<RevisionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<RevisionItem | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchItems = async () => {
      if (!userId) return;
      try {
        const response = await fetch(`/api/revision/list?userId=${userId}`);
        const data = await response.json();
        if (response.ok) {
          setItems(data.revisionItems);
        }
      } catch (error) {
        console.error("Failed to fetch revision items:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, [isAuthenticated, userId, router]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to remove this from revision?")) return;

    try {
      const response = await fetch(`/api/revision/${id}`, { method: "DELETE" });
      if (response.ok) {
        setItems(items.filter((item) => item.id !== id));
        if (selectedItem?.id === id) {
          setSelectedItem(null);
          setAiExplanation(null);
        }
      }
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  const handleExplain = async (item: RevisionItem) => {
    setIsAiLoading(true);
    setAiExplanation(null);
    try {
      const response = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: item.question,
          userAnswer: item.user_answer,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setAiExplanation(data.explanation);
      } else {
        alert("Failed to get AI explanation. Please try again.");
      }
    } catch (error) {
      console.error("AI error:", error);
      alert("Something went wrong with AI explanation.");
    } finally {
      setIsAiLoading(false);
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Revision List
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Deep dive into your difficult topics with AI assistance.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* List Column */}
          <div className="lg:col-span-1 space-y-4">
            {items.length === 0 ? (
              <Card className="p-6 text-center text-gray-500">
                No items marked for revision.
              </Card>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedItem(item);
                    setAiExplanation(null);
                  }}
                  className={`
                    p-4 rounded-lg border cursor-pointer transition-all
                    ${
                      selectedItem?.id === item.id
                        ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 ring-1 ring-blue-300 dark:ring-blue-700"
                        : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"
                    }
                  `}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {item.question.topic}
                    </span>
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                    Question {item.question.question_number}: Code Output
                  </h3>
                  <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    Click to review
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Detail Column */}
          <div className="lg:col-span-2">
            {selectedItem ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Question Card */}
                <Card className="overflow-hidden">
                  <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      Question Review
                    </h2>
                     <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          <CodeIcon className="h-4 w-4" />
                          Code Snippet
                        </div>
                        <CodeSnippet code={selectedItem.question.code_snippet} />
                      </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg">
                         <div className="flex items-center gap-2 mb-1 text-sm font-medium text-red-700 dark:text-red-400">
                          <XCircle className="h-4 w-4" />
                          Your Answer
                        </div>
                        <div className="font-mono text-red-800 dark:text-red-300">
                          {selectedItem.user_answer}
                        </div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-lg">
                         <div className="flex items-center gap-2 mb-1 text-sm font-medium text-green-700 dark:text-green-400">
                          <CheckCircle className="h-4 w-4" />
                          Expected Output
                        </div>
                        <div className="font-mono text-green-800 dark:text-green-300">
                          {selectedItem.question.expected_output}
                        </div>
                      </div>
                    </div>
                  </div>

                    {/* Original Explanation */}
                    <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border-b border-gray-100 dark:border-gray-800">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Original Explanation
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                        {selectedItem.question.explanation}
                      </p>
                    </div>

                  {/* AI Section */}
                  <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-lg">
                        <Bot className="h-6 w-6" />
                        AI Explanation
                      </div>
                      {!aiExplanation && (
                        <Button 
                          onClick={() => handleExplain(selectedItem)}
                          disabled={isAiLoading}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          {isAiLoading ? (
                            <>
                              <LoadingSpinner size="sm" className="mr-2 text-white" />
                              Thinking...
                            </>
                          ) : (
                            "Explain with AI"
                          )}
                        </Button>
                      )}
                    </div>

                    {aiExplanation && (
                      <div className="prose dark:prose-invert max-w-none bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-900">
                        <ReactMarkdown>{aiExplanation}</ReactMarkdown>
                      </div>
                    )}
                    
                    {!aiExplanation && !isAiLoading && (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Click the button above to get a personalized explanation for why your answer was incorrect and how to understand the concept better.
                      </p>
                    )}
                  </div>
                </Card>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                <BookOpen className="h-12 w-12 mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-1">Select an item to revise</h3>
                <p>Choose a question from the list to see details and get AI help.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
