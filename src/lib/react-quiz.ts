import { ReactQuizQuestion } from "@/types";

interface TargetSubtopic {
  mainTopic: string;
  subtopic: string;
}

const REACT_QUIZ_PROMPT = `You are a React interview question generator specializing in testing deep understanding of React concepts. Generate questions that test component behavior, hooks usage, state management, and React-specific patterns.

Topics to draw from (cycle through them evenly, but mix as needed for variety):
JSX and Elements, Components and Props, State and Lifecycle, Hooks, useEffect and Side Effects, useCallback and useMemo, useRef and DOM Manipulation, Context API, React Router, Component Patterns, Performance Optimization, Error Boundaries, Portals and Fragments, Controlled vs Uncontrolled Components, Virtual DOM and Reconciliation, Redux and State Management, Testing React Components, Server-Side Rendering

Question Types to include:
1. OUTPUT: Code snippets where candidates predict what renders or what console.log outputs
2. CONCEPT: Multiple choice about React concepts and best practices
3. BEHAVIOR: What happens when X occurs (re-renders, state updates, etc.)
4. DEBUGGING: Identify the bug or issue in a code snippet

Rules for generation:
1. Generate exactly 10 NEW questions. Never repeat questions from previous attempts.
2. Each question must have 4 options (A, B, C, D) with one correct answer
3. IMPORTANT: For code-based questions, provide properly formatted code with newlines and indentation
4. Difficulty distribution based on DAY NUMBER {day_number}:
   - Days 1-7: 5 easy, 3 medium, 2 hard
   - Days 8-14: 2 easy, 4 medium, 4 hard
   - Days 15+: 1 easy, 2 medium, 7 hard
5. Label each question with topic, difficulty, and type
6. Include modern React patterns (hooks, functional components)
7. Return response as valid JSON with structure:
   {
     "questions": [
       {
         "question_number": 1,
         "topic": "Hooks",
         "difficulty": "Easy",
         "question_type": "output",
         "code_snippet": "...",
         "question_text": "What will be rendered?",
         "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
         "correct_answer": "A",
         "explanation": "..."
       }
     ]
   }

Generate for Day {day_number}.`;

const REACT_QUIZ_PROMPT_WITH_TOPICS = `You are a React interview question generator specializing in testing deep understanding of React concepts. Generate questions that test component behavior, hooks usage, state management, and React-specific patterns.

IMPORTANT: Generate questions specifically covering these React concepts that the user has NOT practiced before:
{target_subtopics}

Question Types to include:
1. OUTPUT: Code snippets where candidates predict what renders or what console.log outputs
2. CONCEPT: Multiple choice about React concepts and best practices
3. BEHAVIOR: What happens when X occurs (re-renders, state updates, etc.)
4. DEBUGGING: Identify the bug or issue in a code snippet

Rules for generation:
1. Generate exactly 10 NEW and UNIQUE questions focused on the specified concepts above
2. Each question must have 4 options (A, B, C, D) with one correct answer
3. IMPORTANT: For code-based questions, provide properly formatted code with newlines and indentation
4. Difficulty distribution based on DAY NUMBER {day_number}:
   - Days 1-7: 5 easy, 3 medium, 2 hard
   - Days 8-14: 2 easy, 4 medium, 4 hard
   - Days 15+: 1 easy, 2 medium, 7 hard
5. Label each question with topic, difficulty, and type
6. Include modern React patterns (hooks, functional components)
7. Make questions test deep understanding, not just surface-level knowledge
8. Return response as valid JSON with structure:
   {
     "questions": [
       {
         "question_number": 1,
         "topic": "Hooks",
         "difficulty": "Easy",
         "question_type": "output",
         "code_snippet": "...",
         "question_text": "What will be rendered?",
         "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
         "correct_answer": "A",
         "explanation": "..."
       }
     ]
   }

Generate for Day {day_number} using the specified concepts.`;

export interface GeneratedReactQuizResult {
  questions: ReactQuizQuestion[];
  targetSubtopics?: TargetSubtopic[];
}

export async function generateReactQuiz(
  dayNumber: number,
  userId?: string,
): Promise<GeneratedReactQuizResult> {
  const response = await fetch("/api/react-quiz/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ dayNumber, userId }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate React quiz");
  }

  const data = await response.json();
  return {
    questions: data.questions,
    targetSubtopics: data.targetSubtopics,
  };
}

export function getReactQuizPrompt(dayNumber: number): string {
  return REACT_QUIZ_PROMPT.replace(/{day_number}/g, String(dayNumber));
}

export function getReactQuizPromptWithTopics(
  dayNumber: number,
  targetSubtopics: TargetSubtopic[],
): string {
  const subtopicsList = targetSubtopics
    .map((t) => `- ${t.mainTopic}: ${t.subtopic}`)
    .join("\n");

  return REACT_QUIZ_PROMPT_WITH_TOPICS.replace(
    /{day_number}/g,
    String(dayNumber),
  ).replace(/{target_subtopics}/g, subtopicsList);
}

export function calculateReactScore(
  questions: ReactQuizQuestion[],
  userAnswers: string[],
): { score: number; correct: boolean[] } {
  const correct: boolean[] = [];
  let score = 0;

  questions.forEach((question, index) => {
    const userAnswer = (userAnswers[index] || "").trim().toUpperCase();
    const expectedAnswer = question.correct_answer.trim().toUpperCase();

    // Check if the answer matches (just the letter A, B, C, D)
    const isCorrect =
      userAnswer === expectedAnswer ||
      userAnswer.startsWith(expectedAnswer + ")") ||
      userAnswer.startsWith(expectedAnswer + " ");

    correct.push(isCorrect);
    if (isCorrect) score++;
  });

  return { score, correct };
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case "Easy":
      return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30";
    case "Medium":
      return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30";
    case "Hard":
      return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30";
    default:
      return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30";
  }
}

export function getQuestionTypeIcon(type: string): string {
  switch (type) {
    case "output":
      return "💻";
    case "concept":
      return "📚";
    case "behavior":
      return "🔄";
    case "debugging":
      return "🐛";
    default:
      return "❓";
  }
}
