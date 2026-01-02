"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Question, GameState, TeamAnswer } from "@/types/game";
import { ThemeToggle } from "@/components/theme-toggle";

export default function TeamPage() {
    const params = useParams();
    const router = useRouter();
    const teamId = params.id as string;

    const [questions, setQuestions] = useState<Question[]>([]);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [answer, setAnswer] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(true);

    const currentQuestion = questions[gameState?.currentQuestionIndex ?? 0];
    const storageKey = `team-${teamId}-answers`;

    // Load saved answers from localStorage
    useEffect(() => {
        if (!currentQuestion) return;

        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                const answers: TeamAnswer[] = JSON.parse(saved);
                const currentAnswer = answers.find(
                    (a) => a.questionId === currentQuestion.id
                );
                if (currentAnswer) {
                    setAnswer(currentAnswer.answer);
                    setSubmitted(true);
                } else {
                    setAnswer("");
                    setSubmitted(false);
                }
            } catch (error) {
                console.error("Failed to load saved answers:", error);
                setAnswer("");
                setSubmitted(false);
            }
        } else {
            setAnswer("");
            setSubmitted(false);
        }
    }, [gameState?.currentQuestionIndex, currentQuestion?.id, storageKey]);

    // Fetch questions on mount
    useEffect(() => {
        async function fetchQuestions() {
            try {
                const response = await fetch("/api/questions");
                const data = await response.json();
                setQuestions(data);
            } catch (error) {
                console.error("Failed to fetch questions:", error);
            }
        }
        fetchQuestions();
    }, []);

    // Poll game state every 500ms
    useEffect(() => {
        async function pollGameState() {
            try {
                const response = await fetch("/api/game-state");
                const data: GameState = await response.json();
                setGameState(data);
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch game state:", error);
                setLoading(false);
            }
        }

        pollGameState();
        const interval = setInterval(pollGameState, 500);

        return () => clearInterval(interval);
    }, []);

    const handleSubmit = () => {
        if (!answer.trim() || !currentQuestion) return;

        const saved = localStorage.getItem(storageKey);
        let answers: TeamAnswer[] = [];

        if (saved) {
            try {
                answers = JSON.parse(saved);
            } catch (error) {
                console.error("Failed to parse saved answers:", error);
            }
        }

        // Remove existing answer for this question
        answers = answers.filter((a) => a.questionId !== currentQuestion.id);

        // Add new answer
        answers.push({
            questionId: currentQuestion.id,
            answer: answer.trim(),
        });

        localStorage.setItem(storageKey, JSON.stringify(answers));
        setSubmitted(true);
    };

    const handleEdit = () => {
        setSubmitted(false);
    };

    const handleViewResults = () => {
        router.push(`/team/${teamId}/results`);
    };

    if (loading || !gameState || questions.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
            </div>
        );
    }

    const isLastQuestion = gameState.currentQuestionIndex === gameState.totalQuestions - 1;

    return (
        <div className="min-h-screen bg-background text-foreground p-6 touch-manipulation">
            {/* Theme Toggle */}
            <div className="fixed top-4 right-4 z-50">
                <ThemeToggle />
            </div>

            {/* Subtle background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] -z-10"></div>

            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="inline-block px-6 py-2 bg-orange-500 rounded-full">
                        <h1 className="text-3xl font-black text-foreground">팀 {teamId}</h1>
                    </div>
                    <p className="text-xl text-muted-foreground">
                        질문 {gameState.currentQuestionIndex + 1} / {gameState.totalQuestions}
                    </p>
                </div>

                {/* Question Card */}
                <Card className="border-2 border-orange-500 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-8">
                        <h2 className="text-3xl font-bold text-center leading-relaxed">
                            {currentQuestion.text}
                        </h2>
                    </CardContent>
                </Card>

                {/* Answer Input */}
                <Card className="border-2 border-zinc-700 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6 space-y-4">
                        {submitted ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-green-500">
                                    <CheckCircle2 className="w-6 h-6" />
                                    <span className="text-lg font-semibold">답변이 제출되었습니다</span>
                                </div>
                                <div className="p-4 bg-muted/50 rounded-lg border border-border">
                                    <p className="text-xl font-medium text-foreground">{answer}</p>
                                </div>
                                <Button
                                    onClick={handleEdit}
                                    variant="outline"
                                    size="lg"
                                    className="w-full touch-manipulation"
                                >
                                    답변 수정하기
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                        팀의 답변을 입력하세요
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="답변 입력..."
                                        value={answer}
                                        onChange={(e) => setAnswer(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                handleSubmit();
                                            }
                                        }}
                                        className="text-lg h-14"
                                        autoFocus
                                    />
                                </div>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={!answer.trim()}
                                    size="lg"
                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white touch-manipulation h-14 text-lg font-semibold"
                                >
                                    답변 제출
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* View Results Button - Only show on last question if answered */}
                {isLastQuestion && submitted && (
                    <Button
                        onClick={handleViewResults}
                        size="lg"
                        variant="outline"
                        className="w-full border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white touch-manipulation h-14 text-lg font-semibold animate-in fade-in slide-in-from-bottom-4 duration-500"
                    >
                        결과 확인하기
                    </Button>
                )}

                {/* Info */}
                <p className="text-center text-sm text-muted-foreground">
                    {submitted
                        ? "진행자가 다음 질문으로 넘어가면 자동으로 이동합니다"
                        : "답변을 제출하면 수정할 수 있습니다"}
                </p>
            </div>
        </div>
    );
}
