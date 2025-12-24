import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Get user data to check first quiz date
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("created_at, last_quiz_date")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the user's first quiz to calculate day number
    const { data: firstQuiz } = await supabase
      .from("quiz_attempts")
      .select("completed_at")
      .eq("user_id", userId)
      .order("completed_at", { ascending: true })
      .limit(1)
      .single();

    // Calculate today's date at midnight (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate tomorrow's date at midnight
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if user has already taken a quiz today
    const { data: todayQuiz, error: quizError } = await supabase
      .from("quiz_attempts")
      .select("id, score, completed_at, day_number")
      .eq("user_id", userId)
      .gte("completed_at", today.toISOString())
      .lt("completed_at", tomorrow.toISOString())
      .limit(1)
      .single();

    // Calculate day number
    let dayNumber = 1;
    if (firstQuiz?.completed_at) {
      const firstQuizDate = new Date(firstQuiz.completed_at);
      firstQuizDate.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - firstQuizDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      dayNumber = Math.max(1, diffDays + 1);
    }

    const hasCompletedToday = !!todayQuiz && !quizError;

    // Calculate time until next quiz (midnight)
    const now = new Date();
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    const hoursRemaining = Math.floor(timeUntilMidnight / (1000 * 60 * 60));
    const minutesRemaining = Math.floor(
      (timeUntilMidnight % (1000 * 60 * 60)) / (1000 * 60)
    );

    return NextResponse.json({
      hasCompletedToday,
      dayNumber,
      todayQuiz: hasCompletedToday
        ? {
            id: todayQuiz.id,
            score: todayQuiz.score,
            completedAt: todayQuiz.completed_at,
            dayNumber: todayQuiz.day_number,
          }
        : null,
      timeUntilNextQuiz: hasCompletedToday
        ? {
            hours: hoursRemaining,
            minutes: minutesRemaining,
          }
        : null,
    });
  } catch (error) {
    console.error("Error checking today quiz status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
