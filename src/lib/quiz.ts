import { QuizQuestion } from '@/types';
import { formatJavaScript } from '@/lib/formatting';

interface TargetSubtopic {
  mainTopic: string;
  subtopic: string;
}

const OPENAI_PROMPT = `You are a JavaScript interview question generator specializing in tricky input-output puzzles. These questions test core JS concepts through code snippets where candidates predict the console output, revealing subtle behaviors like hoisting or coercion.

Topics to draw from exclusively (cycle through them evenly, but mix as needed for variety):
Closures, Hoisting, The this Keyword, Type Coercion, Prototypes and Inheritance, Event Loop and Asynchronous Execution, Scope (Lexical vs Block), Equality Operators (== vs ===), Arrow Functions, Truthy/Falsy Values, Operator Precedence and Associativity, Array and Object Behaviors, IIFEs, Promises and Async/Await, Strict Mode

Rules for generation:
1. Generate exactly 10 NEW questions. Never repeat questions from previous attempts.
2. Each question format: Code snippet (<15 lines) + "What is the output?" + Expected output + Brief explanation
3. IMPORTANT: Provide the code snippet properly formatted with newlines and indentation. DO NOT minify the code.
4. Difficulty distribution based on DAY NUMBER {day_number}:
   - Days 1-7: 5 easy, 3 medium, 2 hard
   - Days 8-14: 2 easy, 4 medium, 4 hard
   - Days 15+: 1 easy, 2 medium, 7 hard
5. Label each question with topic and difficulty (e.g., "1. Closures (Easy):")
6. Vary environments: Mix ES5/ES6+, strict/non-strict mode
7. Return response as valid JSON array with structure:
   [
     {
       "question_number": 1,
       "topic": "Closures",
       "difficulty": "Easy",
       "code_snippet": "...",
       "expected_output": "...",
       "explanation": "..."
     }
   ]

Generate for Day {day_number}.`;

const OPENAI_PROMPT_WITH_TOPICS = `You are a JavaScript interview question generator specializing in tricky input-output puzzles. These questions test core JS concepts through code snippets where candidates predict the console output, revealing subtle behaviors like hoisting or coercion.

IMPORTANT: Generate questions specifically covering these concepts that the user has NOT practiced before:
{target_subtopics}

Rules for generation:
1. Generate exactly 10 NEW and UNIQUE questions focused on the specified concepts above.
2. Each question format: Code snippet (<15 lines) + "What is the output?" + Expected output + Brief explanation
3. IMPORTANT: Provide the code snippet properly formatted with newlines and indentation. DO NOT minify the code.
4. Difficulty distribution based on DAY NUMBER {day_number}:
   - Days 1-7: 5 easy, 3 medium, 2 hard
   - Days 8-14: 2 easy, 4 medium, 4 hard
   - Days 15+: 1 easy, 2 medium, 7 hard
5. Label each question with topic and difficulty (e.g., "1. Closures (Easy):")
6. Vary environments: Mix ES5/ES6+, strict/non-strict mode
7. Make sure questions are creative and test deep understanding, not just basic knowledge
8. Return response as valid JSON with structure:
   {
     "questions": [
       {
         "question_number": 1,
         "topic": "Closures",
         "difficulty": "Easy",
         "code_snippet": "...",
         "expected_output": "...",
         "explanation": "..."
       }
     ]
   }

Generate for Day {day_number} using the specified concepts.`;

export interface GeneratedQuizResult {
  questions: QuizQuestion[];
  targetSubtopics?: TargetSubtopic[];
}

export async function generateQuiz(dayNumber: number, userId?: string): Promise<GeneratedQuizResult> {
  const response = await fetch('/api/quiz/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ dayNumber, userId }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate quiz');
  }

  const data = await response.json();
  return {
    questions: data.questions,
    targetSubtopics: data.targetSubtopics,
  };
}

export function getOpenAIPrompt(dayNumber: number): string {
  return OPENAI_PROMPT.replace(/{day_number}/g, String(dayNumber));
}

export function getOpenAIPromptWithTopics(
  dayNumber: number,
  targetSubtopics: TargetSubtopic[]
): string {
  const subtopicsList = targetSubtopics
    .map(t => `- ${t.mainTopic}: ${t.subtopic}`)
    .join('\n');
  
  return OPENAI_PROMPT_WITH_TOPICS
    .replace(/{day_number}/g, String(dayNumber))
    .replace(/{target_subtopics}/g, subtopicsList);
}

