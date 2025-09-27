import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { evaluateHand, getRandomHand, getOptimalHoldForGame, expectedValue, rank, suit } from '../logic/solver';
import { PAYTABLES } from '../data/paytables';
import { MistakeWarningDialog } from './MistakeWarningDialog';
import { HandAnalysisSidebar } from './HandAnalysisSidebar';
import './PracticeCasinoMode.css';

interface PracticeCasinoModeProps {
  game: string;
  currentTheme: Record<string, string>;
  getCardColor: (suit: string) => string;
  getAllStrategyOptions: (cards: string[], paytable: Record<string, number>) => any[];
  getStrategyExplanation: (cards: string[], best: any, game: string) => string;
}

interface PracticeCasinoStats {
  handsPlayed: number;
  correctDecisions: number;
  mistakesCorrected: number;
  mistakesIgnored: number;
  creditsWon: number;
  creditsLost: number;
}

type GameState = 'betting' | 'dealt' | 'holding' | 'drawing' | 'showResult';

export function PracticeCasinoMode({
  game,
  currentTheme,
  getCardColor,
  getAllStrategyOptions,
  getStrategyExplanation
}: PracticeCasinoModeProps) {
  // Game state
  const [gameState, setGameState] = useState<GameState>('betting');
  const [cards, setCards] = useState<string[]>([]);
  const [finalCards, setFinalCards] = useState<string[]>([]);
  const [heldCards, setHeldCards] = useState<number[]>([]);
  const [credits, setCredits] = useState(1000);
  const [bet, setBet] = useState(5);
  const [useCredits, setUseCredits] = useState(true);

  // Feedback state
  const [showWarning, setShowWarning] = useState(false);
  const [showCorrectFeedback, setShowCorrectFeedback] = useState(false);
  const [enableWarnings, setEnableWarnings] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Results state
  const [lastHand, setLastHand] = useState<{name: string, payout: number} | null>(null);
  const [winAmount, setWinAmount] = useState(0);

  // Statistics
  const [stats, setStats] = useState<PracticeCasinoStats>(() => {
    const saved = localStorage.getItem('practiceCasinoStats');
    if (saved) return JSON.parse(saved);
    return {
      handsPlayed: 0,
      correctDecisions: 0,
      mistakesCorrected: 0,
      mistakesIgnored: 0,
      creditsWon: 0,
      creditsLost: 0
    };
  });

  const paytable = PAYTABLES[game];

  // Calculate optimal hold for current cards (deferred to prevent blocking)
  const [optimalHold, setOptimalHold] = useState<{ hold: number[], ev: number }>({ hold: [], ev: 0 });

  useEffect(() => {
    if (cards.length === 5 && gameState === 'dealt') {
      // Defer the expensive calculation
      const timeoutId = setTimeout(() => {
        try {
          const result = getOptimalHoldForGame(cards, paytable, game);
          setOptimalHold(result);
        } catch {
          setOptimalHold({ hold: [], ev: 0 });
        }
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [cards, paytable, game, gameState]);

  // Calculate player's EV (deferred to prevent blocking)
  const [playerEV, setPlayerEV] = useState<number>(0);

  useEffect(() => {
    if (cards.length === 5 && gameState === 'dealt') {
      // Defer the expensive calculation
      const timeoutId = setTimeout(() => {
        try {
          const result = expectedValue(cards, heldCards, paytable);
          setPlayerEV(result);
        } catch {
          setPlayerEV(0);
        }
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [cards, heldCards, paytable, gameState]);

  // Save stats whenever they change
  useEffect(() => {
    localStorage.setItem('practiceCasinoStats', JSON.stringify(stats));
  }, [stats]);

  const toggleHold = (index: number) => {
    if (gameState !== 'dealt') return;
    setHeldCards(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const dealCards = () => {
    if (useCredits && credits < bet) return;

    const newCards = getRandomHand();
    setCards(newCards);
    setFinalCards([]);
    setHeldCards([]);
    setLastHand(null);
    setWinAmount(0);
    setShowCorrectFeedback(false);
    setGameState('dealt');

    if (useCredits) {
      setCredits(prev => prev - bet);
    }
  };

  const checkDecision = () => {
    const playerSorted = [...heldCards].sort();
    const optimalSorted = [...optimalHold.hold].sort();
    const isCorrect = playerSorted.length === optimalSorted.length &&
                     playerSorted.every((val, idx) => val === optimalSorted[idx]);

    if (isCorrect) {
      setShowCorrectFeedback(true);
      setStats(prev => ({
        ...prev,
        correctDecisions: prev.correctDecisions + 1
      }));
      // Proceed to draw after showing feedback
      setTimeout(() => {
        setShowCorrectFeedback(false);
        drawCards();
      }, 1000);
    } else if (enableWarnings) {
      setShowWarning(true);
    } else {
      // Warnings disabled, just proceed
      drawCards();
    }

    return isCorrect;
  };

  const drawCards = () => {
    setGameState('drawing');

    // Build the new deck and cards synchronously for animation
    const newCards = [...cards];
    const deck: string[] = [];
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

    // Build remaining deck
    for (const s of suits) {
      for (const r of ranks) {
        const card = `${r}${s}`;
        if (!cards.includes(card)) {
          deck.push(card);
        }
      }
    }

    // Replace unheld cards
    for (let i = 0; i < 5; i++) {
      if (!heldCards.includes(i)) {
        const randomIndex = Math.floor(Math.random() * deck.length);
        newCards[i] = deck[randomIndex];
        deck.splice(randomIndex, 1);
      }
    }

    setFinalCards(newCards);

    // Defer only the expensive evaluation operations
    setTimeout(() => {
      // Evaluate final hand
      const result = evaluateHand(newCards, paytable);
      setLastHand({ name: result.name, payout: result.payout });

      const payout = result.payout * bet;
      setWinAmount(payout);

      if (useCredits && payout > 0) {
        setCredits(prev => prev + payout);
      }

      // Update stats
      setStats(prev => ({
        ...prev,
        handsPlayed: prev.handsPlayed + 1,
        creditsWon: prev.creditsWon + (payout > bet ? payout - bet : 0),
        creditsLost: prev.creditsLost + (payout < bet ? bet - payout : 0)
      }));

      setGameState('showResult');
    }, 600); // Delay to allow flip animation to complete
  };

  const handleChangeDecision = () => {
    setShowWarning(false);
    setStats(prev => ({
      ...prev,
      mistakesCorrected: prev.mistakesCorrected + 1
    }));
  };

  const handleProceedAnyway = () => {
    setShowWarning(false);
    setStats(prev => ({
      ...prev,
      mistakesIgnored: prev.mistakesIgnored + 1
    }));
    drawCards();
  };

  const resetStats = () => {
    const newStats = {
      handsPlayed: 0,
      correctDecisions: 0,
      mistakesCorrected: 0,
      mistakesIgnored: 0,
      creditsWon: 0,
      creditsLost: 0
    };
    setStats(newStats);
    localStorage.setItem('practiceCasinoStats', JSON.stringify(newStats));
  };

  const accuracy = stats.handsPlayed > 0
    ? ((stats.correctDecisions / stats.handsPlayed) * 100).toFixed(1)
    : '0.0';

  const netCredits = stats.creditsWon - stats.creditsLost;

  return (
    <div className="relative">
      {/* Header Controls */}
      <div className={`${currentTheme.glassPanel} rounded-2xl p-6 mb-6 ${currentTheme.shadow}`}>
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div>
            <h2 className={`text-2xl font-bold ${currentTheme.text}`}>🎰📚 Practice Casino Mode</h2>
            <p className={`text-sm ${currentTheme.textMuted}`}>Play with feedback and warnings</p>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useCredits}
                onChange={(e) => setUseCredits(e.target.checked)}
                className="rounded"
              />
              <span className={`text-sm ${currentTheme.text}`}>Use Credits</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={enableWarnings}
                onChange={(e) => setEnableWarnings(e.target.checked)}
                className="rounded"
              />
              <span className={`text-sm ${currentTheme.text}`}>Mistake Warnings</span>
            </label>

            <button
              onClick={() => setShowAnalysis(!showAnalysis)}
              className={`px-4 py-2 rounded-lg ${currentTheme.secondaryBtn} text-white font-semibold`}
            >
              {showAnalysis ? 'Hide' : 'Show'} Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Panel */}
      <div className={`${currentTheme.glassPanel} rounded-2xl p-6 mb-6 ${currentTheme.shadow}`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className={`text-sm ${currentTheme.textMuted}`}>Accuracy</div>
            <div className={`text-2xl font-bold ${
              parseFloat(accuracy) >= 80 ? 'text-green-600' :
              parseFloat(accuracy) >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {accuracy}%
            </div>
          </div>

          <div>
            <div className={`text-sm ${currentTheme.textMuted}`}>Hands Played</div>
            <div className={`text-2xl font-bold ${currentTheme.text}`}>{stats.handsPlayed}</div>
          </div>

          <div>
            <div className={`text-sm ${currentTheme.textMuted}`}>Net Credits</div>
            <div className={`text-2xl font-bold ${netCredits >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netCredits >= 0 ? '+' : ''}{netCredits}
            </div>
          </div>

          <div>
            <div className={`text-sm ${currentTheme.textMuted}`}>Mistakes Fixed</div>
            <div className={`text-2xl font-bold ${currentTheme.text}`}>
              {stats.mistakesCorrected}/{stats.mistakesCorrected + stats.mistakesIgnored}
            </div>
          </div>
        </div>

        <button
          onClick={resetStats}
          className={`mt-4 px-4 py-2 rounded-lg ${currentTheme.dangerBtn} text-white text-sm font-semibold`}
        >
          Reset Stats
        </button>
      </div>

      {/* Game Area */}
      <div className={`${currentTheme.glassPanel} rounded-2xl p-8 ${currentTheme.shadow}`}>
        {/* Credits and Bet Display */}
        {useCredits && (
          <div className="flex justify-between mb-6">
            <div className={`text-lg ${currentTheme.text}`}>
              Credits: <span className="font-bold">{credits}</span>
            </div>
            <div className={`text-lg ${currentTheme.text}`}>
              Bet: <span className="font-bold">{bet}</span>
            </div>
          </div>
        )}

        {/* Cards Display */}
        <div className="flex justify-center gap-4 mb-6" style={{ perspective: '1000px' }}>
          {gameState === 'betting' ? (
            // Show placeholder cards
            Array(5).fill(null).map((_, i) => (
              <div key={i} className={`w-20 h-28 rounded-xl border-2 border-dashed ${currentTheme.border} opacity-30`} />
            ))
          ) : (
            // Show actual cards
            ((gameState === 'drawing' || gameState === 'showResult') && finalCards.length > 0 ? finalCards : cards).map((card, i) => {
              const cardRank = rank(card);
              const cardSuit = suit(card);
              const colorClass = getCardColor(cardSuit);
              const isHeld = heldCards.includes(i);
              const shouldFlip = gameState === 'drawing' && !isHeld && finalCards.length > 0 && finalCards[i] !== cards[i];
              const isNewCard = (gameState === 'drawing' || gameState === 'showResult') && !isHeld && finalCards.length > 0 && finalCards[i] !== cards[i];

              return (
                <motion.div
                  key={`card-${i}-${card}`}
                  initial={
                    gameState === 'dealt'
                      ? { y: -300, rotateY: 180, scale: 0.5, opacity: 0 }
                      : shouldFlip || isNewCard
                        ? { rotateY: 180, scale: 0.9 }
                        : { rotateY: 0 }
                  }
                  animate={{
                    y: 0,
                    rotateY: 0,
                    scale: 1,
                    opacity: 1,
                    translateY: isHeld && gameState === 'dealt' ? -8 : 0
                  }}
                  transition={{
                    y: {
                      type: "spring",
                      stiffness: 100,
                      damping: 15,
                      delay: gameState === 'dealt' ? i * 0.1 : 0
                    },
                    rotateY: {
                      duration: 0.6,
                      delay: gameState === 'dealt' ? i * 0.1 + 0.3 : !isHeld ? i * 0.15 : 0,
                      ease: "easeInOut"
                    },
                    scale: {
                      duration: 0.4,
                      delay: gameState === 'dealt' ? i * 0.1 : !isHeld ? i * 0.15 : 0
                    },
                    opacity: {
                      duration: 0.3,
                      delay: gameState === 'dealt' ? i * 0.1 : 0
                    },
                    translateY: {
                      duration: 0.2
                    }
                  }}
                  whileHover={gameState === 'dealt' ? { scale: 1.05, translateY: -12 } : {}}
                  className="relative"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <button
                    onClick={() => toggleHold(i)}
                    disabled={gameState !== 'dealt'}
                    className="relative w-20 h-28 rounded-xl"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* Card Back */}
                    <div
                      className={`absolute inset-0 rounded-xl border-2 border-indigo-900 ${currentTheme.shadow} backface-hidden overflow-hidden`}
                      style={{
                        transform: 'rotateY(180deg)',
                        backfaceVisibility: 'hidden'
                      }}
                    >
                      <div className="w-full h-full rounded-xl bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 flex items-center justify-center relative">
                        {/* Pattern overlay */}
                        <div className="absolute inset-0 opacity-10">
                          <div className="grid grid-cols-3 gap-1 h-full w-full p-2">
                            {[...Array(12)].map((_, idx) => (
                              <div key={idx} className="text-white/30 text-xs flex items-center justify-center">
                                {['♠', '♥', '♦', '♣'][idx % 4]}
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Center design */}
                        <div className="relative">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="text-white/30 text-6xl font-bold"
                          >
                            ♠
                          </motion.div>
                        </div>
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 card-back-shimmer" />
                      </div>
                    </div>

                    {/* Card Front */}
                    <div
                      className={`absolute inset-0 rounded-xl border-2 ${currentTheme.cardBg} ${currentTheme.shadow} ${
                        isHeld ? 'border-green-500 bg-green-50 ring-2 ring-green-300' : 'border-gray-300'
                      } ${gameState === 'dealt' && !isHeld ? 'hover:border-blue-400' : ''}`}
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <div className={`flex flex-col items-center justify-center h-full ${colorClass}`}>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: !isHeld && (shouldFlip || isNewCard) ? 0.3 + i * 0.15 : 0, duration: 0.3 }}
                        >
                          <div className="text-2xl font-bold">{cardRank}</div>
                          <div className="text-3xl">{cardSuit}</div>
                        </motion.div>
                      </div>
                    </div>

                    {/* Hold Badge */}
                    <AnimatePresence>
                      {isHeld && (
                        <motion.div
                          initial={{ scale: 0, y: 10 }}
                          animate={{ scale: 1, y: 0 }}
                          exit={{ scale: 0, y: 10 }}
                          className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg"
                        >
                          HOLD
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Feedback Messages */}
        <AnimatePresence>
          {showCorrectFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="text-center mb-4"
            >
              <span className="text-3xl font-bold text-green-600">Correct! ✓</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result Display */}
        {gameState === 'showResult' && lastHand && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-6"
          >
            <div className={`text-2xl font-bold ${lastHand.payout > 0 ? 'text-green-600' : currentTheme.text}`}>
              {lastHand.name}
            </div>
            {lastHand.payout > 0 && (
              <div className="text-xl text-green-600 mt-2">
                Win: {winAmount} credits!
              </div>
            )}
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          {gameState === 'betting' || gameState === 'showResult' ? (
            <button
              onClick={dealCards}
              disabled={useCredits && credits < bet}
              className={`px-8 py-3 rounded-xl text-white font-bold transition-all duration-300 hover:scale-105 ${
                (!useCredits || credits >= bet) ? currentTheme.primaryBtn : 'bg-gray-400 cursor-not-allowed'
              } ${currentTheme.shadow}`}
            >
              🎲 Deal Cards
            </button>
          ) : gameState === 'dealt' ? (
            <button
              onClick={checkDecision}
              className={`px-8 py-3 rounded-xl text-white font-bold transition-all duration-300 hover:scale-105 ${currentTheme.successBtn} ${currentTheme.shadow}`}
            >
              ✅ Draw Cards
            </button>
          ) : null}
        </div>

        {/* Bet Controls */}
        {useCredits && (gameState === 'betting' || gameState === 'showResult') && (
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={() => setBet(Math.max(1, bet - 1))}
              className={`px-4 py-2 rounded-lg ${currentTheme.secondaryBtn} text-white font-semibold`}
            >
              Bet -
            </button>
            <button
              onClick={() => setBet(1)}
              className={`px-4 py-2 rounded-lg ${bet === 1 ? currentTheme.primaryBtn : currentTheme.secondaryBtn} text-white font-semibold`}
            >
              Bet 1
            </button>
            <button
              onClick={() => setBet(5)}
              className={`px-4 py-2 rounded-lg ${bet === 5 ? currentTheme.primaryBtn : currentTheme.secondaryBtn} text-white font-semibold`}
            >
              Max Bet
            </button>
            <button
              onClick={() => setBet(Math.min(5, bet + 1))}
              className={`px-4 py-2 rounded-lg ${currentTheme.secondaryBtn} text-white font-semibold`}
            >
              Bet +
            </button>
          </div>
        )}
      </div>

      {/* Mistake Warning Dialog */}
      <MistakeWarningDialog
        isOpen={showWarning}
        playerHold={heldCards}
        optimalHold={optimalHold.hold}
        playerEV={playerEV}
        optimalEV={optimalHold.ev}
        cards={cards}
        onChangeDecision={handleChangeDecision}
        onProceedAnyway={handleProceedAnyway}
        theme={currentTheme}
      />

      {/* Hand Analysis Sidebar */}
      {showAnalysis && cards.length === 5 && (
        <HandAnalysisSidebar
          cards={cards}
          paytable={paytable}
          best={optimalHold}
          game={game}
          currentTheme={currentTheme}
          showHandAnalysis={showAnalysis}
          setShowHandAnalysis={setShowAnalysis}
          getAllStrategyOptions={getAllStrategyOptions}
          getStrategyExplanation={getStrategyExplanation}
        />
      )}
    </div>
  );
}