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
}
