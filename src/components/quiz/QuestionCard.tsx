"use client";

import { useEffect, useRef } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import { QuizQuestion } from "@/types";

interface QuestionCardProps {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  isMarkedForReview: boolean;
  onToggleReview: () => void;
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  userAnswer,
  onAnswerChange,
  isMarkedForReview,
  onToggleReview,
}: QuestionCardProps) {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [question.code_snippet]);

  const difficultyColors = {
    Easy: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    Medium:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    Hard: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Question {questionNumber} of {totalQuestions}
          </span>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              difficultyColors[question.difficulty]
            }`}
          >
            {question.difficulty}
          </span>
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
            {question.topic}
          </span>
        </div>
        <button
          onClick={onToggleReview}
          className={`
            flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors
            ${
              isMarkedForReview
                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            }
          `}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill={isMarkedForReview ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          {isMarkedForReview ? "Marked" : "Mark for Review"}
        </button>
      </div>

      {/* Code Snippet */}
      <div className="px-6 py-4">
        <p className="text-gray-700 dark:text-gray-300 mb-4 font-medium">
          What is the output of the following code?
        </p>
        <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
          <code ref={codeRef} className="language-javascript text-sm">
            {question.code_snippet.replace(/\\n/g, "\n")}
          </code>
        </pre>
      </div>

      {/* Answer Input */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Your Answer
        </label>
        <input
          type="text"
          value={userAnswer}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Enter the expected output..."
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
        />
      </div>
    </div>
  );
}
