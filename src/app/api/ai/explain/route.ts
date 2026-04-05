import { NextRequest, NextResponse } from "next/server";
import { callAI, AIProvider } from "@/lib/ai-client";

export async function POST(request: NextRequest) {
  try {
    const { question, userAnswer, provider = "openai" } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: "Question data required" },
        { status: 400 },
      );
    }

    const prompt = `
You are a helpful JavaScript tutor. Explaining a concept to a student who made a mistake.

The Question Code:
\`\`\`javascript
${question.code_snippet}
\`\`\`

The Topic: ${question.topic}
Expected Output: ${question.expected_output}
User's Wrong Answer: ${userAnswer}

Please provide a clear, simple explanation of the concept.
1. Explain WHY the output is what it is.
2. Address the likely misconception that led to the user's wrong answer involved.
3. Keep it friendly and encouraging.
4. Use markdown formatting.
5. Keep it under 200 words.
`;

    const explanation = await callAI(prompt, {
      provider: provider as AIProvider,
      temperature: 0.7,
      maxTokens: 300,
    });

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("AI explanation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
