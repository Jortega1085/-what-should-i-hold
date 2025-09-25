import React from "react";
import { motion } from "framer-motion";

import { PAYTABLES } from "../data/paytables";
import { CareerStats } from "../types/stats";

type ThemeName = "light" | "dark" | "casino";

type ThemeStyles = {
  glassPanel: string;
  text: string;
  textMuted: string;
  shadow: string;
  dangerBtn: string;
  secondaryBtn: string;
};

const modalThemes: Record<ThemeName, ThemeStyles & Record<string, string>> = {
  light: {
    glassPanel: "bg-gradient-to-br from-white/90 via-white/70 to-white/90 backdrop-blur-2xl border border-white/40",
    text: "text-slate-900",
    textMuted: "text-slate-600",
    shadow: "shadow-2xl shadow-slate-200/40",
    dangerBtn: "bg-gradient-to-r from-red-600 via-rose-700 to-red-700 hover:from-red-700 hover:via-rose-800 hover:to-red-800 shadow-lg shadow-red-500/25",
    secondaryBtn: "bg-gradient-to-r from-slate-600 via-gray-700 to-slate-800 hover:from-slate-700 hover:via-gray-800 hover:to-slate-900 shadow-lg shadow-slate-500/25",
  },
  dark: {
    glassPanel: "bg-gradient-to-br from-slate-800/90 via-slate-900/70 to-slate-800/90 backdrop-blur-2xl border border-slate-700/40",
    text: "text-slate-100",
    textMuted: "text-slate-400",
    shadow: "shadow-2xl shadow-black/40",
    dangerBtn: "bg-gradient-to-r from-red-600 via-pink-700 to-rose-700 hover:from-red-700 hover:via-pink-800 hover:to-rose-800 shadow-lg shadow-red-500/25",
    secondaryBtn: "bg-gradient-to-r from-slate-700 via-gray-800 to-slate-900 hover:from-slate-600 hover:via-gray-700 hover:to-slate-800 shadow-lg shadow-slate-500/25",
  },
  casino: {
    glassPanel: "bg-gradient-to-br from-emerald-800/50 via-green-900/40 to-emerald-800/50 backdrop-blur-2xl border border-emerald-600/30",
    text: "text-emerald-50",
    textMuted: "text-emerald-200",
    shadow: "shadow-2xl shadow-emerald-900/50",
    dangerBtn: "bg-gradient-to-r from-red-600 via-rose-700 to-red-700 hover:from-red-700 hover:via-rose-800 hover:to-red-800 shadow-lg shadow-red-500/25",
    secondaryBtn: "bg-gradient-to-r from-emerald-700 via-green-800 to-teal-800 hover:from-emerald-600 hover:via-green-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25",
  }
};

interface CareerStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: CareerStats;
  onReset: () => void;
  theme: ThemeName;
  currentGame: string;
  onGameChange: (game: string) => void;
}