export function calculateScore(
  questions: QuizQuestion[],
  userAnswers: string[]
): { score: number; correct: boolean[] } {
  const correct: boolean[] = [];
  let score = 0;

  questions.forEach((question, index) => {
    const userAnswer = (userAnswers[index] || '').trim().toLowerCase();
    const expectedAnswer = question.expected_output.trim().toLowerCase();
    
    // More lenient comparison - check if the core answer matches
    const isCorrect = 
      userAnswer === expectedAnswer ||
      normalizeAnswer(userAnswer) === normalizeAnswer(expectedAnswer);
    
    correct.push(isCorrect);
    if (isCorrect) score++;
  });

  return { score, correct };
}


export function normalizeAnswer(answer: string): string {
  return answer
    .trim()
    .toLowerCase()
    .replace(/["'`]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\\n/g, '\n')
    .replace(/\n/g, ' ')
    .replace(/undefined/gi, 'undefined')
    .replace(/null/gi, 'null')
    .replace(/nan/gi, 'NaN')
    .replace(/true/gi, 'true')
    .replace(/false/gi, 'false');
}

export function basicAnswerMatch(userAnswer: string, expectedOutput: string): boolean {
  const normalizedUser = normalizeAnswer(userAnswer);
  const normalizedExpected = normalizeAnswer(expectedOutput);
  
  // Direct match
  if (normalizedUser === normalizedExpected) {
    return true;
  }
  
  // Try matching with newlines replaced by spaces
  const userNoNewlines = normalizedUser.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  const expectedNoNewlines = normalizedExpected.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  
  if (userNoNewlines === expectedNoNewlines) {
    return true;
  }
  
  // Try matching numbers/values as separate tokens
  const userTokens = normalizedUser.split(/[\s,]+/).filter(t => t.length > 0);
  const expectedTokens = normalizedExpected.split(/[\s,]+/).filter(t => t.length > 0);
  
  if (userTokens.length === expectedTokens.length && 
      userTokens.every((t, i) => t === expectedTokens[i])) {
    return true;
  }
  
  return false;
}

export function calculatePoints(score: number, timeTaken: number): number {
  // Base points: 10 per correct answer
  const basePoints = score * 10;
  
  // Time bonus: up to 50 points for fast completion
  // Full bonus if completed in under 5 minutes, decreasing linearly
  const maxTimeForBonus = 5 * 60; // 5 minutes
  const timeBonus = timeTaken < maxTimeForBonus 
    ? Math.round(50 * (1 - timeTaken / maxTimeForBonus))
    : 0;
  
  // Perfect score bonus
  const perfectBonus = score === 10 ? 25 : 0;
  
  return basePoints + timeBonus + perfectBonus;
}

export function calculateLevel(totalPoints: number): number {
  // Level progression: Each level requires more points
  // Level 1: 0 points, Level 2: 100 points, Level 3: 250 points, etc.
  if (totalPoints < 100) return 1;
  if (totalPoints < 250) return 2;
  if (totalPoints < 500) return 3;
  if (totalPoints < 850) return 4;
  if (totalPoints < 1300) return 5;
  if (totalPoints < 1850) return 6;
  if (totalPoints < 2500) return 7;
  if (totalPoints < 3250) return 8;
  if (totalPoints < 4100) return 9;
  if (totalPoints < 5000) return 10;
  if (totalPoints < 6000) return 11;
  if (totalPoints < 7100) return 12;
  if (totalPoints < 8300) return 13;
  if (totalPoints < 9600) return 14;
  if (totalPoints < 11000) return 15;
  if (totalPoints < 12500) return 16;
  if (totalPoints < 14100) return 17;
  if (totalPoints < 15800) return 18;
  if (totalPoints < 17600) return 19;
  return 20;
}

export function getPointsForNextLevel(currentPoints: number): number {
  const thresholds = [0, 100, 250, 500, 850, 1300, 1850, 2500, 3250, 4100, 5000, 
                      6000, 7100, 8300, 9600, 11000, 12500, 14100, 15800, 17600, Infinity];
  const currentLevel = calculateLevel(currentPoints);
  return thresholds[currentLevel] - currentPoints;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatCodeSnippet(code: string): string {
  return formatJavaScript(code);
}

export function getDayNumber(firstQuizDate: string | null): number {
  if (!firstQuizDate) return 1;
  
  const first = new Date(firstQuizDate);
  const now = new Date();
  
  // Calculate difference in days, ensuring positive value only if now >= first
  const diffTime = now.getTime() - first.getTime();
  
  // If the first quiz is in the future (shouldn't happen), return 1
  if (diffTime < 0) return 1;
  
  // Use floor and add 1 to get day number (day 1 is the first day)
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  return Math.max(1, diffDays);
}
