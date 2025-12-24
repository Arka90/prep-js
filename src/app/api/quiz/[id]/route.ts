import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { calculateScore } from '@/lib/quiz';
import { QuizAttempt } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Quiz ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const { data: quizData, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !quizData) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    const quiz = quizData as QuizAttempt;

    // Recalculate correct answers
    const { correct } = calculateScore(quiz.questions, quiz.user_answers);

    return NextResponse.json({
      quiz: {
        ...quiz,
        correct,
      },
    });
  } catch (error) {
    console.error('Quiz fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
