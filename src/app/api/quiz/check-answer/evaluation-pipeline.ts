import { QuizQuestion } from '@/types';

export interface EvaluationResult {
  isCorrect: boolean;
  confidence: number; // 0 to 1
  feedback?: string;
  method: string; // Which stage evaluated this
}

type Evaluator = (
  userAnswer: string,
  expectedOutput: string,
  question: QuizQuestion
) => Promise<EvaluationResult | null>;

/**
 * Normalized string types for internal use
 */
interface NormalizedInput {
  original: string;
  normalized: string;
  tokens: string[];
}

/**
 * Rule Book Constants
 */
const EMPTY_PATTERNS = [
  "", "dont know", "don't know", "not sure", "no idea", "idk", "guess", "?"
];

const RUNTIME_ALIASES: Record<string, string[]> = {
  "global": ["window", "global", "global object", "[object window]", "this (global)"],
  "document.body": ["document.body", "[object htmlbodyelement]", "htmlbodyelement"],
  "promise": ["[object promise]", "promise { <pending> }", "promise {}", "promise"],
  "undefined": ["undefined"]
};

const ERROR_PATTERNS = ["error", "syntaxerror", "typeerror", "referenceerror"];

/**
 * Stage 1: Check for Empty/Give-up Answers
 */
export const checkEmptyAnswer: Evaluator = async (userAnswer) => {
  const lowerArgs = userAnswer.toLowerCase().trim();
  if (EMPTY_PATTERNS.includes(lowerArgs)) {
    return {
      isCorrect: false,
      confidence: 1.0,
      feedback: "Answer indicates no attempt.",
      method: "empty_answer_check"
    };
  }
  return null;
};

/**
 * Normalization Helper
 */
export function normalize(text: string): string {
  let normalized = text
    .trim()
    .toLowerCase()
    .replace(/["'`]/g, '') // strip wrapping quotes (and internal ones for simplicity based on rule "strip_wrapping_quotes" & "normalize_quotes")
    .replace(/\s+/g, ' ') // collapse whitespace
    .replace(/\\n/g, ' ') // normalize newlines to space
    .replace(/\n/g, ' ');

  // Apply runtime aliases
  for (const [canonical, aliases] of Object.entries(RUNTIME_ALIASES)) {
    for (const alias of aliases) {
      if (normalized === alias.toLowerCase()) {
        return canonical;
      }
    }
  }

  return normalized;
}

/**
 * Stage 2: Exact Match
 */
export const checkExactMatch: Evaluator = async (userAnswer, expectedOutput) => {
  const normUser = normalize(userAnswer);
  const normExpected = normalize(expectedOutput);

  if (normUser === normExpected) {
    return {
      isCorrect: true,
      confidence: 1.0,
      feedback: "Correct!",
      method: "exact_match"
    };
  }
  return null;
};

/**
 * Stage 3: Numeric Evaluation
 */
export const checkNumeric: Evaluator = async (userAnswer, expectedOutput) => {
  const userNum = parseFloat(userAnswer);
  const expectedNum = parseFloat(expectedOutput);

  if (!isNaN(userNum) && !isNaN(expectedNum)) {
    if (Math.abs(userNum - expectedNum) < 0.000001) {
       return {
        isCorrect: true,
        confidence: 1.0,
        feedback: "Correct (Numeric)",
        method: "numeric_evaluation"
      };
    }
  }
  return null;
};

/**
 * Stage 4: Error Semantics
 */
export const checkErrorSemantics: Evaluator = async (userAnswer, expectedOutput) => {
  const normUser = userAnswer.toLowerCase();
  const normExpected = expectedOutput.toLowerCase();
  
  const expectedIsError = normExpected.includes('error');
  
  if (expectedIsError) {
    const userHasError = ERROR_PATTERNS.some(p => normUser.includes(p));
    // If expected is error, and user mentions error, we lean towards correct, 
    // but let's be strict: if expected is specifically "ReferenceError" and user says "SyntaxError", that might be wrong.
    // However, the rule book says "Accept answers that correctly identify runtime errors" and "expected_contains: ['error']"
    
    // We check if the SPECIFIC error type matches if present in expected
    if (userHasError) {
       // Check for identifying the *wrong* error type
       // e.g. expected ReferenceError, user says TypeError
       const errorTypes = ["syntaxerror", "typeerror", "referenceerror"];
       for (const type of errorTypes) {
         if (normExpected.includes(type) && !normUser.includes(type) && errorTypes.some(t => normUser.includes(t) && t !== type)) {
           // User mentioned a DIFFERENT error type
           return {
             isCorrect: false,
             confidence: 0.9,
             feedback: `Incorrect error type. Expected ${type}.`,
             method: "error_semantics"
           };
         }
       }
       
       return {
         isCorrect: true,
         confidence: 1.0,
         feedback: "Correctly identified error.",
         method: "error_semantics"
       }
    }
  }
  
  return null;
}

/**
 * Helper for Levenshtein Distance
 */
function levenshtein(a: string, b: string): number {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Stage 5: Semantic Text Match (Fuzzy)
 */
export const checkSemanticText: Evaluator = async (userAnswer, expectedOutput) => {
  const normUser = normalize(userAnswer);
  const normExpected = normalize(expectedOutput);
  
  const distance = levenshtein(normUser, normExpected);
  const maxLength = Math.max(normUser.length, normExpected.length);
  const similarity = 1 - (distance / maxLength);
  
  if (similarity >= 0.78) {
    return {
      isCorrect: true,
      confidence: similarity,
      feedback: "Correct (Fuzzy Match)",
      method: "semantic_text_match"
    };
  }
  
  return null;
}

/**
 * Deep Equality Helper (Order agnostic for objects, strict for arrays by default)
 */
function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  
  if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
    return false;
  }
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }
  
  return true;
}

