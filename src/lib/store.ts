import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { QuizQuestion, UserStats, Achievement } from '@/types';

interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  setAuthenticated: (authenticated: boolean, userId?: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      userId: null,
      setAuthenticated: (authenticated, userId = null) =>
        set({ isAuthenticated: authenticated, userId }),
      logout: () => set({ isAuthenticated: false, userId: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

interface QuizState {
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  answers: string[];
  markedForReview: boolean[];
  timeRemaining: number;
  isLoading: boolean;
  isSubmitted: boolean;
  startTime: number | null;
  quizId: string | null;
  
  setQuestions: (questions: QuizQuestion[]) => void;
  setCurrentQuestion: (index: number) => void;
  setAnswer: (index: number, answer: string) => void;
  toggleMarkForReview: (index: number) => void;
  setTimeRemaining: (time: number) => void;
  decrementTime: () => void;
  setLoading: (loading: boolean) => void;
  setSubmitted: (submitted: boolean) => void;
  setStartTime: (time: number) => void;
  setQuizId: (id: string) => void;
  resetQuiz: () => void;
}

const initialQuizState = {
  questions: [],
  currentQuestionIndex: 0,
  answers: [],
  markedForReview: [],
  timeRemaining: 20 * 60, // 20 minutes in seconds
  isLoading: false,
  isSubmitted: false,
  startTime: null,
  quizId: null,
};

export const useQuizStore = create<QuizState>()(
  persist(
    (set) => ({
      ...initialQuizState,
      
      setQuestions: (questions) =>
        set({
          questions,
          answers: new Array(questions.length).fill(''),
          markedForReview: new Array(questions.length).fill(false),
        }),
      
      setCurrentQuestion: (index) => set({ currentQuestionIndex: index }),
      
      setAnswer: (index, answer) =>
        set((state) => {
          const newAnswers = [...state.answers];
          newAnswers[index] = answer;
          return { answers: newAnswers };
        }),
      
      toggleMarkForReview: (index) =>
        set((state) => {
          const newMarked = [...state.markedForReview];
          newMarked[index] = !newMarked[index];
          return { markedForReview: newMarked };
        }),
      
      setTimeRemaining: (time) => set({ timeRemaining: time }),
      
      decrementTime: () =>
        set((state) => ({
          timeRemaining: Math.max(0, state.timeRemaining - 1),
        })),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setSubmitted: (submitted) => set({ isSubmitted: submitted }),
      
      setStartTime: (time) => set({ startTime: time }),
      
      setQuizId: (id) => set({ quizId: id }),
      
      resetQuiz: () => set(initialQuizState),
    }),
    {
      name: 'quiz-storage',
    }
  )
);

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (dark: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDarkMode: false,
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      setTheme: (dark) => set({ isDarkMode: dark }),
    }),
    {
      name: 'theme-storage',
    }
  )
);

interface UserStatsState {
  stats: UserStats | null;
  achievements: Achievement[];
  setStats: (stats: UserStats) => void;
  setAchievements: (achievements: Achievement[]) => void;
}

export const useUserStatsStore = create<UserStatsState>()((set) => ({
  stats: null,
  achievements: [],
  setStats: (stats) => set({ stats }),
  setAchievements: (achievements) => set({ achievements }),
}));
