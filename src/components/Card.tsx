import React, { useMemo } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { rank, suit } from '../logic/solver';
import type { Theme } from '../config/themes';

interface CardProps {
  card: string;
  isHeld: boolean;
  onClick: () => void;
  theme: Theme;
  showHoldLabel?: boolean;
  disabled?: boolean;
  index?: number;
}

const suitFill: Record<string, string> = {
  '♥': '#ef4444',
  '♦': '#f97316',
  '♣': '#0f172a',
  '♠': '#020617',
};

const suitNameMap: Record<string, string> = {
  '♥': 'Hearts',
  '♦': 'Diamonds',
  '♣': 'Clubs',
  '♠': 'Spades',
};

function renderSuitGraphic(cardSuit: string, accentGlow: boolean): React.ReactElement | null {
  const fill = suitFill[cardSuit] ?? '#111827';
  const glow = accentGlow ? 'drop-shadow-[0_0_12px_rgba(250,204,21,0.65)]' : '';
  switch (cardSuit) {
    case '♥':
      return (
        <svg viewBox="0 0 24 24" className={`h-full w-full ${glow}`}>
          <path
            d="M12 21c-3.3-3-6-5.6-6-8.6a3.6 3.6 0 0 1 6-2.4 3.6 3.6 0 0 1 6 2.4c0 3-2.7 5.6-6 8.6z"
            fill={fill}
          />
        </svg>
      );
    case '♦':
      return (
        <svg viewBox="0 0 24 24" className={`h-full w-full ${glow}`}>
          <path d="M12 3 4 12l8 9 8-9-8-9z" fill={fill} />
        </svg>
      );
    case '♣':
      return (
        <svg viewBox="0 0 24 24" className={`h-full w-full ${glow}`}>
          <path
            d="M12 7a3 3 0 1 1 5.9.6A3 3 0 0 1 18 11a3 3 0 0 1-2.9 2.3H17l-5 8-5-8h1.9A3 3 0 1 1 6 11a3 3 0 0 1 0-4 3 3 0 0 1 5.8.6L12 7z"
            fill={fill}
          />
        </svg>
      );
    case '♠':
      return (
        <svg viewBox="0 0 24 24" className={`h-full w-full ${glow}`}>
          <path
            d="M12 2c-2.8 3.3-8 7.5-8 11a4 4 0 0 0 6.8 2.7V18H7.5L12 22l4.5-4H13v-2.3A4 4 0 0 0 20 13c0-3.5-5.2-7.7-8-11z"
            fill={fill}
          />
        </svg>
      );
    default:
      return null;
  }
}

