import { NextResponse } from 'next/server';
import type { Question } from '@/types/game';

// 서버에서만 ENV를 읽어서 질문 데이터 반환
export async function GET() {
    const questions: Question[] = [];

    for (let i = 1; i <= 10; i++) {
        const envKey = `VITE_Q${i}`;
        const questionData = process.env[envKey];

        if (questionData) {
            try {
                const parsed = JSON.parse(questionData);
                questions.push(parsed);
            } catch (error) {
                console.error(`Failed to parse ${envKey}:`, error);
            }
        }
    }

    return NextResponse.json(questions);
}
