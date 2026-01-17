import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Fetch cards due for review (status is new/reviewing/validated and next_review_at <= now)
    // Ordered by priority: Reviewing > New > Validated
    const { data: cards, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', userId)
      .lte('next_review_at', new Date().toISOString())
      .neq('status', 'mastered')
      .order('topic', { ascending: true })
      .order('next_review_at', { ascending: true })
      .limit(50); // Fetch more to populate topic groups

    if (error) {
      console.error('Fetch flashcards error:', error);
      throw error;
    }

    return NextResponse.json({ flashcards: cards });
  } catch (error) {
    console.error('Flashcards API Error:', error);
    return NextResponse.json(
      { error: JSON.stringify(error) },
      { status: 500 }
    );
  }
}
