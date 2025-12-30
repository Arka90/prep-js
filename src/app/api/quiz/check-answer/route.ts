import { NextRequest, NextResponse } from 'next/server';
import { QuizQuestion } from '@/types';

interface CheckAnswerRequest {
  question: QuizQuestion;
  userAnswer: string;
}

interface CheckResult {
  isCorrect: boolean;
  feedback?: string;
}

/**
 * Normalize answer for basic comparison before calling AI
 */
function normalizeAnswer(answer: string): string {
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

/**
 * Check if answers match with various normalizations
 */
function basicAnswerMatch(userAnswer: string, expectedOutput: string): boolean {
  const normalizedUser = normalizeAnswer(userAnswer);
  const normalizedExpected = normalizeAnswer(expectedOutput);
  
  // Direct match
  if (normalizedUser === normalizedExpected) {
    return true;
  }
  
  // Try matching with newlines replaced by spaces and vice versa
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

export async function POST(request: NextRequest) {
  try {
    const { question, userAnswer }: CheckAnswerRequest = await request.json();

    if (!question || userAnswer === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // First, try basic matching
    if (basicAnswerMatch(userAnswer, question.expected_output)) {
      return NextResponse.json({
        isCorrect: true,
        feedback: 'Correct!',
      } as CheckResult);
    }

    // If basic matching fails, use AI to check conceptual correctness
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // Fall back to strict comparison if no API key
      return NextResponse.json({
        isCorrect: false,
        feedback: 'Answer does not match expected output.',
      } as CheckResult);
    }

    const aiPrompt = `You are a JavaScript quiz answer checker. Your job is to determine if a user's answer is conceptually correct, even if it has minor formatting differences, typos, or variations in representation.

Code snippet:
\`\`\`javascript
${question.code_snippet}
\`\`\`

Expected output: "${question.expected_output}"
User's answer: "${userAnswer}"

Rules for checking:
1. The answer should capture the correct OUTPUT of the code
2. Accept minor formatting differences like:
   - "1\\n2\\n3" is same as "1 2 3" or "1, 2, 3"
   - "undefined" is same as "Undefined" or "UNDEFINED"
   - Extra/missing quotes around strings
   - Minor typos in error messages
3. The CONCEPT must be correct - if the output should be "1" but user says "2", that's wrong
4. Be lenient with whitespace and newline representations
5. Accept both "ReferenceError" and "ReferenceError: x is not defined"

Respond with ONLY a JSON object:
{
  "isCorrect": true/false,
  "feedback": "Brief explanation of why correct/incorrect"
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'user',
            content: aiPrompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      // Fall back to strict comparison on API error
      console.error('OpenAI API error in answer check');
      return NextResponse.json({
        isCorrect: false,
        feedback: 'Answer does not match expected output.',
      } as CheckResult);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const result = JSON.parse(content) as CheckResult;
      return NextResponse.json(result);
    } catch {
      return NextResponse.json({
        isCorrect: false,
        feedback: 'Unable to verify answer.',
      } as CheckResult);
    }
  } catch (error) {
    console.error('Answer check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
