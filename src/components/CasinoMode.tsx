import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PAYTABLES } from '../data/paytables';
import { evaluateHand, getRandomHand } from '../logic/solver';
import { HandDisplay } from './HandDisplay';
import { PaytableDisplay, PaytableEntry } from './PaytableDisplay';
import { getTheme, ThemeName } from '../config/themes';

interface CasinoModeProps {
  isOpen: boolean;
  onClose: () => void;
  game: string;
}

const denominations = [
  { value: 0.01, label: '1¢' },
  { value: 0.05, label: '5¢' },
  { value: 0.25, label: '25¢' },
  { value: 1.0, label: '$1' },
  { value: 5.0, label: '$5' },
];

const themeOptions: ThemeName[] = ['casino', 'dark'];
const confettiPieceCount = 26;

function buildPaytableEntries(_game: string, paytable: any): PaytableEntry[] {
  const basePayouts: PaytableEntry[] = [
    { hand: 'Royal Flush', payout: paytable.ROYAL },
    { hand: 'Straight Flush', payout: paytable.STRAIGHT_FLUSH },
    { hand: '4 Aces + 2-4', payout: paytable.FOUR_ACES_234 || 0 },
    { hand: '4 2-4 with A-4', payout: paytable.FOUR_2_3_4_A234 || 0 },
    { hand: '4 Aces', payout: paytable.FOUR_ACES || paytable.FOUR_KIND },
    { hand: '4 2s-4s', payout: paytable.FOUR_2_3_4 || paytable.FOUR_KIND },
    { hand: '4 5s-Ks', payout: paytable.FOUR_5_K || paytable.FOUR_KIND },
    { hand: 'Full House', payout: paytable.FULL_HOUSE },
    { hand: 'Flush', payout: paytable.FLUSH },
    { hand: 'Straight', payout: paytable.STRAIGHT },
    { hand: '3 of a Kind', payout: paytable.THREE_KIND },
    { hand: 'Two Pair', payout: paytable.TWO_PAIR },
    { hand: 'Jacks or Better', payout: paytable.JacksOrBetter || paytable.JACKS_OR_BETTER || 1 },
  ];

  return basePayouts.filter(entry => entry.payout > 0);
}

