import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ReactQuizAttempt } from "@/types";

interface ReactTopicPerformance {
  id: string;
  user_id: string;
  topic_name: string;
  total_attempts: number;
  correct_attempts: number;
  last_attempted_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const supabase = await createServerSupabaseClient();

    // Get React quiz attempts
    const { data: quizAttemptsData, error: attemptsError } = await supabase
      .from("react_quiz_attempts")
      .select("*")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false });

    if (attemptsError) {
      console.error("Error fetching React quiz attempts:", attemptsError);
      // Return empty data if table doesn't exist
      if (attemptsError.code === "42P01") {
        return NextResponse.json({
          stats: {
            totalQuizzes: 0,
            averageScore: 0,
            bestScore: 0,
            weakestTopic: null,
            strongestTopic: null,
          },
          recentQuizzes: [],
          scoreHistory: [],
          topicStats: [],
        });
      }
    }

    const quizAttempts = (quizAttemptsData || []) as ReactQuizAttempt[];

    // Get React topic performance
    const { data: topicPerformanceData, error: topicError } = await supabase
      .from("react_topic_performance")
      .select("*")
      .eq("user_id", userId);

    if (topicError && topicError.code !== "42P01") {
      console.error("Error fetching React topic performance:", topicError);
    }

    const topicPerformance = (topicPerformanceData ||
      []) as ReactTopicPerformance[];

    // Calculate stats
    const totalQuizzes = quizAttempts.length;
    const scores = quizAttempts.map((q) => q.score);
    const averageScore =
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) /
          10
        : 0;
    const bestScore = scores.length > 0 ? Math.max(...scores) : 0;

    // Find weakest and strongest topics
    let weakestTopic = null;
    let strongestTopic = null;
    let weakestAccuracy = 100;
    let strongestAccuracy = 0;

    topicPerformance?.forEach((topic) => {
      const accuracy =
        topic.total_attempts > 0
          ? (topic.correct_attempts / topic.total_attempts) * 100
          : 0;

      if (accuracy < weakestAccuracy && topic.total_attempts >= 3) {
        weakestAccuracy = accuracy;
        weakestTopic = topic.topic_name;
      }
      if (accuracy > strongestAccuracy && topic.total_attempts >= 3) {
        strongestAccuracy = accuracy;
        strongestTopic = topic.topic_name;
      }
    });

    // Get recent quizzes for dashboard
    const recentQuizzes =
      quizAttempts?.slice(0, 5).map((q) => ({
        id: q.id,
        score: q.score,
        timeTaken: q.time_taken,
        completedAt: q.completed_at,
        dayNumber: q.day_number,
      })) || [];

    // Get score history for charts
    const scoreHistory =
      quizAttempts
        ?.slice(0, 30)
        .map((q) => ({
          date: q.completed_at,
          score: q.score,
        }))
        .reverse() || [];

    // Topic stats for charts
    const topicStats =
      topicPerformance?.map((t) => ({
        topic: t.topic_name,
        totalAttempts: t.total_attempts,
        correctAttempts: t.correct_attempts,
        accuracy:
          t.total_attempts > 0
            ? Math.round((t.correct_attempts / t.total_attempts) * 100)
            : 0,
      })) || [];

    return NextResponse.json({
      stats: {
        totalQuizzes,
        averageScore,
        bestScore,
        weakestTopic,
        strongestTopic,
      },
      recentQuizzes,
      scoreHistory,
      topicStats,
    });
  } catch (error) {
    console.error("React stats fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
