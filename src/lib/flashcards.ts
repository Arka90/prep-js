import { QuizQuestion, Flashcard, FlashcardType } from '@/types';
import { createServerSupabaseClient } from '@/lib/supabase-server';

const FLASHCARD_PROMPT = `You are a JavaScript concept repair expert. A user answered a quiz question incorrectly. 
Your goal is to create a SINGLE flashcard to fix their specific misconception.

CONTEXT:
Question Code:
\`\`\`javascript
{code_snippet}
\`\`\`
Expected Output: "{expected_output}"
User's Answer: "{user_answer}"
Question Explanation: "{explanation}"

TASK:
1. Identify the likely specific misconception (e.g., "confused about variable hoisting vs let/const").
2. Generate a flashcard of one of these types:
   - 'misconception_breaker': Direct challenge to the wrong belief.
   - 'prediction': A new, simpler code snippet to predict.
   - 'contrast': Contrast two similar snippets with different outcomes.
   - 'edge_case': proper handling of the edge case they missed.

OUTPUT JSON FORMAT:
{
  "concept_name": "Short name of the concept (e.g. 'Hoisting with let')",
  "concept_description": "Brief description of the error pattern",
  "card_type": "misconception_breaker" | "prediction" | "contrast" | "edge_case",
  "front_content": {
    "question_text": "The main text/prompt for the front of the card",
    "code_snippet": "Optional code snippet for the front (if needed)",
    "options": ["Optional array", "of choices", "if multiple choice"] 
  },
  "back_content": {
    "explanation": "Concise explanation of why the answer is what it is",
    "correct_mental_model": "One sentence rule of thumb to remember",
    "expected_output": "The correct output/answer"
  }
}

Keep it brief. Focus on REPAIRING the mental model.`;

// ... prompt string same as before ... 
// We don't need to change the prompt unless we want AI to confirm the topic, 
// but we already have the topic from the Question object.

export async function generateFlashcardFromMistake(
  question: QuizQuestion,
  userAnswer: string,
  userId: string,
  apiKey: string
): Promise<boolean> {
  // Don't generate if the answers are too similar (noise) or empty
  if (!userAnswer || userAnswer.trim() === '') return false;

  try {
    const prompt = FLASHCARD_PROMPT
      .replace('{code_snippet}', question.code_snippet)
      .replace('{expected_output}', question.expected_output)
      .replace('{user_answer}', userAnswer)
      .replace('{explanation}', question.explanation);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
        console.error('OpenAI Flashcard gen failed', response.statusText);
        return false;
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);

    // Save to Supabase
    const supabase = await createServerSupabaseClient();
    
    // Check for duplicate
    const { data: existing } = await supabase
        .from('flashcards')
        .select('id')
        .eq('user_id', userId)
        .eq('concept_name', content.concept_name)
        .eq('status', 'new')
        .single();
    
    if (existing) {
        return true; 
    }

    // Default to 'General' if topic not present (though it should be)
    const topic = question.topic || 'General';

    await supabase.from('flashcards').insert({
      user_id: userId,
      topic: topic,
      concept_name: content.concept_name,
      concept_description: content.concept_description,
      card_type: content.card_type,
      front_content: content.front_content,
      back_content: content.back_content,
      status: 'new',
      next_review_at: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error('Error generating flashcard:', error);
    return false;
  }
}
