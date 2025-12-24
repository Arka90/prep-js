import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { calculateScore, calculatePoints, calculateLevel } from '@/lib/quiz';
import { QuizQuestion, AchievementType, User, TopicPerformance, QuizAttempt } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { userId, questions, answers, timeTaken, dayNumber } = await request.json();

    if (!userId || !questions || !answers) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Calculate score
    const { score, correct } = calculateScore(questions, answers);
    const points = calculatePoints(score, timeTaken);

    // Save quiz attempt
    const { data: quizAttemptData, error: quizError } = await supabase
      .from('quiz_attempts')
      .insert({
        user_id: userId,
        day_number: dayNumber,
        questions: questions,
        user_answers: answers,
        score: score,
        time_taken: timeTaken,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (quizError) {
      console.error('Quiz save error:', quizError);
      return NextResponse.json(
        { error: 'Failed to save quiz' },
        { status: 500 }
      );
    }

    const quizAttempt = quizAttemptData as QuizAttempt;

    // Update topic performance
    const topicUpdates: Record<string, { correct: number; total: number }> = {};
    (questions as QuizQuestion[]).forEach((q, index) => {
      if (!topicUpdates[q.topic]) {
        topicUpdates[q.topic] = { correct: 0, total: 0 };
      }
      topicUpdates[q.topic].total++;
      if (correct[index]) {
        topicUpdates[q.topic].correct++;
      }
    });

    for (const [topic, stats] of Object.entries(topicUpdates)) {
      const { data: existingData } = await supabase
        .from('topic_performance')
        .select('*')
        .eq('user_id', userId)
        .eq('topic_name', topic)
        .single();

      const existing = existingData as TopicPerformance | null;

      if (existing) {
        await supabase
          .from('topic_performance')
          .update({
            total_attempts: existing.total_attempts + stats.total,
            correct_attempts: existing.correct_attempts + stats.correct,
            last_updated: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await supabase.from('topic_performance').insert({
          user_id: userId,
          topic_name: topic,
          total_attempts: stats.total,
          correct_attempts: stats.correct,
          last_updated: new Date().toISOString(),
        });
      }
    }

    // Get user and update stats
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    const user = userData as User | null;

    if (user) {
      const newTotalPoints = user.total_points + points;
      const newLevel = calculateLevel(newTotalPoints);
      
      // Check streak using UTC dates for consistency across timezones
      const getUTCDateString = (date: Date) => {
        return `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;
      };
      
      const now = new Date();
      const today = getUTCDateString(now);
      const lastQuizDate = user.last_quiz_date 
        ? getUTCDateString(new Date(user.last_quiz_date)) 
        : null;
      const yesterday = getUTCDateString(new Date(now.getTime() - 86400000));
      
      let newStreak = user.current_streak;
      if (lastQuizDate === today) {
        // Already took quiz today, streak unchanged
      } else if (lastQuizDate === yesterday) {
        // Continued streak
        newStreak++;
      } else {
        // Streak broken or first quiz
        newStreak = 1;
      }

      await supabase
        .from('users')
        .update({
          total_points: newTotalPoints,
          level: newLevel,
          current_streak: newStreak,
          last_quiz_date: new Date().toISOString(),
        })
        .eq('id', userId);

      // Check for achievements
      const newAchievements: AchievementType[] = [];
      const { data: existingAchievements } = await supabase
        .from('achievements')
        .select('achievement_type')
        .eq('user_id', userId);

      const achievementTypes = existingAchievements?.map(a => a.achievement_type) || [];

      // First quiz
      if (!achievementTypes.includes('first_quiz')) {
        newAchievements.push('first_quiz');
      }

      // Perfect score
      if (score === 10 && !achievementTypes.includes('perfect_score')) {
        newAchievements.push('perfect_score');
      }

      // Speed demon (under 10 minutes with >80%)
      if (timeTaken < 600 && score >= 8 && !achievementTypes.includes('speed_demon')) {
        newAchievements.push('speed_demon');
      }

      // Streak achievements
      if (newStreak >= 7 && !achievementTypes.includes('streak_7')) {
        newAchievements.push('streak_7');
      }
      if (newStreak >= 30 && !achievementTypes.includes('streak_30')) {
        newAchievements.push('streak_30');
      }
      if (newStreak >= 100 && !achievementTypes.includes('streak_100')) {
        newAchievements.push('streak_100');
      }

      // Level achievements
      if (newLevel >= 5 && !achievementTypes.includes('level_5')) {
        newAchievements.push('level_5');
      }
      if (newLevel >= 10 && !achievementTypes.includes('level_10')) {
        newAchievements.push('level_10');
      }
      if (newLevel >= 20 && !achievementTypes.includes('level_20')) {
        newAchievements.push('level_20');
      }

      // Save new achievements
      for (const achievement of newAchievements) {
        await supabase.from('achievements').insert({
          user_id: userId,
          achievement_type: achievement,
          unlocked_at: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      quizId: quizAttempt.id,
      score,
      correct,
      points,
    });
  } catch (error) {
    console.error('Quiz submit error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
