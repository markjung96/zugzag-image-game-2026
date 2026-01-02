"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Eye, EyeOff, Trophy, RotateCcw, Medal, Award, Sparkles, CheckCircle2, Circle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import type { Question, Answer } from "@/types/game";
import { ThemeToggle } from "@/components/theme-toggle";

interface TeamAnswerData {
    teamId: string;
    questionId: number;
    firstPlace: string;
    secondPlace: string;
    timestamp: number;
}

interface TeamResult {
    teamId: string;
    firstPlaceCorrect: number; // 1등 맞춘 횟수
    secondPlaceCorrect: number; // 2등 맞춘 횟수
    totalScore: number; // 총점 (1등: 2점, 2등: 1점)
    answers: {
        questionId: number;
        firstPlace: string;
        secondPlace: string;
        firstCorrect: boolean;
        secondCorrect: boolean;
    }[];
}

export default function HostPage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showResults, setShowResults] = useState(false);
    const [teamResults, setTeamResults] = useState<TeamResult[]>([]);
    const [teamSubmissions, setTeamSubmissions] = useState<Record<string, boolean>>({});

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

    // Poll team submissions every 2 seconds
    useEffect(() => {
        if (loading || questions.length === 0 || showResults) return;

        const currentQuestion = questions[currentIndex];
        if (!currentQuestion) return;

        async function fetchTeamSubmissions() {
            try {
                const response = await fetch("/api/team-answers");
                const answers: TeamAnswerData[] = await response.json();
                
                // 현재 질문에 대한 팀별 제출 현황
                const submissions: Record<string, boolean> = {};
                ["1", "2", "3", "4"].forEach(teamId => {
                    submissions[teamId] = answers.some(
                        a => a.teamId === teamId && a.questionId === currentQuestion.id
                    );
                });
                setTeamSubmissions(submissions);
            } catch (error) {
                console.error("Failed to fetch team submissions:", error);
            }
        }

        fetchTeamSubmissions();
        const interval = setInterval(fetchTeamSubmissions, 2000);

        return () => clearInterval(interval);
    }, [currentIndex, loading, questions, showResults]);

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
                let firstPlaceCorrect = 0;
                let secondPlaceCorrect = 0;
                const answerResults: TeamResult["answers"] = [];

                answers.forEach((ta) => {
                    const question = questions.find((q) => q.id === ta.questionId);
                    if (question) {
                        // 실제 1등, 2등 후보 찾기
                        const voteCounts = calculateVoteCounts(question.answers);
                        const actualFirst = voteCounts.filter((v) => v.rank === 1).map((v) => v.name);
                        const actualSecond = voteCounts.filter((v) => v.rank === 2).map((v) => v.name);

                        const firstCorrect = actualFirst.includes(ta.firstPlace);
                        const secondCorrect = actualSecond.includes(ta.secondPlace);

                        if (firstCorrect) firstPlaceCorrect++;
                        if (secondCorrect) secondPlaceCorrect++;

                        answerResults.push({
                            questionId: ta.questionId,
                            firstPlace: ta.firstPlace,
                            secondPlace: ta.secondPlace,
                            firstCorrect,
                            secondCorrect,
                        });
                    }
                });

                // 총점: 1등 맞추면 2점, 2등 맞추면 1점
                const totalScore = firstPlaceCorrect * 2 + secondPlaceCorrect * 1;

                results.push({
                    teamId,
                    firstPlaceCorrect,
                    secondPlaceCorrect,
                    totalScore,
                    answers: answerResults,
                });
            });

            // 총점으로 정렬
            results.sort((a, b) => b.totalScore - a.totalScore);
            setTeamResults(results);
            setShowResults(true);
        } catch (error) {
            console.error("Failed to fetch team answers:", error);
        }
    };

    // 게임 초기화
    const handleResetGame = async () => {
        if (!confirm("모든 팀 답변과 세션을 초기화하시겠습니까?")) return;

        try {
            await fetch("/api/team-answers", { method: "DELETE" });
            await fetch("/api/game-state", { method: "DELETE" });
            await fetch("/api/team-session?resetAll=true", { method: "DELETE" });
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
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <Sparkles className="w-8 h-8 text-yellow-500" />
                            <h1 className="text-5xl font-black">최종 결과</h1>
                            <Sparkles className="w-8 h-8 text-yellow-500" />
                        </div>
                        <p className="text-xl text-muted-foreground">팀별 점수</p>
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
                                                {index === 0 ? (
                                                    <Medal className="w-10 h-10 text-yellow-500" />
                                                ) : index === 1 ? (
                                                    <Medal className="w-10 h-10 text-gray-400" />
                                                ) : index === 2 ? (
                                                    <Medal className="w-10 h-10 text-amber-600" />
                                                ) : (
                                                    <span className="w-10 h-10 flex items-center justify-center text-2xl font-black text-foreground">
                                                        #{index + 1}
                                                    </span>
                                                )}
                                                <span className="text-3xl font-bold">팀 {result.teamId}</span>
                                            </div>
                                            <div className="text-right">
                                                <div
                                                    className={`text-5xl font-black ${
                                                        isWinner ? "text-yellow-500" : "text-foreground"
                                                    }`}
                                                >
                                                    {result.totalScore}점
                                                </div>
                                                <div className="text-sm flex gap-3 justify-end mt-1">
                                                    <span className="text-orange-500 flex items-center gap-1">
                                                        <Award className="w-4 h-4" /> {result.firstPlaceCorrect}개
                                                    </span>
                                                    <span className="text-blue-500 flex items-center gap-1">
                                                        <Award className="w-4 h-4" /> {result.secondPlaceCorrect}개
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 각 질문별 답변 */}
                                        <div className="mt-4 grid grid-cols-5 gap-2">
                                            {questions.map((q, qIdx) => {
                                                const teamAnswer = result.answers.find((a) => a.questionId === q.id);
                                                const bothCorrect =
                                                    teamAnswer?.firstCorrect && teamAnswer?.secondCorrect;
                                                const anyCorrect =
                                                    teamAnswer?.firstCorrect || teamAnswer?.secondCorrect;
                                                return (
                                                    <div
                                                        key={q.id}
                                                        className={`p-2 rounded text-center text-xs ${
                                                            bothCorrect
                                                                ? "bg-green-500/20 border border-green-500/50"
                                                                : anyCorrect
                                                                ? "bg-yellow-500/20 border border-yellow-500/50"
                                                                : teamAnswer
                                                                ? "bg-red-500/20 border border-red-500/50"
                                                                : "bg-muted/30 text-muted-foreground"
                                                        }`}
                                                    >
                                                        <div className="font-bold text-foreground">Q{qIdx + 1}</div>
                                                        {teamAnswer ? (
                                                            <div className="space-y-0.5">
                                                                <div
                                                                    className={`truncate flex items-center gap-0.5 ${
                                                                        teamAnswer.firstCorrect
                                                                            ? "text-green-500"
                                                                            : "text-red-500"
                                                                    }`}
                                                                >
                                                                    <span className="text-orange-500">1</span>{" "}
                                                                    {teamAnswer.firstPlace}
                                                                </div>
                                                                <div
                                                                    className={`truncate flex items-center gap-0.5 ${
                                                                        teamAnswer.secondCorrect
                                                                            ? "text-green-500"
                                                                            : "text-red-500"
                                                                    }`}
                                                                >
                                                                    <span className="text-blue-500">2</span>{" "}
                                                                    {teamAnswer.secondPlace}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-muted-foreground">-</div>
                                                        )}
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
                        <div className="flex items-center gap-4">
                            <p className="text-muted-foreground">
                                질문 {currentIndex + 1} / {questions.length}
                            </p>
                            {/* 팀 제출 현황 */}
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-card/50 rounded-full border border-border">
                                <span className="text-xs text-muted-foreground mr-1">제출:</span>
                                {["1", "2", "3", "4"].map((teamId) => (
                                    <div
                                        key={teamId}
                                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all ${
                                            teamSubmissions[teamId]
                                                ? "bg-green-500/20 text-green-500"
                                                : "bg-muted/50 text-muted-foreground"
                                        }`}
                                    >
                                        {teamSubmissions[teamId] ? (
                                            <CheckCircle2 className="w-3 h-3" />
                                        ) : (
                                            <Circle className="w-3 h-3" />
                                        )}
                                        <span>팀{teamId}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
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