export function Card({
  card,
  isHeld,
  onClick,
  theme,
  showHoldLabel = true,
  disabled = false,
  index = 0,
}: CardProps): React.ReactElement {
  const cardRank = card ? rank(card) : '';
  const cardSuit = card ? suit(card) : '';
  const isFaceUp = Boolean(card);
  const prefersReducedMotion = useReducedMotion();
  const delay = prefersReducedMotion ? 0 : index * 0.05;
  const accessibleLabel = useMemo(() => {
    if (!isFaceUp) return 'Face down playing card';
    const suitName = suitNameMap[cardSuit] ?? 'Unknown suit';
    return `${cardRank} of ${suitName}`;
  }, [cardRank, cardSuit, isFaceUp]);

  const borderClasses = useMemo(() => {
    if (isHeld) {
      return 'ring-4 ring-amber-400/80 shadow-[0_0_35px_rgba(250,204,21,0.55)]';
    }
    return 'ring-1 ring-white/10 hover:ring-amber-200/80';
  }, [isHeld]);

  const cardContent = useMemo(() => {
    if (!isFaceUp) {
      return (
        <motion.div
          key="back"
          initial={{ rotateY: prefersReducedMotion ? 0 : 180, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: prefersReducedMotion ? 0 : -180, opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          className={`relative h-full w-full overflow-hidden rounded-[1.25rem] ${theme.cardBack}`}
        >
          <div className="absolute inset-[6%] rounded-[1rem] border border-amber-400/70"></div>
          <div className="absolute inset-2 rounded-[1.1rem] bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.4),_transparent_70%)]"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="grid h-4/5 w-4/5 grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  // eslint-disable-next-line react/no-array-index-key
                  key={i}
                  className="rounded-full border border-amber-300/50 bg-amber-300/10 shadow-[0_0_8px_rgba(250,204,21,0.35)]"
                />
              ))}
            </div>
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(250,204,21,0.2),_rgba(2,6,23,0.9))]"></div>
        </motion.div>
      );
    }

    const suitGraphic = renderSuitGraphic(cardSuit, isHeld);

    return (
      <motion.div
        key={card}
        initial={{ rotateY: prefersReducedMotion ? 0 : -180, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        exit={{ rotateY: prefersReducedMotion ? 0 : 180, opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className={`relative flex h-full w-full flex-col overflow-hidden rounded-[1.25rem] ${theme.cardFace}`}
      >
        <div className="absolute inset-0 rounded-[1.25rem] bg-gradient-to-br from-white via-white/80 to-white/40"></div>
        <div className="absolute inset-[6%] rounded-[1rem] border border-slate-200/80 shadow-inner shadow-slate-400/40"></div>
        <div className="relative z-10 flex h-full flex-col justify-between px-3 py-3">
          <div className="flex items-start justify-between text-2xl font-semibold text-slate-800">
            <div className="flex flex-col items-center leading-none">
              <span className="text-xl font-bold">{cardRank}</span>
              <span className="h-5 w-5">{suitGraphic}</span>
            </div>
            <div className="mt-1 h-6 w-6 text-slate-800">
              {suitGraphic}
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="h-16 w-16">{suitGraphic}</div>
          </div>
          <div className="flex items-start justify-between text-2xl font-semibold text-slate-800">
            <div className="mt-1 h-6 w-6 rotate-180 text-slate-800">
              {suitGraphic}
            </div>
            <div className="flex flex-col items-center leading-none rotate-180">
              <span className="text-xl font-bold">{cardRank}</span>
              <span className="h-5 w-5">{suitGraphic}</span>
            </div>
          </div>
        </div>
        {isHeld && (
          <div className="pointer-events-none absolute inset-0 rounded-[1.25rem] bg-amber-200/10"></div>
        )}
      </motion.div>
    );
  }, [card, cardSuit, cardRank, isFaceUp, isHeld, prefersReducedMotion, theme.cardBack, theme.cardFace]);

  return (
    <motion.div
      layout
      className="relative flex flex-col items-center gap-2"
      initial={{ opacity: 0, y: -40, scale: prefersReducedMotion ? 1 : 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: prefersReducedMotion ? 'tween' : 'spring', stiffness: 280, damping: 22, delay }}
    >
      <AnimatePresence>
        {isHeld && showHoldLabel && (
          <motion.div
            key="held-label"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="rounded-full bg-amber-400/80 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-900 shadow-[0_0_18px_rgba(250,204,21,0.55)]"
          >
            Hold
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        layout
        whileTap={{ scale: disabled ? 1 : 0.96 }}
        whileHover={disabled ? undefined : { y: prefersReducedMotion ? 0 : -6 }}
        onClick={onClick}
        disabled={disabled}
        aria-label={accessibleLabel}
        className={`group relative aspect-[3/4] w-24 rounded-[1.25rem] transition-all duration-300 ease-out sm:w-28 lg:w-32 ${theme.cardShadow} ${borderClasses} ${
          disabled ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
        }`}
      >
        <div className="absolute inset-0 rounded-[1.25rem] bg-gradient-to-br from-white/5 via-amber-50/5 to-transparent opacity-0 transition group-hover:opacity-100"></div>
        <AnimatePresence mode="wait">{cardContent}</AnimatePresence>
      </motion.button>
    </motion.div>
  );
}

export function getCardColor(cardSuit: string): string {
  return cardSuit === '♥' || cardSuit === '♦' ? 'text-red-500' : 'text-gray-900';
}
