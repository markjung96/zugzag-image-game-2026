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
import { Gamepad2, Users, Lock } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
    const router = useRouter();
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

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
                            <div className="space-y-3">
                                <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center group-hover:scale-110 group-hover:bg-muted/80 transition-all duration-300">
                                    <Users className="w-7 h-7 text-muted-foreground" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold mb-1">팀 선택</h2>
                                    <p className="text-sm text-muted-foreground">참여할 팀을 선택하세요</p>
                                </div>
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

                {/* Footer text */}
                <p className="text-center text-sm text-muted-foreground mt-8">
                    팀을 선택하여 게임에 참여하거나 진행자 모드로 게임을 관리하세요
                </p>
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
        </div>
    );
}