export function CareerStatsModal({
  isOpen,
  onClose,
  stats,
  onReset,
  theme,
  currentGame,
  onGameChange,
}: CareerStatsModalProps): React.ReactElement | null {
  if (!isOpen) return null;

  const currentTheme = modalThemes[theme];

  const gameStats = stats.handsPerGame[currentGame] || { played: 0, correct: 0 };
  const gameAccuracy = gameStats.played > 0 ? (gameStats.correct / gameStats.played * 100) : 0;
  const gameMistakes = stats.mistakesByGame[currentGame] || 0;

  const overallAccuracy = stats.totalHands > 0 ? (stats.correctDecisions / stats.totalHands * 100) : 0;
  const recentSessions = Object.entries(stats.sessionsByDate)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 7);

  const daysPlaying = Object.keys(stats.sessionsByDate).length;
  const avgHandsPerSession = daysPlaying > 0 ? Math.round(stats.totalHands / daysPlaying) : 0;
  const mostPlayedGame = Object.entries(stats.handsPerGame)
    .sort(([, a], [, b]) => b.played - a.played)[0];
  const rtpEfficiency = stats.totalRTPLost > 0
    ? Math.max(0, 100 - (stats.totalRTPLost / stats.totalHands * 100))
    : 100;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 bg-black bg-opacity-80"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="relative z-10"
      >
        <div className={`${currentTheme.glassPanel} rounded-3xl p-8 max-w-7xl w-full max-h-[95vh] overflow-y-auto ${currentTheme.shadow} backdrop-blur-3xl`}>
          <div className="flex items-center justify-between mb-8">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className={`text-4xl font-black ${currentTheme.text} flex items-center gap-4 mb-2`}>
                <span className="text-5xl">📊</span>
                Professional Career Analytics
              </h3>
              <p className={`text-lg ${currentTheme.textMuted} font-medium`}>
                Comprehensive performance tracking across all poker variants
              </p>
              <div className="mt-3 flex items-center gap-4">
                <label className={`text-sm font-semibold ${currentTheme.text} mr-2`}>
                  Focus Game:
                </label>
                <select
                  value={currentGame}
                  onChange={e => onGameChange(e.target.value)}
                  className={`${currentTheme.glassPanel} ${currentTheme.text} border rounded-xl px-4 py-2 text-sm font-semibold shadow-md`}
                >
                  {Object.keys(PAYTABLES).map(g => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>
            <motion.button
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              onClick={onClose}
              className={`px-6 py-3 rounded-2xl ${currentTheme.text} hover:bg-black/10 transition-all duration-300 font-bold text-lg`}
            >
              <span className="text-3xl">✕</span>
            </motion.button>
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h4 className={`text-2xl font-black mb-6 ${currentTheme.text} flex items-center gap-3`}>
              <span className="text-3xl">🏆</span>
              Executive Performance Dashboard
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className={`${currentTheme.glassPanel} rounded-3xl p-6 text-center transform hover:scale-105 transition-all duration-300 shadow-xl`}>
                <div className="text-4xl mb-2">🎯</div>
                <div className={`text-4xl font-black ${overallAccuracy >= 90 ? 'text-emerald-600' : overallAccuracy >= 80 ? 'text-green-600' : overallAccuracy >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {overallAccuracy.toFixed(1)}%
                </div>
                <div className={`text-sm ${currentTheme.textMuted} font-bold`}>Overall Mastery</div>
                <div className={`text-xs ${currentTheme.textMuted} mt-1`}>
                  {stats.correctDecisions.toLocaleString()}/{stats.totalHands.toLocaleString()} correct
                </div>
              </div>

              <div className={`${currentTheme.glassPanel} rounded-3xl p-6 text-center transform hover:scale-105 transition-all duration-300 shadow-xl`}>
                <div className="text-4xl mb-2">💎</div>
                <div className={`text-4xl font-black ${rtpEfficiency >= 95 ? 'text-emerald-600' : rtpEfficiency >= 90 ? 'text-green-600' : rtpEfficiency >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {rtpEfficiency.toFixed(1)}%
                </div>
                <div className={`text-sm ${currentTheme.textMuted} font-bold`}>RTP Efficiency</div>
                <div className={`text-xs ${currentTheme.textMuted} mt-1`}>
                  {stats.totalRTPLost.toFixed(2)}% total lost
                </div>
              </div>

              <div className={`${currentTheme.glassPanel} rounded-3xl p-6 text-center transform hover:scale-105 transition-all duration-300 shadow-xl`}>
                <div className="text-4xl mb-2">🔥</div>
                <div className={`text-4xl font-black ${stats.bestStreak >= 20 ? 'text-emerald-600' : stats.bestStreak >= 10 ? 'text-green-600' : stats.bestStreak >= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {stats.bestStreak}
                </div>
                <div className={`text-sm ${currentTheme.textMuted} font-bold`}>Best Streak
              </div>
              <div className={`text-xs ${currentTheme.textMuted} mt-1`}>
                Current: {stats.currentStreak}
              </div>
            </div>

            <div className={`${currentTheme.glassPanel} rounded-3xl p-6 text-center transform hover:scale-105 transition-all duration-300 shadow-xl`}>
              <div className="text-4xl mb-2">📈</div>
              <div className={`text-4xl font-black ${currentTheme.text}`}>{avgHandsPerSession}</div>
              <div className={`text-sm ${currentTheme.textMuted} font-bold`}>Avg Hands/Session</div>
              <div className={`text-xs ${currentTheme.textMuted} mt-1`}>{daysPlaying} sessions total</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h4 className={`text-2xl font-black mb-6 ${currentTheme.text} flex items-center gap-3`}>
            <span className="text-3xl">🎮</span>
            {currentGame} - Deep Performance Analysis
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`${currentTheme.glassPanel} rounded-3xl p-6 col-span-2`}>
              <h5 className={`text-lg font-bold mb-4 ${currentTheme.text} flex items-center gap-2`}>
                <span className="text-2xl">📊</span>
                Performance Metrics
              </h5>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className={`text-3xl font-black ${gameAccuracy >= 85 ? 'text-emerald-600' : gameAccuracy >= 75 ? 'text-green-600' : gameAccuracy >= 65 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {gameAccuracy.toFixed(1)}%
                  </div>
                  <div className={`text-sm ${currentTheme.textMuted} font-semibold`}>Game Accuracy</div>
                  <div className={`text-xs ${currentTheme.textMuted} mt-1`}>{gameStats.correct}/{gameStats.played} hands</div>
                </div>
                <div className="text-center">
                  <div className={`text-3xl font-black ${gameMistakes === 0 ? 'text-emerald-600' : gameMistakes <= 5 ? 'text-green-600' : gameMistakes <= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {gameMistakes}
                  </div>
                  <div className={`text-sm ${currentTheme.textMuted} font-semibold`}>Total Mistakes</div>
                  <div className={`text-xs ${currentTheme.textMuted} mt-1`}>In this variant</div>
                </div>
              </div>
            </div>

            <div className={`${currentTheme.glassPanel} rounded-3xl p-6`}>
              <h5 className={`text-lg font-bold mb-4 ${currentTheme.text} flex items-center gap-2`}>
                <span className="text-2xl">🏅</span>
                Skill Level
              </h5>
              <div className="text-center">
                <div className="text-6xl mb-2">
                  {gameAccuracy >= 95 ? '🥇' : gameAccuracy >= 85 ? '🥈' : gameAccuracy >= 75 ? '🥉' : gameAccuracy >= 65 ? '📚' : '🎯'}
                </div>
                <div className={`text-lg font-bold ${currentTheme.text}`}>
                  {gameAccuracy >= 95 ? 'Expert' : gameAccuracy >= 85 ? 'Advanced' : gameAccuracy >= 75 ? 'Intermediate' : gameAccuracy >= 65 ? 'Learning' : 'Beginner'}
                </div>
                <div className={`text-sm ${currentTheme.textMuted}`}>
                  {gameStats.played.toLocaleString()} hands played
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h4 className={`text-2xl font-black mb-6 ${currentTheme.text} flex items-center gap-3`}>
            <span className="text-3xl">🃏</span>
            Multi-Game Performance Mastery
          </h4>

          {Object.entries(stats.handsPerGame).length === 0 ? (
            <div className={`${currentTheme.glassPanel} rounded-3xl p-12 text-center`}>
              <div className="text-6xl mb-4">🎯</div>
              <div className={`text-xl font-bold ${currentTheme.text} mb-2`}>
                Ready to Track Your Journey
              </div>
              <div className={`text-lg ${currentTheme.textMuted}`}>
                Start playing to see detailed performance analytics across all poker variants!
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(stats.handsPerGame)
                .sort(([, a], [, b]) => b.played - a.played)
                .map(([gameName, gameStats]) => {
                  const accuracy = gameStats.played > 0 ? (gameStats.correct / gameStats.played * 100) : 0;
                  const mistakes = stats.mistakesByGame[gameName] || 0;
                  const skillLevel = accuracy >= 95 ? 'Expert' : accuracy >= 85 ? 'Advanced' : accuracy >= 75 ? 'Intermediate' : accuracy >= 65 ? 'Learning' : 'Beginner';
                  const skillEmoji = accuracy >= 95 ? '🥇' : accuracy >= 85 ? '🥈' : accuracy >= 75 ? '🥉' : accuracy >= 65 ? '📚' : '🎯';
                  const isFavorite = mostPlayedGame && mostPlayedGame[0] === gameName;

                  return (
                    <motion.div
                      key={gameName}
                      whileHover={{ scale: 1.02 }}
                      className={`${currentTheme.glassPanel} rounded-3xl p-6 transform transition-all duration-300 hover:shadow-2xl ${isFavorite ? 'ring-2 ring-yellow-500/50' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-4xl">{skillEmoji}</div>
                          <div>
                            <div className={`text-lg font-black ${currentTheme.text} flex items-center gap-2`}>
                              {gameName}
                              {isFavorite && <span className="text-yellow-500 text-sm">⭐ Most Played</span>}
                            </div>
                            <div className={`text-sm ${currentTheme.textMuted} font-semibold`}>{skillLevel} Level</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-8">
                          <div className="text-center">
                            <div className={`text-2xl font-black ${currentTheme.text}`}>
                              {gameStats.played.toLocaleString()}
                            </div>
                            <div className={`text-xs ${currentTheme.textMuted} font-semibold`}>Hands</div>
                          </div>

                          <div className="text-center">
                            <div className={`text-2xl font-black ${accuracy >= 85 ? 'text-emerald-600' : accuracy >= 75 ? 'text-green-600' : accuracy >= 65 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {accuracy.toFixed(1)}%
                            </div>
                            <div className={`text-xs ${currentTheme.textMuted} font-semibold`}>Accuracy</div>
                          </div>

                          <div className="text-center">
                            <div className={`text-2xl font-black ${mistakes === 0 ? 'text-emerald-600' : mistakes <= 5 ? 'text-green-600' : mistakes <= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {mistakes}
                            </div>
                            <div className={`text-xs ${currentTheme.textMuted} font-semibold`}>Mistakes</div>
                          </div>

                          <div className="text-center">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-black text-white ${accuracy >= 85 ? 'bg-emerald-600' : accuracy >= 75 ? 'bg-green-600' : accuracy >= 65 ? 'bg-yellow-600' : 'bg-red-600'}`}>
                              {Math.round(accuracy)}
                            </div>
                            <div className={`text-xs ${currentTheme.textMuted} font-semibold mt-1`}>
                              Grade
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-1000 ${accuracy >= 85 ? 'bg-emerald-600' : accuracy >= 75 ? 'bg-green-600' : accuracy >= 65 ? 'bg-yellow-600' : 'bg-red-600'}`}
                            style={{ width: `${Math.min(accuracy, 100)}%` }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          )}
        </motion.div>

        <div className="mb-6">
          <h4 className={`text-xl font-bold mb-4 ${currentTheme.text}`}>⚠️ Mistake Breakdown</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {Object.entries(stats.mistakesBySeverity).map(([severity, count]) => {
              const color = severity === "Excellent" ? "text-green-600"
                : severity === "Minor mistake" ? "text-yellow-600"
                : severity === "Moderate mistake" ? "text-orange-600"
                : severity === "Major mistake" ? "text-red-600"
                : "text-red-800";

              return (
                <div key={severity} className={`${currentTheme.glassPanel} rounded-xl p-3 text-center`}>
                  <div className={`text-2xl font-bold ${color}`}>{count}</div>
                  <div className={`text-xs ${currentTheme.textMuted} font-medium`}>{severity}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-6">
          <h4 className={`text-xl font-bold mb-4 ${currentTheme.text}`}>📅 Recent Sessions</h4>
          <div className="space-y-2">
            {recentSessions.map(([date, session]) => {
              const accuracy = session.hands > 0 ? (session.correct / session.hands * 100) : 0;
              return (
                <div key={date} className={`${currentTheme.glassPanel} rounded-xl p-4 flex justify-between items-center`}>
                  <div>
                    <div className={`font-medium ${currentTheme.text}`}>{new Date(date).toLocaleDateString()}</div>
                    <div className={`text-sm ${currentTheme.textMuted}`}>{session.hands} hands</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${accuracy >= 80 ? 'text-green-600' : accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {accuracy.toFixed(1)}%
                    </div>
                    <div className={`text-sm ${currentTheme.textMuted}`}>{session.correct}/{session.hands}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t border-slate-200/30">
          <button
            onClick={onReset}
            className={`px-6 py-3 rounded-xl ${currentTheme.dangerBtn} text-white font-medium`}
          >
            🗑️ Reset Career Stats
          </button>
          <button
            onClick={onClose}
            className={`px-6 py-3 rounded-xl ${currentTheme.secondaryBtn} text-white font-medium`}
          >
            Close
          </button>
        </div>
      </div>
      </motion.div>
    </div>
  );
}
