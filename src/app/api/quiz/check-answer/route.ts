import { NextRequest, NextResponse } from "next/server";
import { QuizQuestion } from "@/types";
import { evaluateAnswer, EvaluationResult } from "./evaluation-pipeline";
import { callAI, AIProvider } from "@/lib/ai-client";

interface CheckAnswerRequest {
  question: QuizQuestion;
  userAnswer: string;
  provider?: AIProvider;
}

export async function POST(request: NextRequest) {
  try {
    const {
      question,
      userAnswer,
      provider = "openai",
    }: CheckAnswerRequest = await request.json();

    if (!question || userAnswer === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // AI Check Function (injected into pipeline)
    const aiCheckFn = async (
      userAnswer: string,
      expectedOutput: string,
      question: QuizQuestion,
    ): Promise<EvaluationResult | null> => {
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
        const content = await callAI(aiPrompt, {
          provider: provider as AIProvider,
          temperature: 0.1,
          maxTokens: 200,
          jsonMode: true,
        });

        const result = JSON.parse(content);

        // Map AI result to our EvaluationResult
        if (typeof result.isCorrect === "boolean") {
          return {
            isCorrect: result.isCorrect,
            confidence: result.confidence || 0.8,
            feedback: result.feedback,
            method: "ai_conceptual_judgment",
          };
        }
      } catch (error) {
        console.error("AI Check failed:", error);
      }
      return null;
    };

    // Run the pipeline
    const result = await evaluateAnswer(
      userAnswer,
      question.expected_output,
      question,
      aiCheckFn,
    );

    // If result is correct, or if it is incorrect with high confidence, return it.
    // The pipeline returns a definitive result or a fallback rejection.
    // We can directly return the result.

    // We map EvaluationResult to the API response format { isCorrect, feedback }
    // We might want to include confidence/method for debugging/logging if needed, but for now stick to interface.

    // Log for "auditability" requirement
    console.log(
      `[Eval] Method: ${result.method}, Correct: ${result.isCorrect}, Confidence: ${result.confidence}`,
    );

    return NextResponse.json({
      isCorrect: result.isCorrect,
      feedback:
        result.feedback || (result.isCorrect ? "Correct!" : "Incorrect"),
    });
  } catch (error) {
    console.error("Answer check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
