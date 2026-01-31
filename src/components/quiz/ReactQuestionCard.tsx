"use client";

import { ReactQuizQuestion } from "@/types";
import { CodeSnippet } from "@/components/ui/CodeSnippet";
import { getDifficultyColor, getQuestionTypeIcon } from "@/lib/react-quiz";

interface ReactQuestionCardProps {
  question: ReactQuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer: string;
  onSelectAnswer: (answer: string) => void;
  isMarkedForReview: boolean;
  onToggleReview: () => void;
}

export function ReactQuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onSelectAnswer,
  isMarkedForReview,
  onToggleReview,
}: ReactQuestionCardProps) {
  const optionLetters = ["A", "B", "C", "D"];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Question {questionNumber} of {totalQuestions}
          </span>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(question.difficulty)}`}
          >
            {question.difficulty}
          </span>
          <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 rounded text-xs font-medium">
            {question.topic}
          </span>
          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded text-xs font-medium">
            {getQuestionTypeIcon(question.question_type)}{" "}
            {question.question_type}
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

      {/* Code Snippet (if present) */}
      {question.code_snippet && (
        <div className="px-6 py-4">
          <CodeSnippet code={question.code_snippet} language="jsx" />
        </div>
      )}

      {/* Question Text */}
      <div className="px-6 py-4">
        <p className="text-lg font-medium text-gray-900 dark:text-white">
          {question.question_text}
        </p>
      </div>

      {/* Options */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
        {question.options.map((option, index) => {
          const letter = optionLetters[index];
          const isSelected = selectedAnswer === letter;

          // Parse option text (remove leading "A) " etc if present)
          const optionText = option.replace(/^[A-D]\)\s*/, "");

          return (
            <button
              key={index}
              onClick={() => onSelectAnswer(letter)}
              className={`
                w-full p-4 text-left rounded-lg border-2 transition-all
                ${
                  isSelected
                    ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/30"
                    : "border-gray-200 dark:border-gray-700 hover:border-cyan-300 dark:hover:border-cyan-600"
                }
              `}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`
                  flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
                  ${
                    isSelected
                      ? "bg-cyan-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  }
                `}
                >
                  {letter}
                </span>
                <span
                  className={`
                  flex-1 pt-1 font-medium
                  ${
                    isSelected
                      ? "text-cyan-700 dark:text-cyan-300"
                      : "text-gray-700 dark:text-gray-300"
                  }
                `}
                >
                  {optionText}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
