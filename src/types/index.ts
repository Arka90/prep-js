// Database types matching Supabase schema
export interface User {
  id: string;
  access_key: string;
  created_at: string;
  current_streak: number;
  total_points: number;
  level: number;
  last_quiz_date: string | null;
}

export interface QuizQuestion {
  question_number: number;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  code_snippet: string;
  expected_output: string;
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  day_number: number;
  questions: QuizQuestion[];
  user_answers: string[];
  score: number;
  time_taken: number; // seconds
  completed_at: string;
  created_at: string;
  manual_corrections?: number[];
}

export interface TopicPerformance {
  id: string;
  user_id: string;
  topic_name: string;
  total_attempts: number;
  correct_attempts: number;
  last_updated: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  achievement_type: AchievementType;
  unlocked_at: string;
}

export interface CoveredSubtopic {
  id: string;
  user_id: string;
  main_topic: string;
  subtopic: string;
  covered_at: string;
}

export type AchievementType =
  | "perfect_score"
  | "speed_demon"
  | "streak_7"
  | "streak_30"
  | "streak_100"
  | "topic_master_closures"
  | "topic_master_hoisting"
  | "topic_master_this_keyword"
  | "topic_master_type_coercion"
  | "topic_master_prototypes"
  | "topic_master_event_loop"
  | "topic_master_scope"
  | "topic_master_equality"
  | "topic_master_arrow_functions"
  | "topic_master_truthy_falsy"
  | "topic_master_operator_precedence"
  | "topic_master_array_object"
  | "topic_master_iife"
  | "topic_master_promises"
  | "topic_master_strict_mode"
  | "first_quiz"
  | "level_5"
  | "level_10"
  | "level_20";

export const JS_TOPICS = [
  "Closures",
  "Hoisting",
  "The this Keyword",
  "Type Coercion",
  "Prototypes and Inheritance",
  "Event Loop and Asynchronous Execution",
  "Scope (Lexical vs Block)",
  "Equality Operators (== vs ===)",
  "Arrow Functions",
  "Truthy/Falsy Values",
  "Operator Precedence and Associativity",
  "Array and Object Behaviors",
  "IIFEs",
  "Promises and Async/Await",
  "Strict Mode",
] as const;

export const REACT_TOPICS = [
  "JSX and Elements",
  "Components and Props",
  "State and Lifecycle",
  "Hooks",
  "useEffect and Side Effects",
  "useCallback and useMemo",
  "useRef and DOM Manipulation",
  "Context API",
  "React Router",
  "Component Patterns",
  "Performance Optimization",
  "Error Boundaries",
  "Portals and Fragments",
  "Controlled vs Uncontrolled Components",
  "Virtual DOM and Reconciliation",
  "Redux and State Management",
  "Testing React Components",
  "Server-Side Rendering",
] as const;

export type ReactTopic = (typeof REACT_TOPICS)[number];

