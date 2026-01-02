import { NextRequest, NextResponse } from 'next/server';
import { kvStore } from '@/lib/kv';
import type { GameState } from '@/types/game';

const GAME_STATE_KEY = 'game:state';

// GET: 현재 게임 상태 조회
export async function GET() {
    const state = await kvStore.get<GameState>(GAME_STATE_KEY);

    if (!state) {
        // 초기 상태
        const initialState: GameState = {
            currentQuestionIndex: 0,
            totalQuestions: 10,
        };
        await kvStore.set(GAME_STATE_KEY, initialState);
        return NextResponse.json(initialState);
    }

    return NextResponse.json(state);
}

// POST: 게임 상태 업데이트 (Host만 사용)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { currentQuestionIndex } = body;

        if (typeof currentQuestionIndex !== 'number') {
            return NextResponse.json(
                { error: 'Invalid question index' },
                { status: 400 }
            );
        }

        const state: GameState = {
            currentQuestionIndex,
            totalQuestions: 10,
        };

        await kvStore.set(GAME_STATE_KEY, state);

        return NextResponse.json(state);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to update game state' },
            { status: 500 }
        );
    }
}

// DELETE: 게임 초기화
export async function DELETE() {
    await kvStore.del(GAME_STATE_KEY);

    const initialState: GameState = {
        currentQuestionIndex: 0,
        totalQuestions: 10,
    };

    await kvStore.set(GAME_STATE_KEY, initialState);

    return NextResponse.json(initialState);
}
