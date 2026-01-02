"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Eye, EyeOff, Trophy, RotateCcw } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import type { Question, Answer } from "@/types/game";
import { ThemeToggle } from "@/components/theme-toggle";

interface TeamAnswerData {
    teamId: string;
    questionId: number;
    answer: string;
    timestamp: number;
}

interface TeamResult {
    teamId: string;
    correctCount: number;
    answers: { questionId: number; answer: string; isCorrect: boolean }[];
}

export default function HostPage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showResults, setShowResults] = useState(false);
    const [teamResults, setTeamResults] = useState<TeamResult[]>([]);

    // Fetch questions from API
    useEffect(() => {
        async function fetchQuestions() {
            try {
                const response = await fetch("/api/questions");
                const data = await response.json();
                setQuestions(data);
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch questions:", error);
                setLoading(false);
            }
        }
        fetchQuestions();
    }, []);

    // Sync game state when question changes
    useEffect(() => {
        async function updateGameState() {
            try {
                await fetch("/api/game-state", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ currentQuestionIndex: currentIndex }),
                });
            } catch (error) {
                console.error("Failed to update game state:", error);
            }
        }

        if (!loading && questions.length > 0) {
            updateGameState();
        }
    }, [currentIndex, loading, questions.length]);

    const handleNext = useCallback(() => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            setShowAnswer(false);
        }
    }, [currentIndex, questions.length]);

    const handlePrevious = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
            setShowAnswer(false);
        }
    }, [currentIndex]);

    // Keyboard shortcuts
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "ArrowRight") {
                handleNext();
            } else if (e.key === "ArrowLeft") {
                handlePrevious();
            } else if (e.key === " ") {
                e.preventDefault();
                setShowAnswer((prev) => !prev);
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleNext, handlePrevious]);

    // 결과 집계 함수
    const handleShowResults = async () => {
        try {
            const response = await fetch("/api/team-answers");
            const teamAnswers: TeamAnswerData[] = await response.json();

            // 팀별로 그룹화
            const teamMap = new Map<string, TeamAnswerData[]>();
            teamAnswers.forEach((ta) => {
                if (!teamMap.has(ta.teamId)) {
                    teamMap.set(ta.teamId, []);
                }
                teamMap.get(ta.teamId)!.push(ta);
            });

            // 각 팀의 정답 수 계산
            const results: TeamResult[] = [];
            teamMap.forEach((answers, teamId) => {
                let correctCount = 0;
                const answerResults: { questionId: number; answer: string; isCorrect: boolean }[] = [];

                answers.forEach((ta) => {
                    const question = questions.find((q) => q.id === ta.questionId);
                    if (question) {
                        // 1등 후보 찾기
                        const voteCounts = calculateVoteCounts(question.answers);
                        const firstPlace = voteCounts.filter((v) => v.rank === 1).map((v) => v.name);
                        const isCorrect = firstPlace.includes(ta.answer);
                        if (isCorrect) correctCount++;
                        answerResults.push({
                            questionId: ta.questionId,
                            answer: ta.answer,
                            isCorrect,
                        });
                    }
                });

                results.push({ teamId, correctCount, answers: answerResults });
            });

            // 정답 수로 정렬
            results.sort((a, b) => b.correctCount - a.correctCount);
            setTeamResults(results);
            setShowResults(true);
        } catch (error) {
            console.error("Failed to fetch team answers:", error);
        }
    };

    // 게임 초기화
    const handleResetGame = async () => {
        if (!confirm("모든 팀 답변을 초기화하시겠습니까?")) return;
        
        try {
            await fetch("/api/team-answers", { method: "DELETE" });
            await fetch("/api/game-state", { method: "DELETE" });
            setCurrentIndex(0);
            setShowAnswer(false);
            setShowResults(false);
            setTeamResults([]);
        } catch (error) {
            console.error("Failed to reset game:", error);
        }
    };

    const calculateVoteCounts = (answers: Answer[]) => {
        const counts = new Map<string, number>();
        answers.forEach((answer) => {
            counts.set(answer.name, (counts.get(answer.name) || 0) + 1);
        });
        const sorted = Array.from(counts.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        // 공동 순위 계산
        let currentRank = 1;
        let prevCount = -1;

        return sorted.map((item, index) => {
            if (item.count !== prevCount) {
                currentRank = index + 1;
            }
            prevCount = item.count;

            // 같은 순위가 2명 이상인지 확인
            const isTied = sorted.filter((s) => s.count === item.count).length > 1;

            return { ...item, rank: currentRank, isTied };
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <p className="text-2xl text-muted-foreground">로딩 중...</p>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <p className="text-2xl text-destructive">질문을 불러올 수 없습니다.</p>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];
    const voteCounts = calculateVoteCounts(currentQuestion.answers);
    const isLastQuestion = currentIndex === questions.length - 1;

    // 결과 집계 화면
    if (showResults) {
        return (
            <div className="min-h-screen bg-background text-foreground p-8">
                <div className="fixed top-4 right-4 z-50">
                    <ThemeToggle />
                </div>

                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
                        <h1 className="text-5xl font-black mb-2">🎉 최종 결과 🎉</h1>
                        <p className="text-xl text-muted-foreground">팀별 정답 수</p>
                    </div>

                    <div className="space-y-4 mb-8">
                        {teamResults.map((result, index) => {
                            const isWinner = index === 0;
                            const isSecond = index === 1;
                            return (
                                <Card
                                    key={result.teamId}
                                    className={`border-2 transition-all duration-300 ${
                                        isWinner
                                            ? "border-yellow-500 bg-yellow-500/10"
                                            : isSecond
                                            ? "border-gray-400 bg-gray-400/10"
                                            : "border-border bg-card/50"
                                    }`}
                                >
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <span
                                                    className={`text-4xl font-black ${
                                                        isWinner
                                                            ? "text-yellow-500"
                                                            : isSecond
                                                            ? "text-gray-400"
                                                            : "text-foreground"
                                                    }`}
                                                >
                                                    {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                                                </span>
                                                <span className="text-3xl font-bold">팀 {result.teamId}</span>
                                            </div>
                                            <div className="text-right">
                                                <div
                                                    className={`text-5xl font-black ${
                                                        isWinner ? "text-yellow-500" : "text-foreground"
                                                    }`}
                                                >
                                                    {result.correctCount}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    / {questions.length} 정답
                                                </div>
                                            </div>
                                        </div>

                                        {/* 각 질문별 답변 */}
                                        <div className="mt-4 grid grid-cols-5 gap-2">
                                            {questions.map((q, qIdx) => {
                                                const teamAnswer = result.answers.find(
                                                    (a) => a.questionId === q.id
                                                );
                                                return (
                                                    <div
                                                        key={q.id}
                                                        className={`p-2 rounded text-center text-xs ${
                                                            teamAnswer?.isCorrect
                                                                ? "bg-green-500/20 text-green-500"
                                                                : teamAnswer
                                                                ? "bg-red-500/20 text-red-500"
                                                                : "bg-muted/30 text-muted-foreground"
                                                        }`}
                                                    >
                                                        <div className="font-bold">Q{qIdx + 1}</div>
                                                        <div className="truncate">
                                                            {teamAnswer?.answer || "-"}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}

                        {teamResults.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                <p className="text-xl">제출된 팀 답변이 없습니다.</p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 justify-center">
                        <Button
                            onClick={() => setShowResults(false)}
                            size="lg"
                            variant="outline"
                            className="touch-manipulation"
                        >
                            <ChevronLeft className="w-5 h-5 mr-2" />
                            질문으로 돌아가기
                        </Button>
                        <Button
                            onClick={handleResetGame}
                            size="lg"
                            variant="destructive"
                            className="touch-manipulation"
                        >
                            <RotateCcw className="w-5 h-5 mr-2" />
                            게임 초기화
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            {/* Theme Toggle */}
            <div className="fixed top-4 right-4 z-50">
                <ThemeToggle />
            </div>

            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-black mb-2">진행자 화면</h1>
                        <p className="text-muted-foreground">
                            질문 {currentIndex + 1} / {questions.length}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={handlePrevious}
                            disabled={currentIndex === 0}
                            size="lg"
                            variant="outline"
                            className="touch-manipulation"
                        >
                            <ChevronLeft className="w-5 h-5 mr-2" />
                            이전 질문
                        </Button>
                        <Button
                            onClick={() => setShowAnswer(!showAnswer)}
                            size="lg"
                            className="bg-orange-500 hover:bg-orange-600 text-white touch-manipulation"
                        >
                            {showAnswer ? (
                                <>
                                    <EyeOff className="w-5 h-5 mr-2" />
                                    정답 숨기기
                                </>
                            ) : (
                                <>
                                    <Eye className="w-5 h-5 mr-2" />
                                    정답 공개
                                </>
                            )}
                        </Button>
                        {isLastQuestion ? (
                            <Button
                                onClick={handleShowResults}
                                size="lg"
                                className="bg-yellow-500 hover:bg-yellow-600 text-black touch-manipulation"
                            >
                                <Trophy className="w-5 h-5 mr-2" />
                                결과 집계
                            </Button>
                        ) : (
                            <Button
                                onClick={handleNext}
                                disabled={currentIndex === questions.length - 1}
                                size="lg"
                                variant="outline"
                                className="touch-manipulation"
                            >
                                다음 질문
                                <ChevronRight className="w-5 h-5 ml-2" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Question Display */}
            <div className="max-w-7xl mx-auto space-y-6">
                <Card className="border-2 border-orange-500 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-12">
                        <p className="text-5xl font-bold text-center leading-relaxed">{currentQuestion.text}</p>
                    </CardContent>
                </Card>

                {/* Answer Rankings */}
                {showAnswer && (
                    <div className="space-y-4">
                        <h2 className="text-3xl font-bold text-foreground">투표 결과</h2>
                        <div className="grid gap-4">
                            {voteCounts.map((item) => {
                                const allAnswers = currentQuestion.answers.filter((a) => a.name === item.name);
                                const isFirst = item.rank === 1;
                                const isSecond = item.rank === 2;

                                // 스타일 결정
                                const cardStyle = isFirst
                                    ? "border-orange-500 bg-orange-500/10"
                                    : isSecond
                                    ? "border-blue-500 bg-blue-500/10"
                                    : "border-border bg-card/50";

                                const textStyle = isFirst
                                    ? "text-orange-500"
                                    : isSecond
                                    ? "text-blue-500"
                                    : "text-foreground";

                                // 순위 텍스트 (공동인 경우 "공동" 추가)
                                const rankText = item.isTied ? `공동 ${item.rank}등` : `#${item.rank}`;

                                return (
                                    <Card
                                        key={item.name}
                                        className={`border-2 transition-all duration-300 ${cardStyle}`}
                                    >
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between gap-6">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-4 mb-3">
                                                        <span className={`text-3xl font-black ${textStyle}`}>
                                                            {rankText}
                                                        </span>
                                                        <span className="text-3xl font-bold text-foreground">
                                                            {item.name}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                                        {allAnswers.map((answer, idx) => (
                                                            <div
                                                                key={idx}
                                                                className={`flex items-start gap-3 p-3 rounded-lg ${
                                                                    isFirst
                                                                        ? "bg-orange-500/5 border border-orange-500/20"
                                                                        : isSecond
                                                                        ? "bg-blue-500/5 border border-blue-500/20"
                                                                        : "bg-muted/30 border border-border"
                                                                }`}
                                                            >
                                                                <span
                                                                    className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                                                                        isFirst
                                                                            ? "bg-orange-500 text-white"
                                                                            : isSecond
                                                                            ? "bg-blue-500 text-white"
                                                                            : "bg-muted text-muted-foreground"
                                                                    }`}
                                                                >
                                                                    {idx + 1}
                                                                </span>
                                                                <p className="text-base text-foreground leading-relaxed flex-1">
                                                                    {answer.reason || (
                                                                        <span className="text-muted-foreground italic">
                                                                            사유 없음
                                                                        </span>
                                                                    )}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="text-center min-w-[120px]">
                                                    <div className={`text-5xl font-black ${textStyle}`}>
                                                        {item.count}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground mt-1">표</div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Keyboard Shortcuts Help */}
            <div className="fixed bottom-6 right-6 bg-card/80 backdrop-blur-sm border border-border rounded-lg p-4 text-sm text-muted-foreground">
                <p className="font-semibold mb-2">키보드 단축키</p>
                <div className="space-y-1">
                    <p>← 이전 질문</p>
                    <p>→ 다음 질문</p>
                    <p>Space 정답 공개/숨기기</p>
                </div>
            </div>
        </div>
    );
}
