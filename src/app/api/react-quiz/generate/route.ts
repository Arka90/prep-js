import { NextRequest, NextResponse } from "next/server";
import { getReactQuizPromptWithTopics } from "@/lib/react-quiz";
import { ReactQuizQuestion } from "@/types";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import reactSyllabus from "@/data/react-syllabus.json";

interface SyllabusTopics {
  [key: string]: string[];
}

interface TargetSubtopic {
  mainTopic: string;
  subtopic: string;
}

interface CoveredReactSubtopic {
  main_topic: string;
  subtopic: string;
}

/**
 * Get uncovered React subtopics for targeted question generation
 */
async function getTargetSubtopics(
  userId: string | undefined,
): Promise<TargetSubtopic[]> {
  const topics = reactSyllabus.topics as SyllabusTopics;

  // Build all subtopics list
  const allSubtopics: TargetSubtopic[] = [];
  for (const [mainTopic, subtopics] of Object.entries(topics)) {
    for (const subtopic of subtopics) {
      allSubtopics.push({ mainTopic, subtopic });
    }
  }

  if (!userId) {
    // If no user, just return random subtopics
    return allSubtopics.sort(() => Math.random() - 0.5).slice(0, 5);
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Get all covered React subtopics for the user
    const { data: coveredData, error } = await supabase
      .from("covered_react_subtopics")
      .select("main_topic, subtopic")
      .eq("user_id", userId);

    // If table doesn't exist or other error, just return random subtopics
    if (error) {
      console.log(
        "covered_react_subtopics query error (table may not exist):",
        error.message,
      );
      return allSubtopics.sort(() => Math.random() - 0.5).slice(0, 5);
    }

    const covered = (coveredData as CoveredReactSubtopic[]) || [];
    const coveredSet = new Set(
      covered.map((c) => `${c.main_topic}::${c.subtopic}`),
    );

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
      return allSubtopics.sort(() => Math.random() - 0.5).slice(0, 5);
    }

    // Shuffle and return subset
    return uncoveredSubtopics.sort(() => Math.random() - 0.5).slice(0, 5);
  } catch (err) {
    // Fallback to random subtopics on error
    console.error("Error in getTargetSubtopics:", err);
    return allSubtopics.sort(() => Math.random() - 0.5).slice(0, 5);
  }
}

export async function POST(request: NextRequest) {
  console.log("=== React Quiz Generate API Called ===");
  try {
    const { dayNumber, userId } = await request.json();
    console.log("Request body:", { dayNumber, userId });

    if (!dayNumber || dayNumber < 1) {
      return NextResponse.json(
        { error: "Invalid day number" },
        { status: 400 },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 },
      );
    }

    // Get target subtopics using React syllabus strategy
    console.log("Getting target subtopics for user:", userId);
    const targetSubtopics = await getTargetSubtopics(userId);
    console.log("Target subtopics:", targetSubtopics.length);

    const prompt = getReactQuizPromptWithTopics(dayNumber, targetSubtopics);

    console.log("Calling OpenAI API...");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: prompt,
              },
              {
                role: "user",
                content: `Generate React interview questions for Day ${dayNumber} using the specified subtopics.`,
              },
            ],
            response_format: { type: "json_object" },
            temperature: 0.8,
          }),
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);
      console.log("OpenAI response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenAI API error:", errorData);
        return NextResponse.json(
          { error: "Failed to generate React quiz questions" },
          { status: 500 },
        );
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      console.log("OpenAI response received, parsing...");

      let questions: ReactQuizQuestion[];
      try {
        const parsed = JSON.parse(content);
        questions = parsed.questions || parsed;
      } catch {
        console.error("Failed to parse OpenAI response:", content);
        return NextResponse.json(
          { error: "Failed to parse React quiz questions" },
          { status: 500 },
        );
      }

      // Validate question structure
      if (!Array.isArray(questions) || questions.length === 0) {
        return NextResponse.json(
          { error: "Invalid quiz questions format" },
          { status: 500 },
        );
      }

      console.log("Returning", questions.length, "questions");
      return NextResponse.json({
        questions,
        targetSubtopics,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        console.error("OpenAI API request timed out");
        return NextResponse.json(
          { error: "Request timed out. Please try again." },
          { status: 504 },
        );
      }
      throw fetchError;
    }
  } catch (error) {
    console.error("React quiz generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
