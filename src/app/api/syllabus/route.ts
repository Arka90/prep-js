import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import syllabus from '@/data/syllabus.json';
import { CoveredSubtopic } from '@/types';

interface SyllabusTopics {
  [key: string]: string[];
}

/**
 * Get uncovered subtopics for a user to generate targeted questions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const count = parseInt(searchParams.get('count') || '5', 10);

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Get all covered subtopics for the user
    const { data: coveredData, error } = await supabase
      .from('covered_subtopics')
      .select('main_topic, subtopic')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching covered subtopics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch covered subtopics' },
        { status: 500 }
      );
    }

    const covered = coveredData as CoveredSubtopic[] || [];
    const coveredSet = new Set(covered.map(c => `${c.main_topic}::${c.subtopic}`));

    // Get all topics from syllabus
    const topics = syllabus.topics as SyllabusTopics;
    const uncoveredSubtopics: { mainTopic: string; subtopic: string }[] = [];

    // Find uncovered subtopics
    for (const [mainTopic, subtopics] of Object.entries(topics)) {
      for (const subtopic of subtopics) {
        const key = `${mainTopic}::${subtopic}`;
        if (!coveredSet.has(key)) {
          uncoveredSubtopics.push({ mainTopic, subtopic });
        }
      }
    }

    // If all topics are covered, reset and start over (cycle through)
    if (uncoveredSubtopics.length === 0) {
      // Return all subtopics for a fresh cycle
      for (const [mainTopic, subtopics] of Object.entries(topics)) {
        for (const subtopic of subtopics) {
          uncoveredSubtopics.push({ mainTopic, subtopic });
        }
      }
      
      return NextResponse.json({
        subtopics: uncoveredSubtopics.slice(0, count),
        cycleComplete: true,
        totalUncovered: uncoveredSubtopics.length,
        totalCovered: covered.length,
      });
    }

    // Shuffle to add variety
    const shuffled = uncoveredSubtopics.sort(() => Math.random() - 0.5);
    
    // Return requested number of uncovered subtopics
    return NextResponse.json({
      subtopics: shuffled.slice(0, count),
      cycleComplete: false,
      totalUncovered: uncoveredSubtopics.length,
      totalCovered: covered.length,
    });
  } catch (error) {
    console.error('Syllabus API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Mark subtopics as covered after quiz completion
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, subtopics } = await request.json();

    if (!userId || !subtopics || !Array.isArray(subtopics)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Batch insert covered subtopics (ignore duplicates)
    const records = subtopics.map(({ mainTopic, subtopic }) => ({
      user_id: userId,
      main_topic: mainTopic,
      subtopic: subtopic,
      covered_at: new Date().toISOString(),
    }));

    await supabase
      .from('covered_subtopics')
      .upsert(records, { onConflict: 'user_id,main_topic,subtopic' });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Syllabus POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
