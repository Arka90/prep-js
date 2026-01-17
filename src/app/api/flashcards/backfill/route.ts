import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { generateFlashcardFromMistake } from '@/lib/flashcards';
import { QuizQuestion, QuizAttempt } from '@/types';
import { basicAnswerMatch } from '@/lib/quiz';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
         return NextResponse.json({ error: 'Server missing OpenAI Key' }, { status: 500 });
    }

    // 1. Fetch all past quiz attempts
    const { data: attempts, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    if (!attempts || attempts.length === 0) {
        return NextResponse.json({ message: 'No history found', count: 0 });
    }

    let generatedCount = 0;
    const history = attempts as QuizAttempt[];

    // 2. Iterate and find mistakes
    // Use a sequential loop to avoid hitting OpenAI rate limits with Promise.all
    for (const attempt of history) {
        const questions = attempt.questions as QuizQuestion[];
        const answers = attempt.user_answers;
        
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const a = answers[i] || "";
            
            // Check if answer was wrong
            // We use the basic matcher here. The AI checker is expensive to re-run on everything, 
            // but generateFlashcardFromMistake does its own AI validation implicitely by generating a card.
            // If the answer is actually correct, generateFlashcardFromMistake might basically output something weird 
            // or we can rely on basicAnswerMatch being "good enough" for identifying candidates.
            const isCorrect = basicAnswerMatch(a, q.expected_output);
            
            if (!isCorrect && a.trim().length > 0) {
                 // Try to generate
                 // Check if card exists is handled inside generateFlashcardFromMistake, 
                 // but that check only looks for "new" cards. 
                 // We might want to be careful not to regenerate for the same concept if it was already mastered?
                 // The lib function checks for 'new' status duplicates only. 
                 
                 const success = await generateFlashcardFromMistake(q, a, userId, apiKey);
                 if (success) generatedCount++;
                 
                 // Small delay to be nice to API
                 await new Promise(r => setTimeout(r, 500)); 
            }
        }
    }

    return NextResponse.json({ success: true, count: generatedCount });
  } catch (error) {
    console.error('Backfill Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
