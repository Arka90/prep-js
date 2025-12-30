import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { calculatePoints, calculateLevel } from '@/lib/quiz';
import { QuizQuestion, AchievementType, User, TopicPerformance, QuizAttempt } from '@/types';

/**
 * Normalize answer for basic comparison
 */
function normalizeAnswer(answer: string): string {
  return answer
    .trim()
    .toLowerCase()
    .replace(/["'`]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\\n/g, '\n')
    .replace(/\n/g, ' ')
    .replace(/undefined/gi, 'undefined')
    .replace(/null/gi, 'null')
    .replace(/nan/gi, 'NaN')
    .replace(/true/gi, 'true')
    .replace(/false/gi, 'false');
}

/**
 * Check if answers match with various normalizations
 */
function basicAnswerMatch(userAnswer: string, expectedOutput: string): boolean {
  const normalizedUser = normalizeAnswer(userAnswer);
  const normalizedExpected = normalizeAnswer(expectedOutput);
  
  // Direct match
  if (normalizedUser === normalizedExpected) {
    return true;
  }
  
  // Try matching with newlines replaced by spaces
  const userNoNewlines = normalizedUser.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  const expectedNoNewlines = normalizedExpected.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  
  if (userNoNewlines === expectedNoNewlines) {
    return true;
  }
  
  // Try matching numbers/values as separate tokens
  const userTokens = normalizedUser.split(/[\s,]+/).filter(t => t.length > 0);
  const expectedTokens = normalizedExpected.split(/[\s,]+/).filter(t => t.length > 0);
  
  if (userTokens.length === expectedTokens.length && 
      userTokens.every((t, i) => t === expectedTokens[i])) {
    return true;
  }
  
  return false;
}

/**
 * Use AI to check if the answer is conceptually correct
 */
async function checkAnswerWithAI(
  question: QuizQuestion,
  userAnswer: string,
  apiKey: string
): Promise<boolean> {
  const aiPrompt = `You are a JavaScript quiz answer checker. Determine if the user's answer is conceptually correct.

Code snippet:
\`\`\`javascript
${question.code_snippet}
\`\`\`

Expected output: "${question.expected_output}"
User's answer: "${userAnswer}"

Rules:
1. Accept minor formatting differences ("1\\n2" same as "1 2")
2. Accept case variations for keywords
3. The CONCEPT must be correct
4. Be lenient with whitespace

Respond with ONLY: {"isCorrect": true} or {"isCorrect": false}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: aiPrompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 50,
      }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const result = JSON.parse(content);
    return result.isCorrect === true;
  } catch {
    return false;
  }
}

/**
 * Calculate score using smart answer checking
 */
async function calculateScoreSmart(
  questions: QuizQuestion[],
  userAnswers: string[],
  apiKey: string | undefined
): Promise<{ score: number; correct: boolean[] }> {
  const correct: boolean[] = [];
  let score = 0;

  for (let index = 0; index < questions.length; index++) {
    const question = questions[index];
    const userAnswer = (userAnswers[index] || '').trim();
    
    // First try basic matching
    let isCorrect = basicAnswerMatch(userAnswer, question.expected_output);
    
    // If basic matching fails and we have an API key, try AI checking
    if (!isCorrect && apiKey && userAnswer.length > 0) {
      isCorrect = await checkAnswerWithAI(question, userAnswer, apiKey);
    }
    
    correct.push(isCorrect);
    if (isCorrect) score++;
  }

  return { score, correct };
}

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
    
    // Get OpenAI API key for smart answer checking
    const apiKey = process.env.OPENAI_API_KEY;

    // Calculate score using smart answer checking
    const { score, correct } = await calculateScoreSmart(questions, answers, apiKey);
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