export function CasinoMode({ isOpen, onClose, game }: CasinoModeProps): React.ReactElement | null {
  const [credits, setCredits] = useState(100.0);
  const [denomination, setDenomination] = useState(0.25);
  const [bet, setBet] = useState(5);
  const [cards, setCards] = useState<string[]>(Array(5).fill(''));
  const [heldCards, setHeldCards] = useState<number[]>([]);
  const [gameState, setGameState] = useState<'betting' | 'firstDraw' | 'showResult'>('betting');
  const [winAmount, setWinAmount] = useState(0);
  const [lastWin, setLastWin] = useState<{ name: string; payout: number; total: number } | null>(null);
  const [totalWon, setTotalWon] = useState(0);
  const [displayedWin, setDisplayedWin] = useState(0);
  const [isPaying, setIsPaying] = useState(false);
  const [highlightedPayline, setHighlightedPayline] = useState<string | null>(null);
  const [themeName, setThemeName] = useState<ThemeName>('casino');
  const [celebrationKey, setCelebrationKey] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);

  const paytable = PAYTABLES[game];
  const paytableEntries = useMemo(() => buildPaytableEntries(game, paytable), [game, paytable]);
  const theme = useMemo(() => getTheme(themeName), [themeName]);

  const ensureAudioContext = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (audioContextRef.current) return audioContextRef.current;

    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    audioContextRef.current = new AudioCtx();
    return audioContextRef.current;
  }, []);

  const playWinCue = useCallback(() => {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    // Placeholder: hook up celebratory sample or oscillator sweep here.
  }, [ensureAudioContext]);

  const playLossCue = useCallback(() => {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    // Placeholder: hook up subtle loss stinger here.
  }, [ensureAudioContext]);

  useEffect(() => {
    if (gameState === 'betting') {
      setHeldCards([]);
    }
  }, [gameState]);

  useEffect(() => {
    if (isPaying && winAmount > displayedWin) {
      const timer = window.setTimeout(() => {
        const increment = Math.min(denomination, winAmount - displayedWin);
        setDisplayedWin(prev => prev + increment);
      }, 45);
      return () => window.clearTimeout(timer);
    }

    if (isPaying && displayedWin >= winAmount) {
      setIsPaying(false);
    }
  }, [denomination, displayedWin, isPaying, winAmount]);

  useEffect(() => {
    if (!lastWin || gameState !== 'showResult') return;

    if (lastWin.payout > 0) {
      setCelebrationKey(prev => prev + 1);
      playWinCue();
    } else {
      playLossCue();
    }
  }, [gameState, lastWin, playLossCue, playWinCue]);

  const toggleHold = (index: number) => {
    if (gameState !== 'firstDraw') return;
    setHeldCards(prev => (prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]));
  };

  const dealCards = () => {
    const betAmount = bet * denomination;
    if (credits < betAmount) return;

    void ensureAudioContext()?.resume().catch(() => undefined);

    setLastWin(null);
    setHighlightedPayline(null);
    setWinAmount(0);
    setDisplayedWin(0);
    setIsPaying(false);

    setCredits(prev => prev - betAmount);
    setGameState('firstDraw');
    setCards(getRandomHand());
    setHeldCards([]);
  };

  const drawCards = () => {
    if (gameState !== 'firstDraw') return;

    void ensureAudioContext()?.resume().catch(() => undefined);

    const newCards = [...cards];
    const deck: string[] = [];
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

    for (const s of suits) {
      for (const r of ranks) {
        const card = `${r}${s}`;
        if (!cards.includes(card)) {
          deck.push(card);
        }
      }
    }

    for (let i = 0; i < 5; i += 1) {
      if (!heldCards.includes(i)) {
        const randomIndex = Math.floor(Math.random() * deck.length);
        newCards[i] = deck[randomIndex];
        deck.splice(randomIndex, 1);
      }
    }

    setCards(newCards);

    const result = evaluateHand(newCards, paytable);

    if (result.payout > 0) {
      const totalWin = result.payout * bet * denomination;
      setWinAmount(totalWin);
      setLastWin({ name: result.name, payout: result.payout, total: totalWin });
      setHighlightedPayline(result.name);
      setIsPaying(true);

      window.setTimeout(() => {
        setCredits(prev => prev + totalWin);
        setTotalWon(prev => prev + totalWin);
      }, 120);
    } else {
      setLastWin({ name: 'No Win', payout: 0, total: 0 });
      setHighlightedPayline(null);
    }

    setGameState('showResult');
  };

  const addCredits = () => {
    setCredits(prev => prev + 100);
  };

  const handleBetChange = (newBet: number) => {
    if (gameState !== 'betting') return;
    setBet(Math.max(1, Math.min(5, newBet)));
  };

  const handleDenominationChange = (newDenom: number) => {
    if (gameState !== 'betting') return;
    setDenomination(newDenom);
  };

  const currentBetAmount = bet * denomination;
  const canDeal = (gameState === 'betting' || gameState === 'showResult') && credits >= currentBetAmount;
  const canDraw = gameState === 'firstDraw';
  const isHoldingPhase = gameState === 'firstDraw';

  const confettiPattern = useMemo(
    () =>
      Array.from({ length: confettiPieceCount }).map((_, idx) => ({
        left: Math.random() * 100,
        delay: idx * 0.03,
        duration: 1.4 + Math.random() * 0.8,
        rotate: Math.random() * 360,
        size: 6 + Math.random() * 8,
      })),
    [celebrationKey]
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="casino-mode"
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 px-3 py-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 290, damping: 28 }}
          className={`relative flex h-full w-full max-h-[95vh] max-w-5xl flex-col overflow-hidden rounded-[2.5rem] border ${theme.border} ${theme.shadow}`}
        >
          <div className={`absolute inset-0 ${theme.bg}`} />
          <div className={`absolute inset-0 ${theme.feltOverlay}`} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,rgba(250,204,21,0.25),transparent_55%)]" />

          <div className="relative z-10 flex h-full flex-col overflow-hidden">
            <header className="flex flex-col gap-4 border-b border-white/10 px-6 pt-6 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.45em] text-amber-200/80">Video Poker</p>
                <h2 className="text-3xl font-semibold text-white drop-shadow-[0_4px_14px_rgba(15,23,42,0.65)]">
                  {game}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {themeOptions.map(option => (
                  <motion.button
                    key={option}
                    type="button"
                    onClick={() => setThemeName(option)}
                    whileTap={{ scale: 0.94 }}
                    className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] backdrop-blur transition ${
                      themeName === option
                        ? `bg-gradient-to-r ${theme.accent} text-slate-950 ${theme.accentBorder}`
                        : 'bg-white/10 text-amber-100/70 hover:bg-white/20'
                    }`}
                  >
                    {option === 'casino' ? 'Neon' : 'Midnight'}
                  </motion.button>
                ))}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="rounded-full bg-white/10 p-3 text-lg text-amber-100 transition hover:bg-white/20"
                  aria-label="Close casino mode"
                >
                  ✕
                </motion.button>
              </div>
            </header>

            <main className="relative flex-1 overflow-y-auto px-6 pb-7 pt-6 sm:px-8">
              <div className="flex flex-col gap-6 lg:flex-row">
                <div className="lg:w-[38%]">
                  <PaytableDisplay
                    entries={paytableEntries}
                    bet={bet}
                    highlightedHand={highlightedPayline}
                    theme={theme}
                  />
                </div>

                <div className="flex flex-1 flex-col gap-6">
                  <motion.div
                    className="relative rounded-3xl border border-white/10 bg-black/15 px-5 pb-4 pt-6 shadow-[inset_0_0_25px_rgba(15,23,42,0.65)]"
                  >
                    <HandDisplay
                      cards={cards}
                      heldCards={heldCards}
                      onToggleHold={toggleHold}
                      theme={theme}
                      disabled={!isHoldingPhase}
                      showCardNumbers={false}
                    />
                    {!(gameState === 'firstDraw') && (
                      <motion.button
                        type="button"
                        onClick={() => {
                          if (canDeal) dealCards();
                        }}
                        whileTap={{ scale: canDeal ? 0.97 : 1 }}
                        className={`absolute inset-0 flex items-center justify-center rounded-3xl border border-dashed border-amber-200/10 text-xs uppercase tracking-[0.5em] text-amber-200/40 transition ${
                          canDeal ? 'hover:border-amber-200/40 hover:text-amber-200/70' : ''
                        }`}
                      >
                        Tap to Deal
                      </motion.button>
                    )}
                  </motion.div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <motion.div
                      className={`relative overflow-hidden rounded-2xl border ${theme.border} ${theme.panel}`}
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.15),_transparent_70%)]" />
                      <div className="relative z-10 px-5 py-4">
                        <p className="text-xs uppercase tracking-[0.45em] text-amber-200/80">Credits</p>
                        <p className="mt-2 text-3xl font-semibold text-white tabular-nums">
                          ${credits.toFixed(2)}
                        </p>
                        <p className="mt-3 text-[0.72rem] uppercase tracking-[0.3em] text-amber-100/60">
                          Total Won: ${totalWon.toFixed(2)}
                        </p>
                      </div>
                    </motion.div>

                    <motion.div
                      className={`relative overflow-hidden rounded-2xl border ${theme.border} ${theme.panel}`}
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),_transparent_70%)]" />
                      <div className="relative z-10 px-5 py-4">
                        <p className="text-xs uppercase tracking-[0.45em] text-amber-200/80">Current Bet</p>
                        <p className="mt-2 text-3xl font-semibold text-white tabular-nums">
                          {bet} × {denomination.toFixed(2)} = ${currentBetAmount.toFixed(2)}
                        </p>
                        {isPaying && (
                          <motion.p
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            className="mt-3 text-sm font-semibold text-amber-200"
                          >
                            +${displayedWin.toFixed(2)}
                          </motion.p>
                        )}
                      </div>
                    </motion.div>
                  </div>

                  <div className="relative min-h-[90px] overflow-hidden rounded-2xl border border-white/10 bg-black/20 px-6 py-4">
                    <AnimatePresence mode="wait">
                      {lastWin && gameState === 'showResult' ? (
                        <motion.div
                          key={lastWin.name}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -12 }}
                          transition={{ duration: 0.35 }}
                          className="text-center"
                        >
                          {lastWin.payout > 0 ? (
                            <div>
                              <p className="text-xs uppercase tracking-[0.5em] text-amber-200/70">Winner</p>
                              <p className="mt-1 text-2xl font-semibold text-amber-200 drop-shadow-[0_0_20px_rgba(250,204,21,0.75)]">
                                {lastWin.name}
                              </p>
                              <p className="mt-1 text-sm font-semibold text-white">
                                Pays {lastWin.payout} · Total ${lastWin.total.toFixed(2)}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-xs uppercase tracking-[0.4em] text-red-300/80">Better Luck</p>
                              <p className="mt-1 text-xl font-semibold text-red-300 drop-shadow-[0_0_16px_rgba(248,113,113,0.45)]">
                                No Win
                              </p>
                              <p className="mt-1 text-sm font-semibold text-white/70">
                                Lost ${currentBetAmount.toFixed(2)}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      ) : (
                        <motion.div
                          key="awaiting"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-center text-sm uppercase tracking-[0.4em] text-amber-200/50"
                        >
                          Place Your Bet
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {lastWin && lastWin.payout > 0 && (
                        <motion.div
                          key={`confetti-${celebrationKey}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="pointer-events-none absolute inset-0 overflow-hidden"
                        >
                          {confettiPattern.map(({ left, delay, duration, rotate, size }, idx) => (
                            <motion.span
                              key={`${celebrationKey}-${idx}`}
                              className="absolute top-[-10%] block rounded-full"
                              style={{
                                left: `${left}%`,
                                width: `${size}px`,
                                height: `${size * 3}px`,
                                background: 'linear-gradient(180deg, rgba(250,204,21,0.9), rgba(59,130,246,0.8))',
                              }}
                              initial={{ y: '-10%', opacity: 0, rotate: 0 }}
                              animate={{ y: '120%', opacity: [0, 1, 1, 0], rotate }}
                              transition={{ duration, delay, ease: 'easeOut' }}
                            />
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </main>

            <footer className="border-t border-white/10 bg-black/30 px-5 py-4 sm:px-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                  {denominations.map(denom => {
                    const isActive = denomination === denom.value;
                    return (
                      <motion.button
                        key={denom.value}
                        type="button"
                        whileTap={{ scale: gameState === 'betting' ? 0.92 : 1 }}
                        onClick={() => handleDenominationChange(denom.value)}
                        disabled={gameState !== 'betting'}
                        className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] transition ${
                          isActive
                            ? `bg-gradient-to-r ${theme.accent} text-slate-950 ${theme.accentBorder}`
                            : 'bg-white/10 text-amber-100/70 hover:bg-white/20 disabled:opacity-40'
                        }`}
                      >
                        {denom.label}
                      </motion.button>
                    );
                  })}
                </div>

                <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <div className="flex flex-wrap items-center gap-2">
                    <motion.button
                      type="button"
                      whileTap={{ scale: gameState === 'betting' ? 0.94 : 1 }}
                      onClick={() => handleBetChange(1)}
                      disabled={gameState !== 'betting'}
                      className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition ${
                        bet === 1 ? 'bg-white/25' : 'bg-white/10 hover:bg-white/20 disabled:opacity-40'
                      }`}
                    >
                      Bet 1
                    </motion.button>
                    <motion.button
                      type="button"
                      whileTap={{ scale: gameState === 'betting' ? 0.94 : 1 }}
                      onClick={() => handleBetChange(Math.min(5, bet + 1))}
                      disabled={gameState !== 'betting'}
                      className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition bg-white/10 hover:bg-white/20 disabled:opacity-40"
                    >
                      Bet +
                    </motion.button>
                    <motion.button
                      type="button"
                      whileTap={{ scale: gameState === 'betting' ? 0.94 : 1 }}
                      onClick={() => handleBetChange(5)}
                      disabled={gameState !== 'betting'}
                      className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white transition ${
                        bet === 5 ? 'bg-amber-400/90 text-slate-900 shadow-[0_0_28px_rgba(250,204,21,0.6)]' : 'bg-white/10 hover:bg-white/20 disabled:opacity-40'
                      }`}
                    >
                      Max Bet
                    </motion.button>
                  </div>

                  <motion.button
                    type="button"
                    onClick={() => {
                      if (canDraw) {
                        drawCards();
                      } else if (canDeal) {
                        dealCards();
                      }
                    }}
                    whileTap={{ scale: (canDeal || canDraw) ? 0.93 : 1 }}
                    className={`relative overflow-hidden rounded-full px-10 py-3 text-sm font-semibold uppercase tracking-[0.4em] transition ${
                      canDraw || canDeal
                        ? theme.primaryBtn
                        : 'bg-white/10 text-white/40 cursor-not-allowed'
                    }`}
                    disabled={!canDraw && !canDeal}
                  >
                    {canDraw ? 'Draw' : 'Deal'}
                    {canDraw && (
                      <span className="absolute inset-0 animate-pulse bg-white/10" />
                    )}
                  </motion.button>
                </div>
              </div>

              {credits < 5 && (
                <div className="mt-3 flex justify-center">
                  <motion.button
                    type="button"
                    onClick={addCredits}
                    whileTap={{ scale: 0.95 }}
                    className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200/70 hover:text-amber-200"
                  >
                    Add $100 Credits
                  </motion.button>
                </div>
              )}
            </footer>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
