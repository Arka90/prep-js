import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIPromptWithTopics } from '@/lib/quiz';
import { QuizQuestion } from '@/types';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import syllabus from '@/data/syllabus.json';
import { CoveredSubtopic } from '@/types';

interface SyllabusTopics {
  [key: string]: string[];
}

interface TargetSubtopic {
  mainTopic: string;
  subtopic: string;
}

/**
 * Get uncovered subtopics for targeted question generation
 */
async function getTargetSubtopics(userId: string | undefined): Promise<TargetSubtopic[]> {
  if (!userId) {
    // If no user, just return random subtopics
    const topics = syllabus.topics as SyllabusTopics;
    const allSubtopics: TargetSubtopic[] = [];
    for (const [mainTopic, subtopics] of Object.entries(topics)) {
      for (const subtopic of subtopics) {
        allSubtopics.push({ mainTopic, subtopic });
      }
    }
    return allSubtopics.sort(() => Math.random() - 0.5).slice(0, 5);
  }

  try {
    const supabase = await createServerSupabaseClient();
    
    // Get all covered subtopics for the user
    const { data: coveredData } = await supabase
      .from('covered_subtopics')
      .select('main_topic, subtopic')
      .eq('user_id', userId);

    const covered = coveredData as CoveredSubtopic[] || [];
    const coveredSet = new Set(covered.map(c => `${c.main_topic}::${c.subtopic}`));

    const topics = syllabus.topics as SyllabusTopics;
    const uncoveredSubtopics: TargetSubtopic[] = [];

    for (const [mainTopic, subtopics] of Object.entries(topics)) {
      for (const subtopic of subtopics) {
        const key = `${mainTopic}::${subtopic}`;
        if (!coveredSet.has(key)) {
          uncoveredSubtopics.push({ mainTopic, subtopic });
        }
      }
    }

    // If all topics are covered, return random selection for a new cycle
    if (uncoveredSubtopics.length === 0) {
      const allSubtopics: TargetSubtopic[] = [];
      for (const [mainTopic, subtopics] of Object.entries(topics)) {
        for (const subtopic of subtopics) {
          allSubtopics.push({ mainTopic, subtopic });
        }
      }
      return allSubtopics.sort(() => Math.random() - 0.5).slice(0, 5);
    }

    // Shuffle and return subset
    return uncoveredSubtopics.sort(() => Math.random() - 0.5).slice(0, 5);
  } catch {
    // Fallback to random subtopics on error
    const topics = syllabus.topics as SyllabusTopics;
    const allSubtopics: TargetSubtopic[] = [];
    for (const [mainTopic, subtopics] of Object.entries(topics)) {
      for (const subtopic of subtopics) {
        allSubtopics.push({ mainTopic, subtopic });
      }
    }
    return allSubtopics.sort(() => Math.random() - 0.5).slice(0, 5);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { dayNumber, userId } = await request.json();

    if (!dayNumber || dayNumber < 1) {
      return NextResponse.json(
        { error: 'Invalid day number' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Get target subtopics using syllabus strategy
    const targetSubtopics = await getTargetSubtopics(userId);
    const prompt = getOpenAIPromptWithTopics(dayNumber, targetSubtopics);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: prompt,
          },
          {
            role: 'user',
            content: `Generate for Day ${dayNumber} using the specified subtopics.`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to generate quiz questions' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    let questions: QuizQuestion[];
    try {
      const parsed = JSON.parse(content);
      questions = parsed.questions || parsed;
    } catch {
      console.error('Failed to parse OpenAI response:', content);
      return NextResponse.json(
        { error: 'Failed to parse quiz questions' },
        { status: 500 }
      );
    }

    // Return questions with the target subtopics for tracking
    return NextResponse.json({ 
      questions,
      targetSubtopics, 
    });
  } catch (error) {
    console.error('Quiz generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
