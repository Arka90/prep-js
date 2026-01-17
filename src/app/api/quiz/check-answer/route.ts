import { NextRequest, NextResponse } from 'next/server';
import { QuizQuestion } from '@/types';
import { evaluateAnswer, EvaluationResult } from './evaluation-pipeline';

interface CheckAnswerRequest {
  question: QuizQuestion;
  userAnswer: string;
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

    // AI Check Function (injected into pipeline)
    const aiCheckFn = async (userAnswer: string, expectedOutput: string, question: QuizQuestion): Promise<EvaluationResult | null> => {
      const apiKey = process.env.OPENAI_API_KEY;

      if (!apiKey) {
        console.warn('No OpenAI key found, skipping AI check');
        return null; // Pipeline will fallback to rejection
      }

      const aiPrompt = `You are a JavaScript quiz answer checker. Your job is to determine if a user's answer is conceptually correct, even if it has minor formatting differences, typos, or variations in representation.

Code snippet:
\`\`\`javascript
${question.code_snippet}
\`\`\`

Expected output: "${expectedOutput}"
User's answer: "${userAnswer}"

Rules for checking:
1. The answer should capture the correct OUTPUT of the code
2. Accept minor formatting differences
3. The CONCEPT must be correct
4. Be lenient with whitespace and newline representations
5. Accept both "ReferenceError" and "ReferenceError: x is not defined"

Respond with ONLY a JSON object:
{
  "isCorrect": true/false,
  "confidence": number (0.0 - 1.0),
  "feedback": "Brief explanation of why correct/incorrect"
}`;

      try {
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
          console.error('OpenAI API error:', response.statusText);
          return null;
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        const result = JSON.parse(content);
        
        // Map AI result to our EvaluationResult
        if (typeof result.isCorrect === 'boolean') {
           return {
             isCorrect: result.isCorrect,
             confidence: result.confidence || 0.8, // Default confidence if missing
             feedback: result.feedback,
             method: "ai_conceptual_judgment"
           };
        }
      } catch (error) {
        console.error('AI Check failed:', error);
      }
      return null;
    };

    // Run the pipeline
    const result = await evaluateAnswer(userAnswer, question.expected_output, question, aiCheckFn);

    // If result is correct, or if it is incorrect with high confidence, return it.
    // The pipeline returns a definitive result or a fallback rejection.
    // We can directly return the result.
    
    // We map EvaluationResult to the API response format { isCorrect, feedback }
    // We might want to include confidence/method for debugging/logging if needed, but for now stick to interface.
    
    // Log for "auditability" requirement
    console.log(`[Eval] Method: ${result.method}, Correct: ${result.isCorrect}, Confidence: ${result.confidence}`);

    return NextResponse.json({
      isCorrect: result.isCorrect,
      feedback: result.feedback || (result.isCorrect ? 'Correct!' : 'Incorrect'),
    });

  } catch (error) {
    console.error('Answer check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

