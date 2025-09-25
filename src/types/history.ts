export interface HistoryEntry {
  cards: string[];
  playerHold: number[];
  bestHold: number[];
  correct: boolean;
  gameVariant: string;
  optimalHold: number[];
  optimalEv: number;
}
