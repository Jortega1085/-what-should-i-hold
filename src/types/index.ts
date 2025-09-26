export interface CareerStats {
  totalHands: number;
  correctDecisions: number;
  totalRTPGained: number;
  totalRTPLost: number;
  mistakesByGame: Record<string, number>;
  mistakesBySeverity: Record<string, number>;
  sessionsByDate: Record<string, {
    hands: number;
    correct: number;
    rtpGained: number;
    rtpLost: number;
  }>;
  bestStreak: number;
  currentStreak: number;
  startDate: string;
  lastPlayed: string;
  handsPerGame: Record<string, { played: number; correct: number }>;
}

export interface HistoryEntry {
  cards: string[];
  playerHold: number[];
  optimalHold: number[];
  correct: boolean;
  gameVariant: string;
  optimalEv?: number;
  timestamp?: string;
}

export interface GameStats {
  played: number;
  correct: number;
}

export interface OptimalHold {
  hold: number[];
  ev: number;
}

export interface StrategyOption {
  hold: number[];
  ev: number;
  description: string;
}