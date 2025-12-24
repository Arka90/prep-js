'use client';

interface QuestionNavigatorProps {
  totalQuestions: number;
  currentIndex: number;
  answers: string[];
  markedForReview: boolean[];
  onNavigate: (index: number) => void;
}

export function QuestionNavigator({
  totalQuestions,
  currentIndex,
  answers,
  markedForReview,
  onNavigate,
}: QuestionNavigatorProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Question Navigator
      </h3>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: totalQuestions }).map((_, index) => {
          const isAnswered = answers[index]?.trim() !== '';
          const isMarked = markedForReview[index];
          const isCurrent = index === currentIndex;

          return (
            <button
              key={index}
              onClick={() => onNavigate(index)}
              className={`
                relative w-full aspect-square rounded-lg font-medium text-sm
                flex items-center justify-center transition-all
                ${isCurrent
                  ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800'
                  : ''
                }
                ${isAnswered
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }
                hover:opacity-80
              `}
            >
              {index + 1}
              {isMarked && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-green-100 dark:bg-green-900/30 rounded" />
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-gray-100 dark:bg-gray-700 rounded" />
          <span>Not Answered</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="relative w-3 h-3 bg-gray-100 dark:bg-gray-700 rounded">
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-500 rounded-full" />
          </span>
          <span>Marked</span>
        </div>
      </div>
    </div>
  );
}
