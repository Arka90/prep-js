'use client';

import { useEffect, useState } from 'react';
import { formatTime } from '@/lib/quiz';

interface QuizTimerProps {
  timeRemaining: number;
  onTimeUp: () => void;
  onTick: () => void;
}

export function QuizTimer({ timeRemaining, onTimeUp, onTick }: QuizTimerProps) {
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    if (timeRemaining <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      onTick();
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, onTimeUp, onTick]);

  useEffect(() => {
    setIsWarning(timeRemaining <= 120); // 2 minutes warning
  }, [timeRemaining]);

  return (
    <div
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold
        ${isWarning 
          ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse' 
          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
        }
      `}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span>{formatTime(timeRemaining)}</span>
    </div>
  );
}
