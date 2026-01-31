import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { calculateReactScore } from "@/lib/react-quiz";
import { ReactQuizQuestion } from "@/types";

interface SubmitRequest {
  userId: string;
  dayNumber: number;
  questions: ReactQuizQuestion[];
  answers: string[];
  timeTaken: number;
  targetSubtopics?: { mainTopic: string; subtopic: string }[];
}

export async function POST(request: NextRequest) {
  try {
    const body: SubmitRequest = await request.json();
    const {
      userId,
      dayNumber,
      questions,
      answers,
      timeTaken,
      targetSubtopics,
    } = body;

    if (!userId || !questions || !answers) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { score, correct } = calculateReactScore(questions, answers);
    const supabase = await createServerSupabaseClient();

    // Store the React quiz attempt
    const { data: attempt, error: attemptError } = await supabase
      .from("react_quiz_attempts")
      .insert({
        user_id: userId,
        day_number: dayNumber,
        questions: questions,
        user_answers: answers,
        score,
        time_taken: timeTaken,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (attemptError) {
      console.error("Error saving React quiz attempt:", attemptError);
      return NextResponse.json(
        { error: "Failed to save quiz attempt" },
        { status: 500 },
      );
    }

    // Update React topic performance
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const isCorrect = correct[i];

      const { data: existing } = await supabase
        .from("react_topic_performance")
        .select()
        .eq("user_id", userId)
        .eq("topic_name", question.topic)
        .single();

      if (existing) {
        await supabase
          .from("react_topic_performance")
          .update({
            total_attempts: existing.total_attempts + 1,
            correct_attempts: existing.correct_attempts + (isCorrect ? 1 : 0),
            last_updated: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("react_topic_performance").insert({
          user_id: userId,
          topic_name: question.topic,
          total_attempts: 1,
          correct_attempts: isCorrect ? 1 : 0,
          last_updated: new Date().toISOString(),
        });
      }
    }

    // Mark covered subtopics
    if (targetSubtopics && targetSubtopics.length > 0) {
      for (const subtopic of targetSubtopics) {
        await supabase.from("covered_react_subtopics").upsert(
          {
            user_id: userId,
            main_topic: subtopic.mainTopic,
            subtopic: subtopic.subtopic,
            covered_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,main_topic,subtopic",
          },
        );
      }
    }

    // Update user React stats
    const { data: user } = await supabase
      .from("users")
      .select(
        "react_total_points, react_level, react_current_streak, react_last_quiz_date",
      )
      .eq("id", userId)
      .single();

    if (user) {
      const pointsEarned = score * 10;
      const newTotalPoints = (user.react_total_points || 0) + pointsEarned;
      const newLevel = Math.floor(newTotalPoints / 100) + 1;

      // Calculate streak
      const today = new Date().toDateString();
      const lastQuizDate = user.react_last_quiz_date
        ? new Date(user.react_last_quiz_date).toDateString()
        : null;

      let newStreak = user.react_current_streak || 0;
      if (lastQuizDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (lastQuizDate === yesterday.toDateString()) {
          newStreak += 1;
        } else if (lastQuizDate !== today) {
          newStreak = 1;
        }
      }

      await supabase
        .from("users")
        .update({
          react_total_points: newTotalPoints,
          react_level: newLevel,
          react_current_streak: newStreak,
          react_last_quiz_date: new Date().toISOString(),
        })
        .eq("id", userId);
    }

    // Add incorrect answers to React revision list
    const incorrectQuestions = questions.filter((_, i) => !correct[i]);
    if (incorrectQuestions.length > 0) {
      const revisionItems = incorrectQuestions.map((q) => {
        const originalIndex = questions.findIndex(
          (oq) => oq.question_number === q.question_number,
        );
        return {
          user_id: userId,
          question: q,
          user_answer: answers[originalIndex] || "",
          quiz_type: "react",
        };
      });

      await supabase.from("revision_items").insert(revisionItems);
    }

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
      score,
      correct,
      totalQuestions: questions.length,
    });
  } catch (error) {
    console.error("React quiz submit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
