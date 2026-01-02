export interface Answer {
    name: string;
    reason: string;
}

export interface Question {
    id: number;
    text: string;
    answers: Answer[];
}

export interface VoteCount {
    name: string;
    count: number;
}

export interface TeamAnswer {
    questionId: number;
    answer: string;
    isCorrect?: boolean;
}

export interface GameState {
    currentQuestionIndex: number;
    totalQuestions: number;
    resetTimestamp?: number; // 게임 초기화 시 타임스탬프
}
