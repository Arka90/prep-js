
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { userId, question, userAnswer } = await request.json();

    if (!userId || !question) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Check if duplicate (optional but good idea)
    // For simplicity, we'll just insert. You might want to check existence here.

    const { error } = await supabase
      .from('revision_items')
      .insert({
        user_id: userId,
        question: question,
        user_answer: userAnswer,
      });

    if (error) {
      console.error('Error marking revision:', error);
      return NextResponse.json(
        { error: 'Failed to mark for revision' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark revision error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
