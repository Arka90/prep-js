
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { QuizAttempt } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const { data: quizAttemptsData, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error fetching quiz attempts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch quiz attempts' },
        { status: 500 }
      );
    }

    const quizAttempts = (quizAttemptsData || []) as QuizAttempt[];

    const quizzes = quizAttempts.map(q => ({
      id: q.id,
      score: q.score,
      timeTaken: q.time_taken,
      completedAt: q.completed_at,
      dayNumber: q.day_number,
    }));

    return NextResponse.json({ quizzes });
  } catch (error) {
    console.error('Quiz history fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
