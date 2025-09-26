import React from 'react';
import { motion } from 'framer-motion';
import { rank, suit } from '../logic/solver';
import { PAYTABLES } from '../data/paytables';
import { HistoryList } from './HistoryList';
import { HandAnalysisSidebar } from './HandAnalysisSidebar';
import { CareerStats, HistoryEntry } from '../types';

interface TrainingModeProps {
  game: string;
  cards: string[];
  playerHold: number[];
  score: { played: number; correct: number };
  careerStats: CareerStats;
  history: HistoryEntry[];
  showHandAnalysis: boolean;
  currentTheme: Record<string, string>;
  paytable: Record<string, number>;
  best: { hold: number[]; ev: number };
  feedbackMessage: {text: string, isCorrect: boolean} | null;
  handleGameChange: (game: string) => void;
  toggleHold: (index: number) => void;
  dealRandom: () => void;
  submitHold: () => void;
  setShowHandAnalysis: (show: boolean) => void;
  getCardColor: (suit: string) => string;
  getAllStrategyOptions: (cards: string[], paytable: Record<string, number>) => any[];
  getStrategyExplanation: (cards: string[], best: any, game: string) => string;
  calculateMistakeSeverity: any;
  getPlayerStrategyExplanation: any;
}

export function TrainingMode({
  game,
  cards,
  playerHold,
  score,
  careerStats,
  history,
  showHandAnalysis,
  currentTheme,
  paytable,
  best,
  feedbackMessage,
  handleGameChange,
  toggleHold,
  dealRandom,
  submitHold,
  setShowHandAnalysis,
  getCardColor,
  getAllStrategyOptions,
  getStrategyExplanation,
  calculateMistakeSeverity,
  getPlayerStrategyExplanation,
}: TrainingModeProps) {
  return (
    <div>
      {/* Game Variant Selector */}
      <div className={`${currentTheme.glassPanel} rounded-2xl p-8 mb-8 ${currentTheme.shadow}`}>
        <label className={`mr-3 font-bold text-lg ${currentTheme.text}`}>Game Variant:</label>
        <select
          value={game}
          onChange={e => handleGameChange(e.target.value)}
          className={`${currentTheme.panel} ${currentTheme.text} border rounded-lg px-4 py-2 font-medium ${currentTheme.border}`}
        >
          {Object.keys(PAYTABLES).map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {/* Session Stats */}
      <div className={`${currentTheme.glassPanel} rounded-2xl p-6 mb-8 ${currentTheme.shadow}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Current Session */}
          <div>
            <div className={`text-xl font-bold ${currentTheme.text} mb-2`}>🎮 Current Session</div>
            <div className={`text-2xl font-bold ${
              score.played > 0 && score.correct/score.played >= 0.8 ? 'text-green-600' :
              score.played > 0 && score.correct/score.played >= 0.6 ? 'text-yellow-600' : 'text-slate-600'
            }`}>
              {score.correct}/{score.played} ({score.played > 0 ? Math.round((score.correct/score.played)*100) : 0}%)
            </div>
            <div className={`text-sm ${currentTheme.textMuted} font-medium`}>
              Streak: {careerStats.currentStreak}
            </div>
          </div>

          {/* Career Overview - Game Specific */}
          <div>
            <div className={`text-xl font-bold ${currentTheme.text} mb-2`}>🏆 {game} Career</div>
            <div className={`text-2xl font-bold ${(() => {
              const gameStats = careerStats.handsPerGame[game] || { played: 0, correct: 0 };
              const accuracy = gameStats.played > 0 ? gameStats.correct/gameStats.played : 0;
              return accuracy >= 0.8 ? 'text-green-600' : accuracy >= 0.6 ? 'text-yellow-600' : 'text-slate-600';
            })()}`}>
              {(() => {
                const gameStats = careerStats.handsPerGame[game] || { played: 0, correct: 0 };
                const accuracy = gameStats.played > 0 ? ((gameStats.correct/gameStats.played)*100).toFixed(1) : 0;
                return `${gameStats.correct.toLocaleString()}/${gameStats.played.toLocaleString()} (${accuracy}%)`;
              })()}
            </div>
            <div className={`text-sm ${currentTheme.textMuted} font-medium`}>
              Best: {careerStats.bestStreak} • Mistakes: {careerStats.mistakesByGame[game] || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Card Display */}
      <div className="flex justify-center gap-5 mb-6">
        {cards.map((c, i) => {
          const cardRank = rank(c);
          const cardSuit = suit(c);
          const colorClass = getCardColor(cardSuit);
          return (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="text-sm text-gray-500">Card {i+1}</div>
              <button
                onClick={() => toggleHold(i)}
                className={`relative w-16 h-24 rounded-xl border-2 ${currentTheme.cardBg} ${currentTheme.shadow} transition-all duration-300 hover:shadow-2xl hover:scale-105 ${
                  playerHold.includes(i) ? "border-green-500 bg-green-100" : "border-gray-300 hover:border-blue-400"
                }`}
              >
                <div className={`flex flex-col items-center justify-center h-full ${colorClass}`}>
                  <div className="text-lg font-bold">{cardRank}</div>
                  <div className="text-xl">{cardSuit}</div>
                </div>
                {playerHold.includes(i) && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded font-bold">
                    HOLD
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col items-center gap-4 mb-8">
        <div className="flex justify-center gap-4">
          <button
            onClick={dealRandom}
            className={`px-6 py-3 rounded-xl text-white font-bold transition-all duration-300 hover:scale-105 ${currentTheme.secondaryBtn} ${currentTheme.shadow}`}
          >
            🎲 Deal Random
          </button>
          <button
            onClick={submitHold}
            className={`px-6 py-3 rounded-xl text-white font-bold hover:scale-105 ${currentTheme.primaryBtn} ${currentTheme.shadow}`}
          >
            ✅ Submit Hold
          </button>
        </div>

        {/* Feedback Message */}
        {feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`text-2xl font-bold ${
              feedbackMessage.isCorrect ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {feedbackMessage.text}
          </motion.div>
        )}
      </div>

      {/* Hand Analysis Button - Fixed to Right Side */}
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50">
        <motion.button
          onClick={() => setShowHandAnalysis(!showHandAnalysis)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`${currentTheme.glassPanel} ${currentTheme.shadow} rounded-xl p-3 transition-all duration-300 hover:shadow-xl ${currentTheme.text}`}
          title={showHandAnalysis ? 'Hide Analysis' : 'Show Analysis'}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl">💡</span>
            <span className="text-xs font-semibold">Analysis</span>
            <motion.div
              animate={{ rotate: showHandAnalysis ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className={`text-sm ${currentTheme.textMuted}`}
            >
              {showHandAnalysis ? '→' : '←'}
            </motion.div>
          </div>
        </motion.button>
      </div>

      {/* Hand Analysis Panel */}
      {showHandAnalysis && (
        <HandAnalysisSidebar
          cards={cards}
          paytable={paytable}
          best={best}
          game={game}
          currentTheme={currentTheme}
          showHandAnalysis={showHandAnalysis}
          setShowHandAnalysis={setShowHandAnalysis}
          getAllStrategyOptions={getAllStrategyOptions}
          getStrategyExplanation={getStrategyExplanation}
        />
      )}

      {/* Recent Hands */}
      <div className={`${currentTheme.glassPanel} rounded-3xl ${currentTheme.shadow} p-8`}>
        <div className={`text-xl font-bold mb-4 ${currentTheme.text}`}>🎯 Recent Hands</div>
        {history.length === 0 && <div className={`${currentTheme.textMuted} text-sm`}>No hands yet.</div>}
        <HistoryList
          history={history}
          currentTheme={currentTheme}
          fallbackPaytable={paytable}
          defaultGame={game}
          calculateMistakeSeverity={calculateMistakeSeverity}
          getPlayerStrategyExplanation={getPlayerStrategyExplanation}
          getStrategyExplanation={getStrategyExplanation}
        />
      </div>
    </div>
  );
}