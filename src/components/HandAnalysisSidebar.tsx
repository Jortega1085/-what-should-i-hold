import React from 'react';
import { motion } from 'framer-motion';

interface HandAnalysisSidebarProps {
  cards: string[];
  paytable: Record<string, number>;
  best: { hold: number[]; ev: number };
  game: string;
  currentTheme: Record<string, string>;
  showHandAnalysis: boolean;
  setShowHandAnalysis: (show: boolean) => void;
  getAllStrategyOptions: (cards: string[], paytable: Record<string, number>) => any[];
  getStrategyExplanation: (cards: string[], best: any, game: string) => string;
}

export function HandAnalysisSidebar({
  cards,
  paytable,
  best,
  game,
  currentTheme,
  showHandAnalysis,
  setShowHandAnalysis,
  getAllStrategyOptions,
  getStrategyExplanation,
}: HandAnalysisSidebarProps) {
  const allOptions = getAllStrategyOptions(cards, paytable);
  const optimalOption = allOptions[0];

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed right-20 top-1/2 transform -translate-y-1/2 z-40 w-96 max-h-[80vh] overflow-y-auto"
    >
      <div className={`${currentTheme.panel} rounded-2xl ${currentTheme.shadow} ${currentTheme.border} border p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">💡</span>
            Current Hand Analysis
          </h3>
          <button
            onClick={() => setShowHandAnalysis(false)}
            className={`${currentTheme.textMuted} hover:${currentTheme.text} transition-colors`}
          >
            ✕
          </button>
        </div>

        {/* Strategy Options Comparison */}
        <div className="space-y-3">
          {/* Optimal Choice */}
          <div className="bg-green-100 border border-green-300 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-green-800">🏆 OPTIMAL CHOICE</span>
              <span className="text-green-700 font-medium">RTP: {(optimalOption.ev * 100).toFixed(1)}%</span>
            </div>
            <div className="text-green-700">
              <div className="mb-1">
                <strong>Hold:</strong> {optimalOption.hold.length > 0 ? optimalOption.hold.map((i: number) => cards[i]).join(", ") : "None (Draw 5)"}
              </div>
              <div className="text-sm">
                <strong>Why:</strong> {getStrategyExplanation(cards, best, game)}
              </div>
            </div>
          </div>

          {/* Alternative Options */}
          {allOptions.slice(1, 3).map((option, idx) => {
            const difference = optimalOption.ev - option.ev;
            let severityColor = difference <= 0.1 ? "yellow" : difference <= 0.5 ? "orange" : "red";

            return (
              <div key={idx} className={`bg-${severityColor}-50 border border-${severityColor}-200 rounded-lg p-3`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium text-${severityColor}-800`}>#{idx + 2} Alternative</span>
                  <div className="text-right text-sm">
                    <div className={`text-${severityColor}-700 font-medium`}>RTP: {(option.ev * 100).toFixed(1)}%</div>
                    <div className={`text-${severityColor}-600 text-xs`}>Cost: -{(difference * 100).toFixed(1)}%</div>
                  </div>
                </div>
                <div className={`text-${severityColor}-700 text-sm`}>
                  <strong>Hold:</strong> {option.hold.length > 0 ? option.hold.map((i: number) => cards[i]).join(", ") : "None"} - {option.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}