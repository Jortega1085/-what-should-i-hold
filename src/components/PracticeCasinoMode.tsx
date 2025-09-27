import React, { useState, useEffect, startTransition } from 'react';
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
  const [cardsFlipped, setCardsFlipped] = useState<boolean[]>([false, false, false, false, false]);

  // Feedback state
  const [showWarning, setShowWarning] = useState(false);
  const [showCorrectFeedback, setShowCorrectFeedback] = useState(false);
  const [enableWarnings, setEnableWarnings] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [dealId, setDealId] = useState(0); // Track deal cycles for animation

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
      // Defer the expensive calculation with a slight delay for smoother animation
      const timeoutId = setTimeout(() => {
        try {
          const result = getOptimalHoldForGame(cards, paytable, game);
          setOptimalHold(result);
        } catch {
          setOptimalHold({ hold: [], ev: 0 });
        }
      }, 50); // Small delay to allow animations to start

      return () => clearTimeout(timeoutId);
    }
  }, [cards, paytable, game, gameState]);

  // Calculate player's EV (deferred to prevent blocking)
  const [playerEV, setPlayerEV] = useState<number>(0);

  useEffect(() => {
    if (cards.length === 5 && gameState === 'dealt') {
      // Defer the expensive calculation with a slight delay for smoother animation
      const timeoutId = setTimeout(() => {
        try {
          const result = expectedValue(cards, heldCards, paytable);
          setPlayerEV(result);
        } catch {
          setPlayerEV(0);
        }
      }, 100); // Slightly longer delay as this updates more frequently

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

    // Use startTransition to mark updates as non-urgent
    startTransition(() => {
      // Reset calculated values immediately to avoid showing stale data
      setOptimalHold({ hold: [], ev: 0 });
      setPlayerEV(0);

      // Batch state updates to reduce re-renders
      setCards(newCards);
      setFinalCards([]);
      setHeldCards([]);
      setLastHand(null);
      setWinAmount(0);
      setShowCorrectFeedback(false);
      setGameState('betting'); // Start in betting to ensure cards are face down
      setDealId(prev => prev + 1); // Increment to trigger new animations

      // Ensure cards start face down
      setCardsFlipped([false, false, false, false, false]);

      // Immediately switch to dealt and start flipping
      setGameState('dealt');
      setTimeout(() => setCardsFlipped([true, false, false, false, false]), 100);
      setTimeout(() => setCardsFlipped([true, true, false, false, false]), 200);
      setTimeout(() => setCardsFlipped([true, true, true, false, false]), 300);
      setTimeout(() => setCardsFlipped([true, true, true, true, false]), 400);
      setTimeout(() => setCardsFlipped([true, true, true, true, true]), 500);

      if (useCredits) {
        setCredits(prev => prev - bet);
      }
    });
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

    // More efficient deck building using Set for O(1) lookups
    const usedCards = new Set(cards);
    const deck: string[] = [];
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

    // Build remaining deck
    for (const s of suits) {
      for (const r of ranks) {
        const card = `${r}${s}`;
        if (!usedCards.has(card)) {
          deck.push(card);
        }
      }
    }

    // Track which cards need to be replaced (flip animation)
    const cardsToFlip: number[] = [];

    // Replace unheld cards
    for (let i = 0; i < 5; i++) {
      if (!heldCards.includes(i)) {
        const randomIndex = Math.floor(Math.random() * deck.length);
        newCards[i] = deck[randomIndex];
        deck.splice(randomIndex, 1);
        cardsToFlip.push(i);
      }
    }

    // First, flip all unheld cards to show their backs
    cardsToFlip.forEach((cardIndex) => {
      setTimeout(() => {
        setCardsFlipped(prev => {
          const newState = [...prev];
          newState[cardIndex] = false;
          return newState;
        });
      }, 100); // All flip to back at once after small delay
    });

    // Then set the new cards after backs are showing
    setTimeout(() => {
      setFinalCards(newCards);

      // Now flip each card to reveal new front one by one
      cardsToFlip.forEach((cardIndex, i) => {
        setTimeout(() => {
          setCardsFlipped(prev => {
            const newState = [...prev];
            newState[cardIndex] = true;
            return newState;
          });
        }, i * 200); // Stagger the reveal of new cards
      });
    }, 600); // Wait for all cards to show backs first

    // Defer only the expensive evaluation operations
    // Wait for all cards to finish flipping: 600ms (backs) + (cardsToFlip.length * 200ms) for reveals
    const evaluationDelay = cardsToFlip.length > 0 ? 600 + (cardsToFlip.length * 200) + 100 : 100;

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

      // Reset cards to face down after showing result for a bit
      setTimeout(() => {
        setCardsFlipped([false, false, false, false, false]);
      }, 2000);
    }, evaluationDelay); // Delay to allow flip animation to complete
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
        <div className="flex justify-center gap-4 mb-6">
          {Array(5).fill(null).map((_, i) => {
            const hasCard = cards.length > 0 && cards[i];
            const cardToShow = (gameState === 'drawing' || gameState === 'showResult') && finalCards.length > 0 && finalCards[i] ? finalCards[i] : cards[i];
            const cardRank = hasCard ? rank(cardToShow) : '';
            const cardSuit = hasCard ? suit(cardToShow) : '';
            const colorClass = hasCard ? getCardColor(cardSuit) : '';
            const isHeld = heldCards.includes(i);
            const isFlipped = cardsFlipped[i] && gameState !== 'betting';

            return (
              <div key={i} className="relative" style={{ perspective: '1000px' }}>
                <div
                  className={`relative w-20 h-28 ${gameState === 'dealt' ? 'cursor-pointer' : ''} ${
                    isHeld && gameState === 'dealt' ? '-translate-y-2' : ''
                  }`}
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(180deg)',
                    transition: 'transform 0.6s ease-in-out'
                  }}
                  onClick={() => gameState === 'dealt' && toggleHold(i)}
                >
                    {/* Card Back */}
                    <div
                      className="absolute inset-0 rounded-xl border-2 border-indigo-900 shadow-lg overflow-hidden"
                      style={{
                        transform: 'rotateY(180deg)',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden'
                      }}
                    >
                      <div className="w-full h-full rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center relative">
                        <div className="absolute inset-0 opacity-20">
                          <div className="grid grid-cols-3 gap-1 h-full w-full p-2">
                            {[...Array(12)].map((_, idx) => (
                              <div key={idx} className="text-white/40 text-xs flex items-center justify-center">
                                {['♠', '♥', '♦', '♣'][idx % 4]}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="relative">
                          <div className="text-white/50 text-4xl font-bold">♠</div>
                        </div>
                        <div className="absolute inset-0 card-back-shimmer" />
                      </div>
                    </div>

                    {/* Card Front */}
                    <div
                      className={`absolute inset-0 rounded-xl border-2 ${currentTheme.cardBg} ${currentTheme.shadow} ${
                        isHeld ? 'border-green-500 bg-green-50 ring-2 ring-green-300' : 'border-gray-300'
                      } ${gameState === 'dealt' && !isHeld ? 'hover:border-blue-400' : ''}`}
                      style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(0deg)'
                      }}
                    >
                      {hasCard && (
                        <div className={`flex flex-col items-center justify-center h-full ${colorClass}`}>
                          <div className="text-2xl font-bold">{cardRank}</div>
                          <div className="text-3xl">{cardSuit}</div>
                        </div>
                      )}
                    </div>

                    {/* Hold Badge */}
                    <AnimatePresence>
                      {isHeld && gameState === 'dealt' && (
                        <motion.div
                          initial={{ scale: 0, y: 10 }}
                          animate={{ scale: 1, y: 0 }}
                          exit={{ scale: 0, y: 10 }}
                          className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg z-10"
                        >
                          HOLD
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
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
              className={`px-8 py-3 rounded-xl text-white font-bold transition-all duration-300 hover:scale-105 ${currentTheme.primaryBtn} ${currentTheme.shadow}`}
            >
              🎲 Draw Cards
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