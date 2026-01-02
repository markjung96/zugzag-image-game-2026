"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Gamepad2, Users, Lock, HelpCircle, Award, Trophy, UserCheck, QrCode, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { QRCodeSVG } from "qrcode.react";

export default function Home() {
    const router = useRouter();
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [showQRDialog, setShowQRDialog] = useState(false);
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    // 클라이언트에서 현재 URL 가져오기
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

    const handleHostClick = () => {
        setShowPasswordDialog(true);
        setPassword("");
        setError("");
    };

    const handlePasswordSubmit = () => {
        if (password === "1805") {
            setShowPasswordDialog(false);
            router.push("/host");
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

    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4 relative overflow-hidden touch-manipulation">
            {/* Theme Toggle */}
            <div className="fixed top-4 right-4 z-50">
                <ThemeToggle />
            </div>

            {/* Subtle grid pattern background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            <div className="absolute top-1/4 right-1/3 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-3xl"></div>

            <div className="w-full max-w-4xl relative z-10">
                {/* Main title section */}
                <div className="text-center mb-12 space-y-4">
                    <div className="inline-block">
                        <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter text-balance text-foreground">
                            ZUGZAG
                        </h1>
                        <div className="h-1 w-full bg-orange-500 mt-2 rounded-full"></div>
                    </div>
                    <p className="text-xl sm:text-2xl text-muted-foreground font-medium">2026 이미지 게임</p>
                </div>

                {/* Cards container */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Host Card */}
                    <Card className="group hover:shadow-2xl hover:shadow-orange-500/20 active:scale-[0.98] transition-all duration-500 border-2 hover:border-orange-500 bg-card/50 backdrop-blur-sm touch-manipulation">
                        <CardContent className="p-8 space-y-6">
                            <div className="space-y-3">
                                <div className="w-14 h-14 rounded-xl bg-orange-500/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-orange-500/30 transition-all duration-300">
                                    <Gamepad2 className="w-7 h-7 text-orange-500" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold mb-1">진행자 화면</h2>
                                    <p className="text-sm text-muted-foreground">게임을 관리하고 진행하세요</p>
                                </div>
                            </div>
                            <Button
                                size="lg"
                                className="w-full h-14 text-lg font-semibold active:scale-95 transition-transform touch-manipulation bg-orange-500 hover:bg-orange-600 text-white"
                                onClick={handleHostClick}
                            >
                                시작하기
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Teams Card */}
                    <Card className="group hover:shadow-2xl hover:shadow-white/10 active:scale-[0.98] transition-all duration-500 border-2 hover:border-zinc-700 bg-card/50 backdrop-blur-sm touch-manipulation">
                        <CardContent className="p-8 space-y-6">
                            <div className="flex items-start justify-between">
                                <div className="space-y-3">
                                    <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center group-hover:scale-110 group-hover:bg-muted/80 transition-all duration-300">
                                        <Users className="w-7 h-7 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold mb-1">팀 선택</h2>
                                        <p className="text-sm text-muted-foreground">참여할 팀을 선택하세요</p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="shrink-0 border-2 hover:border-orange-500 hover:text-orange-500"
                                    onClick={() => setShowQRDialog(true)}
                                >
                                    <QrCode className="w-5 h-5" />
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {[1, 2, 3, 4].map((teamNum) => (
                                    <Button
                                        key={teamNum}
                                        variant="outline"
                                        size="lg"
                                        className="h-16 text-lg font-semibold active:scale-95 transition-all duration-300 border-2 touch-manipulation bg-card hover:bg-muted border-border hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10"
                                        onClick={() => router.push(`/team/${teamNum}`)}
                                    >
                                        <span className="mr-1.5 text-muted-foreground">Team</span>
                                        <span className="text-2xl font-black text-foreground">{teamNum}</span>
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 이용설명 */}
                <Card className="mt-8 border border-border bg-card/30 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <HelpCircle className="w-5 h-5 text-orange-500" />
                            <h3 className="text-lg font-bold">게임 방법</h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6 text-sm">
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <UserCheck className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                                    <div>
                                        <p className="font-semibold text-foreground">팀 선택</p>
                                        <p className="text-muted-foreground">
                                            팀 1~4 중 하나를 선택하세요. 팀당 한 명만 접속 가능합니다.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Award className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="font-semibold text-foreground">1등 & 2등 예측</p>
                                        <p className="text-muted-foreground">각 질문마다 1등과 2등을 맞춰보세요.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <Trophy className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="font-semibold text-foreground">점수 계산</p>
                                        <p className="text-muted-foreground">
                                            1등 맞추면 <span className="text-orange-500 font-bold">2점</span>, 2등
                                            맞추면 <span className="text-blue-500 font-bold">1점</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Users className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="font-semibold text-foreground">공동 순위</p>
                                        <p className="text-muted-foreground">
                                            공동 1등/2등이 있으면 그 중{" "}
                                            <span className="font-bold">아무나 선택해도</span> 정답!
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Password Dialog */}
            <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-orange-500" />
                            진행자 인증
                        </DialogTitle>
                        <DialogDescription>진행자 화면에 접근하려면 비밀번호를 입력하세요</DialogDescription>
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
                        {error && <p className="text-sm text-destructive text-center">{error}</p>}
                    </div>
                    <DialogFooter className="sm:justify-center">
                        <Button type="button" variant="outline" onClick={() => setShowPasswordDialog(false)}>
                            취소
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

            {/* QR Code Dialog */}
            <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <QrCode className="w-5 h-5 text-orange-500" />
                            팀 접속 QR 코드
                        </DialogTitle>
                        <DialogDescription>스마트폰으로 QR 코드를 스캔하여 팀 페이지에 접속하세요</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
                        {[1, 2, 3, 4].map((teamNum) => (
                            <div
                                key={teamNum}
                                className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-border bg-white"
                            >
                                <div className="text-lg font-bold text-zinc-900">팀 {teamNum}</div>
                                {baseUrl && (
                                    <QRCodeSVG
                                        value={`${baseUrl}/team/${teamNum}`}
                                        size={120}
                                        level="M"
                                        includeMargin={false}
                                    />
                                )}
                                <p className="text-xs text-zinc-500 text-center break-all">
                                    {baseUrl}/team/{teamNum}
                                </p>
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowQRDialog(false)}
                            className="w-full sm:w-auto"
                        >
                            <X className="w-4 h-4 mr-2" />
                            닫기
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
