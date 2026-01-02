import { NextRequest, NextResponse } from 'next/server';
import { kvStore } from '@/lib/kv';

interface TeamSession {
    teamId: string;
    sessionToken: string;
    lastHeartbeat: number;
}

const TEAM_SESSIONS_KEY = 'team:sessions';
const HEARTBEAT_TIMEOUT = 10000; // 10초 동안 heartbeat 없으면 접속 해제

// GET: 팀 접속 상태 확인
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const sessionToken = searchParams.get('sessionToken');

    if (!teamId) {
        return NextResponse.json({ error: 'teamId required' }, { status: 400 });
    }

    let sessions = await kvStore.get<TeamSession[]>(TEAM_SESSIONS_KEY);
    if (!sessions) sessions = [];

    // 타임아웃된 세션 제거
    const now = Date.now();
    sessions = sessions.filter(s => now - s.lastHeartbeat < HEARTBEAT_TIMEOUT);
    await kvStore.set(TEAM_SESSIONS_KEY, sessions);

    const existingSession = sessions.find(s => s.teamId === teamId);

    if (!existingSession) {
        // 아무도 접속 안 함
        return NextResponse.json({ available: true, isOwner: false });
    }

    if (sessionToken && existingSession.sessionToken === sessionToken) {
        // 본인이 접속 중
        return NextResponse.json({ available: true, isOwner: true });
    }

    // 다른 사람이 접속 중
    return NextResponse.json({ available: false, isOwner: false });
}

// POST: 팀 접속 (세션 생성 또는 heartbeat)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { teamId, sessionToken } = body;

        if (!teamId || !sessionToken) {
            return NextResponse.json({ error: 'teamId and sessionToken required' }, { status: 400 });
        }

        let sessions = await kvStore.get<TeamSession[]>(TEAM_SESSIONS_KEY);
        if (!sessions) sessions = [];

        // 타임아웃된 세션 제거
        const now = Date.now();
        sessions = sessions.filter(s => now - s.lastHeartbeat < HEARTBEAT_TIMEOUT);

        const existingSession = sessions.find(s => s.teamId === teamId);

        if (existingSession) {
            if (existingSession.sessionToken === sessionToken) {
                // 본인 heartbeat 업데이트
                existingSession.lastHeartbeat = now;
                await kvStore.set(TEAM_SESSIONS_KEY, sessions);
                return NextResponse.json({ success: true, message: 'heartbeat updated' });
            } else {
                // 다른 사람이 이미 접속 중
                return NextResponse.json({ success: false, message: 'already occupied' }, { status: 409 });
            }
        }

        // 새 세션 생성
        sessions.push({
            teamId,
            sessionToken,
            lastHeartbeat: now,
        });

        await kvStore.set(TEAM_SESSIONS_KEY, sessions);
        return NextResponse.json({ success: true, message: 'session created' });
    } catch (error) {
        console.error('Failed to manage team session:', error);
        return NextResponse.json({ error: 'Failed to manage session' }, { status: 500 });
    }
}

// DELETE: 팀 접속 해제 또는 모든 세션 초기화
export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const sessionToken = searchParams.get('sessionToken');
    const resetAll = searchParams.get('resetAll');

    if (resetAll === 'true') {
        // 모든 세션 초기화 (호스트용)
        await kvStore.del(TEAM_SESSIONS_KEY);
        return NextResponse.json({ success: true, message: 'all sessions cleared' });
    }

    if (!teamId || !sessionToken) {
        return NextResponse.json({ error: 'teamId and sessionToken required' }, { status: 400 });
    }

    let sessions = await kvStore.get<TeamSession[]>(TEAM_SESSIONS_KEY);
    if (!sessions) sessions = [];

    const sessionIndex = sessions.findIndex(s => s.teamId === teamId && s.sessionToken === sessionToken);
    
    if (sessionIndex === -1) {
        return NextResponse.json({ success: false, message: 'session not found' }, { status: 404 });
    }

    sessions.splice(sessionIndex, 1);
    await kvStore.set(TEAM_SESSIONS_KEY, sessions);

    return NextResponse.json({ success: true, message: 'session removed' });
}

