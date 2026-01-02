import { NextRequest, NextResponse } from 'next/server';
import { kvStore } from '@/lib/kv';

interface TeamAnswerData {
    teamId: string;
    questionId: number;
    answer: string;
    timestamp: number;
}

const TEAM_ANSWERS_KEY = 'team:answers';

// GET: 모든 팀 답변 조회
export async function GET() {
    const answers = await kvStore.get<TeamAnswerData[]>(TEAM_ANSWERS_KEY);
    return NextResponse.json(answers || []);
}

// POST: 팀 답변 저장
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { teamId, questionId, answer } = body;

        if (!teamId || questionId === undefined || !answer) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        let answers = await kvStore.get<TeamAnswerData[]>(TEAM_ANSWERS_KEY);
        if (!answers) {
            answers = [];
        }

        // 같은 팀의 같은 질문 답변 제거 (업데이트)
        answers = answers.filter(
            (a) => !(a.teamId === teamId && a.questionId === questionId)
        );

        // 새 답변 추가
        answers.push({
            teamId,
            questionId,
            answer,
            timestamp: Date.now(),
        });

        await kvStore.set(TEAM_ANSWERS_KEY, answers);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to save team answer:', error);
        return NextResponse.json(
            { error: 'Failed to save answer' },
            { status: 500 }
        );
    }
}

// DELETE: 모든 팀 답변 초기화
export async function DELETE() {
    await kvStore.del(TEAM_ANSWERS_KEY);
    return NextResponse.json({ success: true });
}

