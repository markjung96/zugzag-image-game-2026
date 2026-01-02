"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, Lock, Home, Sparkles, ThumbsUp, Flame, Trophy } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Question, TeamAnswer } from "@/types/game";
import { ThemeToggle } from "@/components/theme-toggle";

export default function TeamResultsPage() {
    const params = useParams();
    const router = useRouter();
    const teamId = params.id as string;

    const [questions, setQuestions] = useState<Question[]>([]);
    const [teamAnswers, setTeamAnswers] = useState<TeamAnswer[]>([]);
    const [showPasswordDialog, setShowPasswordDialog] = useState(true);
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    const storageKey = `team-${teamId}-answers`;

    // Load data on mount
    useEffect(() => {
        async function fetchQuestions() {
            try {
                const response = await fetch("/api/questions");
                const data = await response.json();
                setQuestions(data);

                // Load team answers from localStorage
                const saved = localStorage.getItem(storageKey);
                if (saved) {
                    const answers: TeamAnswer[] = JSON.parse(saved);

                    // Check if answer is correct
                    const answersWithCorrectness = answers.map((answer) => {
                        const question = data.find((q: Question) => q.id === answer.questionId);
                        if (!question) return answer;

                        // Calculate vote counts
                        const counts = new Map<string, number>();
                        question.answers.forEach((a: { name: string }) => {
                            counts.set(a.name, (counts.get(a.name) || 0) + 1);
                        });

                        // Find the most voted answer
                        let maxCount = 0;
                        let correctAnswers: string[] = [];
                        counts.forEach((count, name) => {
                            if (count > maxCount) {
                                maxCount = count;
                                correctAnswers = [name];
                            } else if (count === maxCount) {
                                correctAnswers.push(name);
                            }
                        });

                        // Check if team's answer matches any correct answer (case-insensitive)
                        const isCorrect = correctAnswers.some(
                            (correct) => correct.toLowerCase().trim() === answer.answer.toLowerCase().trim()
                        );

                        return { ...answer, isCorrect };
                    });

                    setTeamAnswers(answersWithCorrectness);
                }

                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch questions:", error);
                setLoading(false);
            }
        }

        fetchQuestions();
    }, [storageKey]);

    const handlePasswordSubmit = () => {
        if (password === "1805") {
            setShowPasswordDialog(false);
            setAuthenticated(true);
            setError("");
        } else {
            setError("비밀번호가 올바르지 않습니다");
            setPassword("");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handlePasswordSubmit();
        }
    };

    const correctCount = teamAnswers.filter((a) => a.isCorrect).length;
    const totalCount = teamAnswers.length;
    const scorePercentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <p className="text-2xl text-muted-foreground">로딩 중...</p>
            </div>
        );
    }

    if (!authenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Dialog open={showPasswordDialog} onOpenChange={(open) => !open && router.push("/")}>

                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Lock className="w-5 h-5 text-orange-500" />
                                결과 확인 인증
                            </DialogTitle>
                            <DialogDescription>
                                결과를 확인하려면 비밀번호를 입력하세요
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <Input
                                type="password"
                                placeholder="비밀번호 입력"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="text-center text-lg tracking-widest"
                                autoFocus
                            />
                            {error && (
                                <p className="text-sm text-destructive text-center">{error}</p>
                            )}
                        </div>
                        <DialogFooter className="sm:justify-center">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push("/")}
                            >
                                홈으로
                            </Button>
                            <Button
                                type="button"
                                onClick={handlePasswordSubmit}
                                className="bg-orange-500 hover:bg-orange-600 text-white"
                            >
                                확인
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-6 touch-manipulation">
            {/* Theme Toggle */}
            <div className="fixed top-4 right-4 z-50">
                <ThemeToggle />
            </div>

            {/* Subtle background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] -z-10"></div>

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="inline-block px-6 py-2 bg-orange-500 rounded-full">
                        <h1 className="text-3xl font-black text-foreground">팀 {teamId} 결과</h1>
                    </div>
                </div>

                {/* Score Summary */}
                <Card className="border-2 border-orange-500 bg-gradient-to-br from-orange-500/10 to-transparent backdrop-blur-sm">
                    <CardContent className="p-8 text-center space-y-4">
                        <div className="text-7xl font-black text-orange-500">
                            {scorePercentage}점
                        </div>
                        <div className="text-2xl font-bold text-foreground">
                            {correctCount} / {totalCount} 정답
                        </div>
                        <p className="text-lg text-muted-foreground flex items-center justify-center gap-2">
                            {scorePercentage >= 80 && <><Sparkles className="w-5 h-5 text-yellow-500" /> 훌륭합니다!</>}
                            {scorePercentage >= 60 && scorePercentage < 80 && <><ThumbsUp className="w-5 h-5 text-green-500" /> 잘했습니다!</>}
                            {scorePercentage >= 40 && scorePercentage < 60 && <><Trophy className="w-5 h-5 text-blue-500" /> 괜찮아요!</>}
                            {scorePercentage < 40 && <><Flame className="w-5 h-5 text-orange-500" /> 다음엔 더 잘할 수 있어요!</>}
                        </p>
                    </CardContent>
                </Card>

                {/* Detailed Results */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-foreground">상세 결과</h2>
                    {questions.map((question) => {
                        const teamAnswer = teamAnswers.find((a) => a.questionId === question.id);

                        // Calculate correct answer(s)
                        const counts = new Map<string, number>();
                        question.answers.forEach((a) => {
                            counts.set(a.name, (counts.get(a.name) || 0) + 1);
                        });
                        const maxCount = Math.max(...Array.from(counts.values()));
                        const correctAnswers = Array.from(counts.entries())
                            .filter(([_, count]) => count === maxCount)
                            .map(([name]) => name);

                        const isCorrect = teamAnswer?.isCorrect ?? false;

                        return (
                            <Card
                                key={question.id}
                                className={`border-2 ${
                                    isCorrect
                                        ? "border-green-500 bg-green-500/10"
                                        : "border-red-500 bg-red-500/10"
                                } backdrop-blur-sm`}
                            >
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex items-start gap-3">
                                        {isCorrect ? (
                                            <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                                        ) : (
                                            <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                                        )}
                                        <div className="flex-1 space-y-3">
                                            <div>
                                                <span className="text-sm text-muted-foreground">
                                                    질문 {question.id}
                                                </span>
                                                <p className="text-xl font-bold text-foreground">
                                                    {question.text}
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <div>
                                                    <span className="text-sm text-muted-foreground">
                                                        우리 팀 답변:
                                                    </span>
                                                    <p className="text-lg font-semibold text-foreground">
                                                        {teamAnswer?.answer || "답변 없음"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-sm text-muted-foreground">
                                                        정답:
                                                    </span>
                                                    <p className="text-lg font-semibold text-orange-500">
                                                        {correctAnswers.join(", ")} ({maxCount}표)
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Home Button */}
                <Button
                    onClick={() => router.push("/")}
                    size="lg"
                    variant="outline"
                    className="w-full touch-manipulation h-14 text-lg font-semibold"
                >
                    <Home className="w-5 h-5 mr-2" />
                    홈으로 돌아가기
                </Button>
            </div>
        </div>
    );
}
