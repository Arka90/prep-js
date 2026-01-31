import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { calculateReactScore } from "@/lib/react-quiz";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    const { data: quiz, error } = await supabase
      .from("react_quiz_attempts")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !quiz) {
      return NextResponse.json(
        { error: "React quiz not found" },
        { status: 404 },
      );
    }

    // Calculate correct answers
    const { correct } = calculateReactScore(quiz.questions, quiz.user_answers);

    return NextResponse.json({
      quiz: {
        ...quiz,
        correct,
      },
    });
  } catch (error) {
    console.error("Error fetching React quiz:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