export interface ReactQuizQuestion {
  question_number: number;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  question_type: "output" | "concept" | "behavior" | "debugging";
  code_snippet?: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export interface ReactQuizAttempt {
  id: string;
  user_id: string;
  day_number: number;
  questions: ReactQuizQuestion[];
  user_answers: string[];
  score: number;
  time_taken: number;
  completed_at: string;
  created_at: string;
}

export type ReactAchievementType =
  | "react_first_quiz"
  | "react_perfect_score"
  | "react_speed_demon"
  | "react_streak_7"
  | "react_streak_30"
  | "react_level_5"
  | "react_level_10"
  | "react_topic_master_hooks"
  | "react_topic_master_state"
  | "react_topic_master_effects"
  | "react_topic_master_context"
  | "react_topic_master_performance";

export const REACT_ACHIEVEMENTS: AchievementInfo[] = [
  {
    type: "react_first_quiz" as AchievementType,
    name: "React Beginner",
    description: "Complete your first React quiz",
    icon: "⚛️",
  },
  {
    type: "react_perfect_score" as AchievementType,
    name: "React Perfectionist",
    description: "Score 10/10 on any React quiz",
    icon: "🎯",
  },
  {
    type: "react_speed_demon" as AchievementType,
    name: "React Speed Master",
    description: "Complete a React quiz under 10 minutes with >80%",
    icon: "⚡",
  },
  {
    type: "react_streak_7" as AchievementType,
    name: "React Week Warrior",
    description: "Maintain a 7-day React quiz streak",
    icon: "🔥",
  },
  {
    type: "react_streak_30" as AchievementType,
    name: "React Month Master",
    description: "Maintain a 30-day React quiz streak",
    icon: "💪",
  },
  {
    type: "react_level_5" as AchievementType,
    name: "React Rising Star",
    description: "Reach React level 5",
    icon: "⭐",
  },
  {
    type: "react_level_10" as AchievementType,
    name: "React Expert",
    description: "Reach React level 10",
    icon: "🌟",
  },
  {
    type: "react_topic_master_hooks" as AchievementType,
    name: "Hooks Master",
    description: "Master React Hooks",
    icon: "🪝",
  },
  {
    type: "react_topic_master_state" as AchievementType,
    name: "State Guru",
    description: "Master State Management",
    icon: "📊",
  },
  {
    type: "react_topic_master_effects" as AchievementType,
    name: "Effects Expert",
    description: "Master useEffect and Side Effects",
    icon: "✨",
  },
  {
    type: "react_topic_master_context" as AchievementType,
    name: "Context Champion",
    description: "Master Context API",
    icon: "🌐",
  },
  {
    type: "react_topic_master_performance" as AchievementType,
    name: "Performance Pro",
    description: "Master Performance Optimization",
    icon: "🚀",
  },
];

export type JSTopic = (typeof JS_TOPICS)[number];

export interface QuizState {
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  answers: string[];
  markedForReview: boolean[];
  timeRemaining: number;
  isLoading: boolean;
  isSubmitted: boolean;
  startTime: number | null;
}

export interface UserStats {
  totalQuizzes: number;
  averageScore: number;
  bestScore: number;
  currentStreak: number;
  totalPoints: number;
  level: number;
  weakestTopic: string | null;
  strongestTopic: string | null;
}

export interface TopicStats {
  topic: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
}

export interface DailyScore {
  date: string;
  score: number;
}

export interface AchievementInfo {
  type: AchievementType;
  name: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: AchievementInfo[] = [
  {
    type: "perfect_score",
    name: "Perfect Score",
    description: "Score 10/10 on any quiz",
    icon: "🏆",
  },
  {
    type: "speed_demon",
    name: "Speed Demon",
    description: "Complete a quiz under 10 minutes with >80%",
    icon: "⚡",
  },
  {
    type: "streak_7",
    name: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: "🔥",
  },
  {
    type: "streak_30",
    name: "Month Master",
    description: "Maintain a 30-day streak",
    icon: "💪",
  },
  {
    type: "streak_100",
    name: "Century Champion",
    description: "Maintain a 100-day streak",
    icon: "👑",
  },
  {
    type: "first_quiz",
    name: "First Steps",
    description: "Complete your first quiz",
    icon: "🚀",
  },
  {
    type: "level_5",
    name: "Rising Star",
    description: "Reach level 5",
    icon: "⭐",
  },
  {
    type: "level_10",
    name: "Expert",
    description: "Reach level 10",
    icon: "🌟",
  },
  {
    type: "level_20",
    name: "JavaScript Guru",
    description: "Reach level 20",
    icon: "🧙",
  },
  {
    type: "topic_master_closures",
    name: "Closure Expert",
    description: "Master Closures topic",
    icon: "🔒",
  },
  {
    type: "topic_master_hoisting",
    name: "Hoisting Pro",
    description: "Master Hoisting topic",
    icon: "🏗️",
  },
  {
    type: "topic_master_this_keyword",
    name: "This Whisperer",
    description: "Master the this Keyword",
    icon: "👆",
  },
  {
    type: "topic_master_type_coercion",
    name: "Type Juggler",
    description: "Master Type Coercion",
    icon: "🎭",
  },
  {
    type: "topic_master_promises",
    name: "Promise Keeper",
    description: "Master Promises",
    icon: "🤝",
  },
];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, "id" | "created_at">;
        Update: Partial<User>;
      };
      quiz_attempts: {
        Row: QuizAttempt;
        Insert: Omit<QuizAttempt, "id" | "created_at">;
        Update: Partial<QuizAttempt>;
      };
      topic_performance: {
        Row: TopicPerformance;
        Insert: Omit<TopicPerformance, "id">;
        Update: Partial<TopicPerformance>;
      };
      achievements: {
        Row: Achievement;
        Insert: Omit<Achievement, "id">;
        Update: Partial<Achievement>;
      };
      covered_subtopics: {
        Row: CoveredSubtopic;
        Insert: Omit<CoveredSubtopic, "id">;
        Update: Partial<CoveredSubtopic>;
      };
      revision_items: {
        Row: RevisionItem;
        Insert: Omit<RevisionItem, "id" | "created_at">;
        Update: Partial<RevisionItem>;
      };
      flashcards: {
        Row: Flashcard;
        Insert: Omit<Flashcard, "id" | "created_at" | "last_reviewed_at">;
        Update: Partial<Flashcard>;
      };
      flashcard_reviews: {
        Row: FlashcardReview;
        Insert: Omit<FlashcardReview, "id" | "reviewed_at">;
        Update: Partial<FlashcardReview>;
      };
    };
  };
}

export interface RevisionItem {
  id: string;
  user_id: string;
  question: QuizQuestion;
  user_answer: string;
  created_at: string;
  notes?: string;
}

export type FlashcardType =
  | "misconception_breaker"
  | "prediction"
  | "contrast"
  | "edge_case";
export type FlashcardStatus = "new" | "reviewing" | "validated" | "mastered";
export type FlashcardConfidence =
  | "not_confident"
  | "somewhat_confident"
  | "confident";

export interface Flashcard {
  id: string;
  user_id: string;
  topic: string;
  concept_name: string;
  concept_description: string | null;
  front_content: {
    code_snippet?: string;
    question_text: string;
    options?: string[];
  };
  back_content: {
    explanation: string;
    correct_mental_model: string;
    expected_output?: string;
  };
  card_type: FlashcardType;
  status: FlashcardStatus;
  confidence_level: number;
  next_review_at: string;
  last_reviewed_at: string | null;
  created_at: string;
}

export interface FlashcardReview {
  id: string;
  flashcard_id: string;
  user_id: string;
  rating: FlashcardConfidence;
  reviewed_at: string;
}