/**
 * Helper for loose array comparison (order insensitive)
 */
function compareArraysLoose(arr1: any[], arr2: any[]): boolean {
  if (arr1.length !== arr2.length) return false;
  
  // Clone arr2 to track matched items
  const pool = [...arr2];
  
  for (const item1 of arr1) {
    const matchIndex = pool.findIndex(item2 => deepEqual(item1, item2));
    if (matchIndex === -1) return false;
    pool.splice(matchIndex, 1);
  }
  
  return true;
}

/**
 * Pre-AI Structural Check (JSON/Array/Object)
 */
export const checkStructural: Evaluator = async (userAnswer, expectedOutput) => {
    try {
        if (!expectedOutput.trim().match(/^(\{|\[)/)) {
            return null;
        }

        const expectedObj = JSON.parse(expectedOutput);
        
        // Relaxed parsing for user answer
        let jsonReadyUser = userAnswer
          .replace(/'/g, '"')
          .replace(/(\w+):/g, '"$1":'); // Quote unquoted keys (naive)
          
        const userObj = JSON.parse(jsonReadyUser);
        
        // 1. Strict Structural Match (Objects order-agnostic, Arrays strict)
        if (deepEqual(expectedObj, userObj)) {
             return {
                isCorrect: true,
                confidence: 1.0,
                feedback: "Correct (Structural)",
                method: "structural_comparison"
            }; 
        }
        
        // 2. Loose Array Match (Rule: order_insensitive_if max_length: 8)
        if (Array.isArray(expectedObj) && Array.isArray(userObj)) {
          if (expectedObj.length <= 8 && compareArraysLoose(expectedObj, userObj)) {
             return {
                isCorrect: true,
                confidence: 1.0,
                feedback: "Correct (Structural - Loose Order)",
                method: "structural_comparison_loose"
            }; 
          }
        }
        
    } catch (e) {
        // parsing failed
    }
    return null;
}

/**
 * Main Evaluation Pipeline
 */
export async function evaluateAnswer(
  userAnswer: string, 
  expectedOutput: string, 
  question: QuizQuestion,
  aiCheckFn?: Evaluator // Injectable for the route handler to provide the AI call
): Promise<EvaluationResult> {
  
  // Pipeline order defined in "evaluation_pipeline"
  const pipeline = [
    checkEmptyAnswer,
    // normalization is implicit in matchers
    checkExactMatch,
    checkNumeric,
    checkErrorSemantics,
    checkStructural,
    // runtime_alias_mapping is implicit in normalization
    checkSemanticText,
    aiCheckFn // The AI judgment
  ];

  for (const step of pipeline) {
    if (step) {
      const result = await step(userAnswer, expectedOutput, question);
      if (result) {
        // If we get a definitive result (checking rules: most return if correct/incorrect)
        // Rule book: "Prefer false negatives over false positives" -> strict.
        // But our steps mostly return "correct" or null(continue).
        // Exceptions: checkEmptyAnswer returns "incorrect".
        return result;
      }
    }
  }

  // If all deterministic steps fail, and no AI check provided or AI check also failed/abstained?
  // If we reached here, and we have an AI function, it should have been called last.
  // If no AI function, or it returned null (unlikely for AI), fallback to incorrect.
  
  return {
    isCorrect: false,
    confidence: 0.0,
    feedback: "Answer does not match expected output.",
    method: "fallback_rejection"
  };
}
