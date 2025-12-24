import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIPrompt } from '@/lib/quiz';
import { QuizQuestion } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { dayNumber } = await request.json();

    if (!dayNumber || dayNumber < 1) {
      return NextResponse.json(
        { error: 'Invalid day number' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const prompt = getOpenAIPrompt(dayNumber);

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
            role: 'system',
            content: prompt,
          },
          {
            role: 'user',
            content: `Generate for Day ${dayNumber}.`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to generate quiz questions' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    let questions: QuizQuestion[];
    try {
      const parsed = JSON.parse(content);
      questions = parsed.questions || parsed;
    } catch {
      console.error('Failed to parse OpenAI response:', content);
      return NextResponse.json(
        { error: 'Failed to parse quiz questions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Quiz generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
