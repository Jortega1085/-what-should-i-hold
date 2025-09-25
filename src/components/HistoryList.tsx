import React from "react";
import { motion } from "framer-motion";

import { PAYTABLES } from "../data/paytables";
import { getOptimalHoldForGame, Paytable } from "../logic/solver";
import { HistoryEntry } from "../types/history";

interface OptimalHold {
  hold: number[];
  ev: number;
}

interface HistoryListProps {
  history: HistoryEntry[];
  currentTheme: Record<string, string>;
  fallbackPaytable: Paytable;
  defaultGame: string;
  calculateMistakeSeverity: (
    playerHold: number[],
    optimalHold: OptimalHold,
    cards: string[],
    paytable: Paytable
  ) => {
    playerEV: number;
    optimalEV: number;
    difference: number;
    severity: string;
    color: string;
    severityDescription: string;
  };
  getPlayerStrategyExplanation: (cards: string[], playerHold: number[], playerEV: number, game: string) => string;
  getStrategyExplanation: (cards: string[], optimalHold: OptimalHold, game: string) => string;
}

export function HistoryList({
  history,
  currentTheme,
  fallbackPaytable,
  defaultGame,
  calculateMistakeSeverity,
  getPlayerStrategyExplanation,
  getStrategyExplanation,
}: HistoryListProps): React.ReactElement {
  return (
    <div>
      {history.map((entry, idx) => {
        const variant = entry.gameVariant || defaultGame;
        const paytable = PAYTABLES[variant] ?? fallbackPaytable;
        const fallbackOptimal = getOptimalHoldForGame(entry.cards, paytable, variant);
        const historicalOptimal = entry.optimalHold && entry.optimalHold.length > 0
          ? { hold: entry.optimalHold, ev: entry.optimalEv ?? fallbackOptimal.ev }
          : fallbackOptimal;

        const mistake = calculateMistakeSeverity(entry.playerHold, historicalOptimal, entry.cards, paytable);
        const playerAnalysis = getPlayerStrategyExplanation(entry.cards, entry.playerHold, mistake.playerEV, variant);
        const optimalAnalysis = getStrategyExplanation(entry.cards, historicalOptimal, variant);

        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.1 }}
            className={`mb-4 p-4 rounded-2xl border transition-all duration-300 ${
              entry.correct
                ? `${currentTheme.glassPanel} border-green-500/30 bg-gradient-to-r from-green-50/50 to-emerald-50/50`
                : `${currentTheme.glassPanel} border-red-500/30 bg-gradient-to-r from-red-50/50 to-rose-50/50`
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className={`font-semibold text-lg mb-2 ${currentTheme.text}`}>
                  Cards: {entry.cards.join(", ")}
                </div>
                <div className={`mb-3 ${currentTheme.textMuted}`}>
                  <div>
                    <strong>Your Hold:</strong> {entry.playerHold.length > 0 ? entry.playerHold.map(i => entry.cards[i]).join(", ") : "None"}
                  </div>
                  <div>
                    <strong>Optimal:</strong> {historicalOptimal.hold.length > 0 ? historicalOptimal.hold.map(i => entry.cards[i]).join(", ") : "None"}
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-3">
                  <span className={entry.correct ? "text-green-600 font-bold text-lg" : "text-red-600 font-bold text-lg"}>
                    {entry.correct ? "✅ Correct" : "❌ Incorrect"}
                  </span>
                  <div className="flex gap-4 text-sm">
                    <span className={currentTheme.textMuted}>
                      Your RTP: <span className="font-semibold">{(mistake.playerEV * 100).toFixed(1)}%</span>
                    </span>
                    <span className={currentTheme.textMuted}>
                      Optimal RTP: <span className="font-semibold">{(mistake.optimalEV * 100).toFixed(1)}%</span>
                    </span>
                    <span className={`font-semibold ${mistake.color}`}>
                      Cost: {entry.correct ? `+${(mistake.difference * 100).toFixed(1)}%` : `-${(mistake.difference * 100).toFixed(1)}%`} ({mistake.severity})
                    </span>
                  </div>

                  {!entry.correct && (
                    <div className={`mt-3 p-3 rounded-lg border-l-4 ${mistake.color.replace('text-', 'border-l-')} bg-gray-50`}>
                      <div className={`font-medium text-sm ${mistake.color} mb-1`}>
                        📝 Mistake Analysis: {mistake.severity}
                      </div>
                      <div className="text-sm text-gray-700">{mistake.severityDescription}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {!entry.correct && (
                  <div className={`p-3 rounded-xl ${currentTheme.glassPanel} border border-red-200/50`}>
                    <div className={`font-medium text-red-700 mb-1`}>👤 Your Strategy:</div>
                    <div className={`text-sm ${currentTheme.textMuted}`}>{playerAnalysis}</div>
                  </div>
                )}
                <div className={`p-3 rounded-xl ${currentTheme.glassPanel} border border-green-200/50`}>
                  <div className={`font-medium text-green-700 mb-1`}>🎯 Optimal Strategy:</div>
                  <div className={`text-sm ${currentTheme.textMuted}`}>{optimalAnalysis}</div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
