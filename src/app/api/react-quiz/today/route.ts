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

    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if user has completed a React quiz today
    const { data: todayQuiz, error: todayError } = await supabase
      .from("react_quiz_attempts")
      .select("id, score, completed_at, day_number")
      .eq("user_id", userId)
      .gte("completed_at", today.toISOString())
      .order("completed_at", { ascending: false })
      .limit(1)
      .single();

    // If table doesn't exist, return default (no quiz taken)
    if (todayError && todayError.code === "PGRST116") {
      // PGRST116 = no rows returned, which is fine
    } else if (todayError && todayError.message?.includes("does not exist")) {
      // Table doesn't exist yet - return default
      return NextResponse.json({
        hasCompletedToday: false,
        dayNumber: 1,
        todayQuiz: null,
        timeUntilNextQuiz: null,
      });
    }

    // Get total number of React quizzes taken
    const { count, error: countError } = await supabase
      .from("react_quiz_attempts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // If table doesn't exist, default to day 1
    if (countError && countError.message?.includes("does not exist")) {
      return NextResponse.json({
        hasCompletedToday: false,
        dayNumber: 1,
        todayQuiz: null,
        timeUntilNextQuiz: null,
      });
    }

    const dayNumber = (count || 0) + 1;

    if (todayQuiz) {
      // Calculate time until next quiz (midnight)
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const msUntilMidnight = tomorrow.getTime() - Date.now();
      const hoursUntil = Math.floor(msUntilMidnight / (1000 * 60 * 60));
      const minutesUntil = Math.floor(
        (msUntilMidnight % (1000 * 60 * 60)) / (1000 * 60),
      );

      return NextResponse.json({
        hasCompletedToday: true,
        dayNumber: todayQuiz.day_number,
        todayQuiz: {
          id: todayQuiz.id,
          score: todayQuiz.score,
          completedAt: todayQuiz.completed_at,
          dayNumber: todayQuiz.day_number,
        },
        timeUntilNextQuiz: {
          hours: hoursUntil,
          minutes: minutesUntil,
        },
      });
    }

    return NextResponse.json({
      hasCompletedToday: false,
      dayNumber,
      todayQuiz: null,
      timeUntilNextQuiz: null,
    });
  } catch (error) {
    console.error("React quiz today check error:", error);
    // Return default on any error
    return NextResponse.json({
      hasCompletedToday: false,
      dayNumber: 1,
      todayQuiz: null,
      timeUntilNextQuiz: null,
    });
  }
}
