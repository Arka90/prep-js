
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { question, userAnswer } = await request.json();

    if (!question) {
      return NextResponse.json({ error: 'Question data required' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key missing' }, { status: 500 });
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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview', // Or gpt-4o-mini for speed/cost
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    const explanation = data.choices[0].message.content;

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error('AI explanation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
