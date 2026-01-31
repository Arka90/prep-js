import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Get all React quiz attempts for the user
    const { data: quizzes, error } = await supabase
      .from("react_quiz_attempts")
      .select("id, day_number, score, time_taken, completed_at")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false });

    if (error) {
      console.error("Error fetching React quiz history:", error);
      return NextResponse.json(
        { error: "Failed to fetch quiz history" },
        { status: 500 },
      );
    }

    // Calculate stats
    const totalQuizzes = quizzes?.length || 0;
    const totalScore = quizzes?.reduce((sum, q) => sum + q.score, 0) || 0;
    const averageScore = totalQuizzes > 0 ? totalScore / totalQuizzes : 0;
    const bestScore =
      quizzes?.reduce((max, q) => Math.max(max, q.score), 0) || 0;
    const totalTime = quizzes?.reduce((sum, q) => sum + q.time_taken, 0) || 0;

    return NextResponse.json({
      quizzes: quizzes || [],
      stats: {
        totalQuizzes,
        averageScore,
        bestScore,
        totalTime,
      },
    });
  } catch (error) {
    console.error("React quiz history error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
