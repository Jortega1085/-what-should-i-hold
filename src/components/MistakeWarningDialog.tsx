import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MistakeWarningDialogProps {
  isOpen: boolean;
  playerHold: number[];
  optimalHold: number[];
  playerEV: number;
  optimalEV: number;
  cards: string[];
  onChangeDecision: () => void;
  onProceedAnyway: () => void;
  theme: Record<string, string>;
}

export function MistakeWarningDialog({
  isOpen,
  playerHold,
  optimalHold,
  playerEV,
  optimalEV,
  cards,
  onChangeDecision,
  onProceedAnyway,
  theme
}: MistakeWarningDialogProps) {
  const formatCards = (holdIndices: number[]) => {
    if (holdIndices.length === 0) return "Discard All";
    if (holdIndices.length === 5) return "Hold All";
    return holdIndices.map(i => cards[i]).join(', ');
  };

  const evDifference = optimalEV - playerEV;
  const percentageLoss = optimalEV > 0 ? ((evDifference / optimalEV) * 100).toFixed(1) : '0';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={onChangeDecision}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
          >
            <div className={`${theme.glassPanel} rounded-2xl ${theme.shadow} p-3 sm:p-4 max-w-sm w-full max-h-[80vh] overflow-y-auto`}>
              {/* Warning Header */}
              <div className="text-center mb-3">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl">⚠️</span>
                  <h2 className={`text-base font-bold ${theme.text}`}>
                    Suboptimal Play Detected
                  </h2>
                </div>
                <p className={`text-xs ${theme.textMuted}`}>
                  Your decision is not mathematically optimal
                </p>
              </div>

              {/* Comparison Section */}
              <div className="space-y-1.5 mb-3">
                {/* Your Play */}
                <div className={`p-2 rounded bg-red-500/10 border border-red-500/30`}>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-red-500 font-semibold">Your Play:</span>
                    <span className={`font-mono ${theme.text}`}>{formatCards(playerHold)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mt-0.5">
                    <span className="text-red-400">EV:</span>
                    <span className="font-mono text-red-400">{playerEV.toFixed(3)}</span>
                  </div>
                </div>

                {/* Optimal Play */}
                <div className={`p-2 rounded bg-green-500/10 border border-green-500/30`}>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-green-500 font-semibold">Optimal:</span>
                    <span className={`font-mono ${theme.text}`}>{formatCards(optimalHold)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mt-0.5">
                    <span className="text-green-400">EV:</span>
                    <span className="font-mono text-green-400">{optimalEV.toFixed(3)}</span>
                  </div>
                </div>

                {/* EV Loss */}
                <div className={`p-1.5 rounded bg-yellow-500/10 border border-yellow-500/30 text-center`}>
                  <span className="text-yellow-500 text-xs font-semibold">
                    Loss: {evDifference.toFixed(3)} ({percentageLoss}% worse)
                  </span>
                </div>
              </div>

              {/* Card Display */}
              <div className="flex justify-center gap-1 sm:gap-2 mb-4">
                {cards.map((card, index) => {
                  const isOptimalHold = optimalHold.includes(index);
                  const isPlayerHold = playerHold.includes(index);

                  let borderColor = 'border-gray-400';
                  let bgColor = 'bg-white';

                  if (isOptimalHold && !isPlayerHold) {
                    borderColor = 'border-green-500 border-2';
                    bgColor = 'bg-green-50';
                  } else if (!isOptimalHold && isPlayerHold) {
                    borderColor = 'border-red-500 border-2';
                    bgColor = 'bg-red-50';
                  } else if (isOptimalHold && isPlayerHold) {
                    borderColor = 'border-gray-400';
                  }

                  return (
                    <div
                      key={index}
                      className={`relative w-10 h-14 sm:w-12 sm:h-16 rounded ${borderColor} ${bgColor} flex items-center justify-center`}
                    >
                      <span className="text-xs sm:text-sm font-bold">{card}</span>
                      {isOptimalHold && !isPlayerHold && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-[8px]">✓</span>
                        </div>
                      )}
                      {!isOptimalHold && isPlayerHold && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-[8px]">✗</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 sm:gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onChangeDecision}
                  className={`flex-1 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold text-white transition-all duration-300 ${theme.successBtn} ${theme.shadow}`}
                >
                  🔄 Change
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onProceedAnyway}
                  className={`flex-1 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold text-white transition-all duration-300 ${theme.dangerBtn} ${theme.shadow}`}
                >
                  ➡️ Proceed
                </motion.button>
              </div>

              {/* Educational Note */}
              <p className={`text-[10px] sm:text-xs text-center mt-3 ${theme.textMuted}`}>
                Tip: Optimal play maximizes long-term returns
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}