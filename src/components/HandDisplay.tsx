import React from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { Card } from './Card';
import type { Theme } from '../config/themes';

interface HandDisplayProps {
  cards: string[];
  heldCards: number[];
  onToggleHold: (index: number) => void;
  theme: Theme;
  disabled?: boolean;
  showCardNumbers?: boolean;
}

export function HandDisplay({
  cards,
  heldCards,
  onToggleHold,
  theme,
  disabled = false,
  showCardNumbers = true
}: HandDisplayProps): React.ReactElement {
  return (
    <LayoutGroup>
      <motion.div
        layout
        className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 md:grid-cols-5 md:gap-4 lg:gap-6"
      >
        <AnimatePresence>
          {cards.map((card, i) => (
            <motion.div
              layout
              key={`${card || 'blank'}-${i}`}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ type: 'spring', stiffness: 240, damping: 20, delay: i * 0.03 }}
              className="flex flex-col items-center gap-3"
            >
              {showCardNumbers && (
                <motion.div
                  layout
                  className="text-xs uppercase tracking-[0.2em] text-amber-200/70"
                >
                  Card {i + 1}
                </motion.div>
              )}
              <Card
                card={card}
                isHeld={heldCards.includes(i)}
                onClick={() => onToggleHold(i)}
                theme={theme}
                disabled={disabled}
                index={i}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </LayoutGroup>
  );
}
