"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import type { Question, Answer } from "@/types/game";
import { ThemeToggle } from "@/components/theme-toggle";

export default function HostPage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [loading, setLoading] = useState(true);

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

    // Keyboard shortcuts
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "ArrowRight" && currentIndex < questions.length - 1) {
                handleNext();
            } else if (e.key === "ArrowLeft" && currentIndex > 0) {
                handlePrevious();
            } else if (e.key === " ") {
                e.preventDefault();
                setShowAnswer((prev) => !prev);
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentIndex, questions.length]);

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            setShowAnswer(false);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
            setShowAnswer(false);
        }
    };

    const calculateVoteCounts = (answers: Answer[]) => {
        const counts = new Map<string, number>();
        answers.forEach((answer) => {
            counts.set(answer.name, (counts.get(answer.name) || 0) + 1);
        });
        return Array.from(counts.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
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
                    </div>
                </div>
            </div>

            {/* Question Display */}
            <div className="max-w-7xl mx-auto space-y-6">
                <Card className="border-2 border-orange-500 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-12">
                        <p className="text-5xl font-bold text-center leading-relaxed">
                            {currentQuestion.text}
                        </p>
                    </CardContent>
                </Card>

                {/* Answer Rankings */}
                {showAnswer && (
                    <div className="space-y-4">
                        <h2 className="text-3xl font-bold text-foreground">투표 결과</h2>
                        <div className="grid gap-4">
                            {voteCounts.map((item, index) => {
                                const answer = currentQuestion.answers.find(
                                    (a) => a.name === item.name
                                );
                                const isFirst = index === 0;
                                return (
                                    <Card
                                        key={item.name}
                                        className={`border-2 transition-all duration-300 ${
                                            isFirst
                                                ? "border-orange-500 bg-orange-500/10"
                                                : "border-border bg-card/50"
                                        }`}
                                    >
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between gap-6">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-4 mb-3">
                                                        <span
                                                            className={`text-4xl font-black ${
                                                                isFirst ? "text-orange-500" : "text-foreground"
                                                            }`}
                                                        >
                                                            #{index + 1}
                                                        </span>
                                                        <span className="text-3xl font-bold text-foreground">
                                                            {item.name}
                                                        </span>
                                                    </div>
                                                    <p className="text-lg text-muted-foreground leading-relaxed">
                                                        {answer?.reason}
                                                    </p>
                                                </div>
                                                <div className="text-center min-w-[120px]">
                                                    <div
                                                        className={`text-5xl font-black ${
                                                            isFirst ? "text-orange-500" : "text-foreground"
                                                        }`}
                                                    >
                                                        {item.count}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground mt-1">
                                                        표
                                                    </div>
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
