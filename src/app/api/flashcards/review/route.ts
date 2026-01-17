import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { FlashcardConfidence, FlashcardStatus } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { flashcardId, userId, rating } = await request.json();

    if (!flashcardId || !userId || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // calculate next review based on rating (Simplified SRS)
    // Confident -> +3 days
    // Somewhat -> +1 day
    // Not Confident -> +0 days (review again today/tomorrow)
    
    let nextReviewDays = 0;
    let newStatus: FlashcardStatus = 'reviewing';
    let confidenceIncrement = 0;

    switch (rating as FlashcardConfidence) {
      case 'confident':
        nextReviewDays = 3;
        confidenceIncrement = 1;
        break;
      case 'somewhat_confident':
        nextReviewDays = 1;
        confidenceIncrement = 0;
        break;
      case 'not_confident':
        nextReviewDays = 0; // immediate re-queue effectively
        confidenceIncrement = -1;
        break;
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + nextReviewDays);

    // Get current card to update confidence
    const { data: card } = await supabase.from('flashcards').select('confidence_level, status').eq('id', flashcardId).single();
    
    let currentConfidence = card?.confidence_level || 0;
    currentConfidence = Math.max(0, Math.min(5, currentConfidence + confidenceIncrement));
    
    // If confidence is high enough, mark validated
    if (currentConfidence >= 3 && card?.status !== 'mastered') {
        newStatus = 'validated';
    } else if (card?.status === 'new') {
        newStatus = 'reviewing';
    } else {
        newStatus = card?.status || 'reviewing';
    }

    // Update Flashcard
    const { error: updateError } = await supabase
      .from('flashcards')
      .update({
        status: newStatus,
        confidence_level: currentConfidence,
        last_reviewed_at: new Date().toISOString(),
        next_review_at: nextReview.toISOString()
      })
      .eq('id', flashcardId);

    if (updateError) throw updateError;

    // Log Review
    await supabase.from('flashcard_reviews').insert({
      flashcard_id: flashcardId,
      user_id: userId,
      rating: rating,
      reviewed_at: new Date().toISOString()
    });

    return NextResponse.json({ success: true, nextReview, newStatus });
  } catch (error) {
    console.error('Review API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
