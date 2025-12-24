'use client';

import { useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import { QuizQuestion } from '@/types';
import { CheckCircle, XCircle } from 'lucide-react';

interface QuizResultCardProps {
  question: QuizQuestion;
  questionNumber: number;
  userAnswer: string;
  isCorrect: boolean;
}

export function QuizResultCard({
  question,
  questionNumber,
  userAnswer,
  isCorrect,
}: QuizResultCardProps) {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [question.code_snippet]);

  const difficultyColors = {
    Easy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    Hard: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div
      className={`
        bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden
        ${isCorrect 
          ? 'border-green-300 dark:border-green-700' 
          : 'border-red-300 dark:border-red-700'
        }
      `}
    >
      {/* Header */}
      <div
        className={`
          px-6 py-4 flex flex-wrap items-center justify-between gap-3
          ${isCorrect 
            ? 'bg-green-50 dark:bg-green-900/20' 
            : 'bg-red-50 dark:bg-red-900/20'
          }
        `}
      >
        <div className="flex items-center gap-3">
          {isCorrect ? (
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          ) : (
            <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          )}
          <span className="font-medium text-gray-900 dark:text-gray-100">
            Question {questionNumber}
          </span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${difficultyColors[question.difficulty]}`}>
            {question.difficulty}
          </span>
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
            {question.topic}
          </span>
        </div>
        <span
          className={`
            text-sm font-medium
            ${isCorrect 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
            }
          `}
        >
          {isCorrect ? 'Correct!' : 'Incorrect'}
        </span>
      </div>

      {/* Code Snippet */}
      <div className="px-6 py-4">
        <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
          <code ref={codeRef} className="language-javascript text-sm">
            {question.code_snippet}
          </code>
        </pre>
      </div>

      {/* Answers */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
        <div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Your Answer:
          </span>
          <span
            className={`
              ml-2 font-mono
              ${isCorrect 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
              }
            `}
          >
            {userAnswer || '(no answer)'}
          </span>
        </div>
        {!isCorrect && (
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Expected Output:
            </span>
            <span className="ml-2 font-mono text-green-600 dark:text-green-400">
              {question.expected_output}
            </span>
          </div>
        )}
      </div>

      {/* Explanation */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Explanation
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {question.explanation}
        </p>
      </div>
    </div>
  );
}
