import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { calculatePoints, calculateLevel } from '@/lib/quiz';
import { QuizAttempt, User, TopicPerformance, QuizQuestion } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { quizId, questionIndex } = await request.json();

    if (!quizId || typeof questionIndex !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    
    // 1. Fetch the quiz attempt
    const { data: quizData, error: quizError } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('id', quizId)
      .single();

    if (quizError || !quizData) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    const quiz = quizData as QuizAttempt & { manual_corrections: number[] };
    const manualCorrections = quiz.manual_corrections || [];

    // Check if already marked correct
    if (manualCorrections.includes(questionIndex)) {
        return NextResponse.json({ success: true, message: 'Already marked as correct' });
    }

    // 2. Update manual_corrections and score in quiz_attempts
    const newManualCorrections = [...manualCorrections, questionIndex];
    const newScore = quiz.score + 1; // Increment score

    // Determine points delta
    // We need to calculate how many points this question is worth.
    // Since we don't have the original time per question, we'll estimate or just use base points + time bonus ratio
    // A simpler approach for "correction" is to give flat points or just re-calculate for the whole quiz if we had the logic here.
    // Let's rely on re-calculating points for the *whole* quiz to be consistent with the submit logic, 
    // BUT we don't want to re-apply the "time bonus" logic inconsistently.
    // Strategy: Calculate the points difference.
    // Old Points: calculatePoints(quiz.score, quiz.time_taken)
    // New Points: calculatePoints(newScore, quiz.time_taken)
    
    const oldPoints = calculatePoints(quiz.score, quiz.time_taken);
    const newPoints = calculatePoints(newScore, quiz.time_taken);
    const pointsDelta = newPoints - oldPoints;

    const { error: updateQuizError } = await supabase
      .from('quiz_attempts')
      .update({
        manual_corrections: newManualCorrections,
        score: newScore,
      })
      .eq('id', quizId);

    if (updateQuizError) throw updateQuizError;

    // 3. Update User Total Points
    // Fetch user first to get current points
     const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', quiz.user_id)
      .single();

    if (userError || !userData) throw new Error('User not found');
    const user = userData as User;

    const newTotalPoints = user.total_points + pointsDelta;
    const newLevel = calculateLevel(newTotalPoints);

    await supabase
        .from('users')
        .update({
            total_points: newTotalPoints,
            level: newLevel
        })
        .eq('id', quiz.user_id);

    // 4. Update Topic Performance
    const question = (quiz.questions as QuizQuestion[])[questionIndex];
    const topic = question.topic;

    const { data: topicData } = await supabase
        .from('topic_performance')
        .select('*')
        .eq('user_id', quiz.user_id)
        .eq('topic_name', topic)
        .single();
    
    if (topicData) {
        const tPerformance = topicData as TopicPerformance;
        await supabase
            .from('topic_performance')
            .update({
                correct_attempts: tPerformance.correct_attempts + 1,
                last_updated: new Date().toISOString()
            })
            .eq('id', tPerformance.id);
    } else {
        // Should exist if they took the quiz, but handle edge case?
        // If it doesn't exist, we can't increment "correct" without "total". 
        // Assuming it exists since they just took the quiz.
    }

    return NextResponse.json({
      success: true,
      newScore,
      newTotalPoints,
      pointsDelta
    });

  } catch (error) {
    console.error('Mark correct error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
