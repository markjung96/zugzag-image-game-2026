"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2, Award, UserX } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Question, GameState } from "@/types/game";
import { ThemeToggle } from "@/components/theme-toggle";

// 선택 가능한 팀원 목록
const TEAM_MEMBERS = [
    "박범찬",
    "이상현",
    "이효섭",
    "정형섭",
    "신태환",
    "정승필",
    "이덕재",
    "장연재",
    "김도현",
    "고우진",
    "정지원",
    "김현우",
    "한기상",
    "임홍진",
    "박상현",
    "강태현",
    "문성현",
    "윤현호",
    "김회찬",
    "이우근",
    "임원태",
    "전수훈",
    "하성종",
    "김성엽",
    "류승호",
    "성경민",
];

// 세션 토큰 생성
function generateSessionToken() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

interface TeamAnswerData {
    teamId: string;
    questionId: number;
    firstPlace: string;
    secondPlace: string;
}

export default function TeamPage() {
    const params = useParams();
    const router = useRouter();
    const teamId = params.id as string;

    const [questions, setQuestions] = useState<Question[]>([]);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [firstPlace, setFirstPlace] = useState(""); // 1등 예측
    const [secondPlace, setSecondPlace] = useState(""); // 2등 예측
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sessionBlocked, setSessionBlocked] = useState(false);
    const [sessionToken, setSessionToken] = useState<string | null>(null);

    // 세션 토큰을 메모리에서 관리 (브라우저 세션 동안만 유지)
    const sessionTokenRef = useRef<string | null>(null);

    const currentQuestion = questions[gameState?.currentQuestionIndex ?? 0];

    // 세션 관리 (localStorage 사용 안 함)
    const checkAndCreateSession = useCallback(async () => {
        // 이미 토큰이 있으면 재사용
        if (!sessionTokenRef.current) {
            sessionTokenRef.current = generateSessionToken();
        }

        const token = sessionTokenRef.current;
        setSessionToken(token);

        // 세션 생성/heartbeat
        try {
            const response = await fetch("/api/team-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ teamId, sessionToken: token }),
            });

            if (response.status === 409) {
                // 다른 사람이 접속 중
                setSessionBlocked(true);
                return false;
            }

            setSessionBlocked(false);
            return true;
        } catch (error) {
            console.error("Failed to check session:", error);
            return true; // 에러 시 접속 허용
        }
    }, [teamId]);

    // 초기 세션 체크
    useEffect(() => {
        checkAndCreateSession();
    }, [checkAndCreateSession]);

    // Heartbeat (3초마다)
    useEffect(() => {
        if (!sessionToken || sessionBlocked) return;

        const interval = setInterval(async () => {
            try {
                const response = await fetch("/api/team-session", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ teamId, sessionToken }),
                });

                if (response.status === 409) {
                    setSessionBlocked(true);
                }
            } catch (error) {
                console.error("Heartbeat failed:", error);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [teamId, sessionToken, sessionBlocked]);

    // 페이지 떠날 때 세션 해제
    useEffect(() => {
        const handleUnload = () => {
            if (sessionToken) {
                navigator.sendBeacon(`/api/team-session?teamId=${teamId}&sessionToken=${sessionToken}`, "");
            }
        };

        window.addEventListener("beforeunload", handleUnload);
        return () => window.removeEventListener("beforeunload", handleUnload);
    }, [teamId, sessionToken]);

    // Redis에서 현재 질문의 답변 로드
    useEffect(() => {
        if (!currentQuestion) return;

        async function loadAnswerFromServer() {
            try {
                const response = await fetch("/api/team-answers");
                const allAnswers: TeamAnswerData[] = await response.json();

                // 현재 팀의 현재 질문에 대한 답변 찾기
                const currentAnswer = allAnswers.find(
                    (a) => a.teamId === teamId && a.questionId === currentQuestion.id
                );

                if (currentAnswer) {
                    setFirstPlace(currentAnswer.firstPlace || "");
                    setSecondPlace(currentAnswer.secondPlace || "");
                    setSubmitted(true);
                } else {
                    setFirstPlace("");
                    setSecondPlace("");
                    setSubmitted(false);
                }
            } catch (error) {
                console.error("Failed to load answer from server:", error);
                setFirstPlace("");
                setSecondPlace("");
                setSubmitted(false);
            }
        }

        loadAnswerFromServer();
    }, [gameState?.currentQuestionIndex, currentQuestion?.id, teamId]);

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

    const handleSubmit = async () => {
        if (!firstPlace.trim() || !secondPlace.trim() || !currentQuestion) return;

        // Redis에만 저장
        try {
            await fetch("/api/team-answers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    teamId,
                    questionId: currentQuestion.id,
                    firstPlace: firstPlace.trim(),
                    secondPlace: secondPlace.trim(),
                }),
            });
            setSubmitted(true);
        } catch (error) {
            console.error("Failed to save answer to server:", error);
        }
    };

    const handleEdit = () => {
        setSubmitted(false);
    };

    const handleViewResults = () => {
        router.push(`/team/${teamId}/results`);
    };

    // 세션 차단 화면
    if (sessionBlocked) {
        const otherTeams = ["1", "2", "3", "4"].filter((t) => t !== teamId);

        return (
            <div className="min-h-screen bg-background text-foreground p-6">
                {/* Theme Toggle */}
                <div className="fixed top-4 right-4 z-50">
                    <ThemeToggle />
                </div>

                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] -z-10"></div>

                <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[80vh] space-y-8">
                    {/* 메인 카드 */}
                    <Card className="border-2 border-red-500/50 bg-card/80 backdrop-blur-sm w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <CardContent className="p-8 text-center space-y-6">
                            {/* 아이콘 애니메이션 */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-24 h-24 bg-red-500/20 rounded-full animate-ping"></div>
                                </div>
                                <UserX className="w-20 h-20 text-red-500 mx-auto relative z-10" />
                            </div>

                            <div className="space-y-2">
                                <h1 className="text-3xl font-black text-foreground">접속 불가</h1>
                                <div className="inline-block px-4 py-1 bg-orange-500/20 rounded-full">
                                    <span className="text-orange-500 font-bold">팀 {teamId}</span>
                                </div>
                            </div>

                            <div className="space-y-3 text-muted-foreground">
                                <p className="text-lg">다른 팀원이 이미 접속해 있습니다</p>
                                <div className="p-4 bg-muted/50 rounded-lg text-sm space-y-2">
                                    <p>
                                        💡 <strong>왜 이런 메시지가 나올까요?</strong>
                                    </p>
                                    <p>각 팀은 한 명만 접속할 수 있습니다.</p>
                                    <p>팀 대표 한 명이 답변을 제출해주세요!</p>
                                </div>
                            </div>

                            <div className="pt-4 space-y-3">
                                <Button
                                    onClick={() => checkAndCreateSession()}
                                    variant="outline"
                                    size="lg"
                                    className="w-full border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                                >
                                    🔄 다시 시도하기
                                </Button>
                                <Button onClick={() => router.push("/")} variant="ghost" size="lg" className="w-full">
                                    홈으로 돌아가기
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 다른 팀 선택 */}
                    <Card className="border border-zinc-700 bg-card/50 backdrop-blur-sm w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <CardContent className="p-6 space-y-4">
                            <h2 className="text-lg font-semibold text-center text-muted-foreground">
                                다른 팀으로 입장하기
                            </h2>
                            <div className="grid grid-cols-3 gap-3">
                                {otherTeams.map((team) => (
                                    <Button
                                        key={team}
                                        onClick={() => router.push(`/team/${team}`)}
                                        variant="outline"
                                        size="lg"
                                        className="h-16 text-xl font-bold hover:border-orange-500 hover:text-orange-500 hover:bg-orange-500/10"
                                    >
                                        팀 {team}
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* 도움말 */}
                    <p className="text-sm text-muted-foreground text-center animate-in fade-in duration-1000">
                        접속 중인 팀원이 페이지를 떠나면 10초 후 접속 가능합니다
                    </p>
                </div>
            </div>
        );
    }

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
                        <h2 className="text-3xl font-bold text-center leading-relaxed">{currentQuestion.text}</h2>
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
                                <div className="space-y-2">
                                    <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/30">
                                        <p className="text-sm text-orange-500 font-semibold mb-1 flex items-center gap-1">
                                            <Award className="w-4 h-4" /> 1등 예측
                                        </p>
                                        <p className="text-xl font-medium text-foreground">{firstPlace}</p>
                                    </div>
                                    <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                                        <p className="text-sm text-blue-500 font-semibold mb-1 flex items-center gap-1">
                                            <Award className="w-4 h-4" /> 2등 예측
                                        </p>
                                        <p className="text-xl font-medium text-foreground">{secondPlace}</p>
                                    </div>
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
                            <div className="space-y-6">
                                {/* 1등 선택 */}
                                <div>
                                    <label className="text-sm font-medium text-orange-500 mb-3 flex items-center gap-1">
                                        <Award className="w-4 h-4" /> 1등 예측 선택
                                    </label>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                        {TEAM_MEMBERS.map((name) => (
                                            <Button
                                                key={name}
                                                onClick={() => setFirstPlace(name)}
                                                variant={firstPlace === name ? "default" : "outline"}
                                                size="sm"
                                                disabled={secondPlace === name}
                                                className={`touch-manipulation text-sm py-3 h-auto ${
                                                    firstPlace === name
                                                        ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                                                        : secondPlace === name
                                                        ? "opacity-30"
                                                        : "hover:border-orange-500 hover:text-orange-500"
                                                }`}
                                            >
                                                {name}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* 2등 선택 */}
                                <div>
                                    <label className="text-sm font-medium text-blue-500 mb-3 flex items-center gap-1">
                                        <Award className="w-4 h-4" /> 2등 예측 선택
                                    </label>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                        {TEAM_MEMBERS.map((name) => (
                                            <Button
                                                key={name}
                                                onClick={() => setSecondPlace(name)}
                                                variant={secondPlace === name ? "default" : "outline"}
                                                size="sm"
                                                disabled={firstPlace === name}
                                                className={`touch-manipulation text-sm py-3 h-auto ${
                                                    secondPlace === name
                                                        ? "bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
                                                        : firstPlace === name
                                                        ? "opacity-30"
                                                        : "hover:border-blue-500 hover:text-blue-500"
                                                }`}
                                            >
                                                {name}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <Button
                                    onClick={handleSubmit}
                                    disabled={!firstPlace.trim() || !secondPlace.trim()}
                                    size="lg"
                                    className="w-full bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 text-white touch-manipulation h-14 text-lg font-semibold disabled:opacity-50"
                                >
                                    {firstPlace && secondPlace
                                        ? `1등: ${firstPlace} / 2등: ${secondPlace} 제출하기`
                                        : "1등과 2등을 모두 선택해주세요"}
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
                        : "팀원 이름을 선택한 후 제출해주세요"}
                </p>
            </div>
        </div>
    );
}
