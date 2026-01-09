
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { QuizAttempt, QuizQuestion } from '@/types';
import { basicAnswerMatch } from '@/lib/quiz';

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

    // Get all quiz attempts
    const { data: quizAttemptsData, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error fetching quiz attempts for mistakes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch quiz data' },
        { status: 500 }
      );
    }

    const quizAttempts = (quizAttemptsData || []) as QuizAttempt[];
    const mistakes: any[] = [];
    const seenQuestions = new Set<string>(); // To avoid duplicates if the same question appears multiple times (unlikely but possible)

    quizAttempts.forEach(attempt => {
      const questions = attempt.questions as QuizQuestion[];
      const userAnswers = attempt.user_answers || [];

      questions.forEach((question, index) => {
        const userAnswer = userAnswers[index] || '';
        const isCorrect = basicAnswerMatch(userAnswer, question.expected_output);

        if (!isCorrect) {
          // Use a unique key for deduplication (question text or code snippet + expected output)
          const uniqueKey = `${question.code_snippet}-${question.expected_output}`;
          
          if (!seenQuestions.has(uniqueKey)) {
            seenQuestions.add(uniqueKey);
            mistakes.push({
              id: `${attempt.id}-${index}`,
              quizId: attempt.id,
              date: attempt.completed_at,
              dayNumber: attempt.day_number,
              question: question,
              userAnswer: userAnswer,
            });
          }
        }
      });
    });

    return NextResponse.json({ mistakes });
  } catch (error) {
    console.error('Mistakes fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
