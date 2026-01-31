"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Trophy,
  Target,
  Atom,
  Award,
  ArrowLeft,
  PlayCircle,
  History,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/Loading";
import { useAuthStore } from "@/lib/store";
import { REACT_ACHIEVEMENTS, AchievementInfo, Achievement } from "@/types";

interface ReactAnalyticsData {
  stats: {
    totalQuizzes: number;
    averageScore: number;
    bestScore: number;
    weakestTopic: string | null;
    strongestTopic: string | null;
  };
  scoreHistory: {
    date: string;
    score: number;
  }[];
  topicStats: {
    topic: string;
    totalAttempts: number;
    correctAttempts: number;
    accuracy: number;
  }[];
}

export default function ReactAnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated, userId } = useAuthStore();
  const [data, setData] = useState<ReactAnalyticsData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const [statsResponse, achievementsResponse] = await Promise.all([
          fetch(`/api/user/react-stats?userId=${userId}`),
          fetch(`/api/user/achievements?userId=${userId}`),
        ]);

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setData(statsData);
        }

        if (achievementsResponse.ok) {
          const achievementsData = await achievementsResponse.json();
          setAchievements(achievementsData.achievements);
        }
      } catch (error) {
        console.error("Failed to fetch React analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, userId, router]);

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <LoadingSpinner size="lg" className="text-cyan-500" />
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    totalQuizzes: 0,
    averageScore: 0,
    bestScore: 0,
    weakestTopic: null,
    strongestTopic: null,
  };

  // Format score history for chart
  const chartData =
    data?.scoreHistory?.map((item) => ({
      date: new Date(item.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      score: item.score,
    })) || [];

  // Sort topic stats by accuracy for bar chart
  const topicChartData = [...(data?.topicStats || [])].sort(
    (a, b) => b.accuracy - a.accuracy,
  );

  // Calculate overall accuracy for pie chart
  const totalCorrect = topicChartData.reduce(
    (sum, t) => sum + t.correctAttempts,
    0,
  );
  const totalAttempts = topicChartData.reduce(
    (sum, t) => sum + t.totalAttempts,
    0,
  );
  const overallAccuracy =
    totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  const pieData = [
    { name: "Correct", value: totalCorrect, color: "#22C55E" },
    {
      name: "Incorrect",
      value: totalAttempts - totalCorrect,
      color: "#EF4444",
    },
  ];

  // Get unlocked achievement info
  const unlockedAchievementTypes = achievements.map((a) => a.achievement_type);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                <Atom className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                React Analytics
              </h1>
            </div>
          </div>

          <div className="flex gap-3">
            <Link href="/react-quiz/history">
              <Button variant="outline" size="sm">
                <History className="h-4 w-4 mr-2" />
                Quiz History
              </Button>
            </Link>
            <Link href="/react-quiz">
              <Button
                variant="primary"
                size="sm"
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                Take Quiz
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-cyan-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Total Quizzes
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.totalQuizzes}
                  </p>
                </div>
                <Target className="h-8 w-8 text-cyan-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-cyan-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Average Score
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.averageScore}/10
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-cyan-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-cyan-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Best Score
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.bestScore}/10
                  </p>
                </div>
                <Trophy className="h-8 w-8 text-cyan-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-cyan-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Topics Covered
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {topicChartData.length}
                  </p>
                </div>
                <Atom className="h-8 w-8 text-cyan-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Score Over Time Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Atom className="h-5 w-5 text-cyan-500" />
                Performance Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                    <YAxis domain={[0, 10]} stroke="#9CA3AF" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        border: "none",
                        borderRadius: "8px",
                        color: "#F9FAFB",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#06B6D4"
                      strokeWidth={3}
                      dot={{ fill: "#06B6D4", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: "#06B6D4" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <Atom className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Complete more React quizzes to see your progress</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Overall Accuracy Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-cyan-500" />
                Overall Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              {totalAttempts > 0 ? (
                <div className="relative">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "none",
                          borderRadius: "8px",
                          color: "#F9FAFB",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {overallAccuracy}%
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Accuracy
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <p className="text-center">No data yet</p>
                </div>
              )}
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Correct ({totalCorrect})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Incorrect ({totalAttempts - totalCorrect})
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Topic Accuracy Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Atom className="h-5 w-5 text-cyan-500" />
              Topic Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topicChartData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height={Math.max(300, topicChartData.length * 40)}
              >
                <BarChart data={topicChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="topic"
                    stroke="#9CA3AF"
                    fontSize={11}
                    width={180}
                    tickFormatter={(value) =>
                      value.length > 25 ? `${value.substring(0, 25)}...` : value
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "none",
                      borderRadius: "8px",
                      color: "#F9FAFB",
                    }}
                    formatter={(value, name, props) => [
                      `${value}% (${props.payload.correctAttempts}/${props.payload.totalAttempts})`,
                      "Accuracy",
                    ]}
                  />
                  <Bar dataKey="accuracy" radius={[0, 4, 4, 0]}>
                    {topicChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.accuracy >= 80
                            ? "#22C55E"
                            : entry.accuracy >= 50
                              ? "#F59E0B"
                              : "#EF4444"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <Atom className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Complete more React quizzes to see topic performance</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Strengths and Weaknesses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="border-t-4 border-t-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topicChartData.filter((t) => t.accuracy >= 70).length > 0 ? (
                <div className="space-y-2">
                  {topicChartData
                    .filter((t) => t.accuracy >= 70)
                    .slice(0, 5)
                    .map((topic) => (
                      <div
                        key={topic.topic}
                        className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                      >
                        <div>
                          <span className="text-gray-900 dark:text-gray-100 font-medium">
                            {topic.topic}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {topic.correctAttempts}/{topic.totalAttempts}{" "}
                            correct
                          </p>
                        </div>
                        <span className="font-bold text-green-600 dark:text-green-400 text-lg">
                          {topic.accuracy}%
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Keep practicing React to identify your strengths!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-red-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                Needs Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topicChartData.filter((t) => t.accuracy < 60).length > 0 ? (
                <div className="space-y-2">
                  {topicChartData
                    .filter((t) => t.accuracy < 60)
                    .slice(0, 5)
                    .map((topic) => (
                      <div
                        key={topic.topic}
                        className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
                      >
                        <div>
                          <span className="text-gray-900 dark:text-gray-100 font-medium">
                            {topic.topic}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {topic.correctAttempts}/{topic.totalAttempts}{" "}
                            correct
                          </p>
                        </div>
                        <span className="font-bold text-red-600 dark:text-red-400 text-lg">
                          {topic.accuracy}%
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Great job! No weak areas detected in React.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* React Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              React Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {REACT_ACHIEVEMENTS.map((achievement: AchievementInfo) => {
                const isUnlocked = unlockedAchievementTypes.includes(
                  achievement.type,
                );
                return (
                  <div
                    key={achievement.type}
                    className={`
                      p-4 rounded-lg text-center transition-all
                      ${
                        isUnlocked
                          ? "bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 border-2 border-yellow-300 dark:border-yellow-700 shadow-lg"
                          : "bg-gray-100 dark:bg-gray-800 opacity-50 grayscale"
                      }
                    `}
                  >
                    <div className="text-3xl mb-2">{achievement.icon}</div>
                    <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {achievement.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {achievement.description}
                    </p>
                    {isUnlocked && (
                      <span className="inline-block mt-2 text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                        ✓ Unlocked!
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
