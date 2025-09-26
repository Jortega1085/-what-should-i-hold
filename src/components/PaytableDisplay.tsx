import React from 'react';
import { motion } from 'framer-motion';
import type { Theme } from '../config/themes';

export interface PaytableEntry {
  hand: string;
  payout: number;
}

interface PaytableDisplayProps {
  entries: PaytableEntry[];
  bet: number;
  highlightedHand?: string | null;
  theme: Theme;
}

export function PaytableDisplay({ entries, bet, highlightedHand, theme }: PaytableDisplayProps): React.ReactElement {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border ${theme.border} ${theme.panel} ${theme.panelGlow}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),_rgba(15,23,42,0.85))]" />
      <div className="pointer-events-none absolute inset-0 mix-blend-screen opacity-30 bg-[linear-gradient(115deg,transparent_40%,rgba(250,204,21,0.25)_50%,transparent_65%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[length:22px_100%] opacity-20" />

      <div className="relative flex flex-col gap-2 p-5">
        <div className="flex items-center justify-between">
          <span className={`text-sm font-semibold uppercase tracking-[0.35em] text-amber-200`}>Paytable</span>
          <div className="flex items-center gap-1 text-[0.65rem] uppercase tracking-[0.2em] text-slate-300/80">
            {[1, 2, 3, 4, 5].map(col => (
              <span key={col} className={`w-10 text-center ${col === bet ? 'text-amber-300' : ''}`}>
                x{col}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col divide-y divide-slate-500/40">
          {entries.map((item, idx) => {
            const isHighlighted = highlightedHand === item.hand;
            return (
              <motion.div
                key={`${item.hand}-${idx}`}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.015 }}
                className={`relative flex items-center justify-between gap-3 py-2 text-sm font-medium tracking-wide text-slate-200 ${
                  isHighlighted ? 'text-amber-200' : ''
                }`}
              >
                {isHighlighted && (
                  <motion.div
                    layoutId="paytable-highlight"
                    className="absolute inset-0 rounded-2xl bg-emerald-400/15 shadow-[0_0_35px_rgba(74,222,128,0.35)]"
                    transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                  />
                )}
                <span className="relative z-10 text-[0.8rem] uppercase tracking-[0.25em] text-amber-100/90">
                  {item.hand}
                </span>
                <div className="relative z-10 flex items-center gap-2 text-xs font-semibold">
                  {[1, 2, 3, 4, 5].map(multiplier => (
                    <span
                      key={multiplier}
                      className={`w-10 text-right tabular-nums ${
                        multiplier === bet && isHighlighted
                          ? 'text-amber-200 drop-shadow-[0_0_12px_rgba(250,204,21,0.85)]'
                          : multiplier === bet
                          ? 'text-amber-300'
                          : 'text-slate-300/70'
                      }`}
                    >
                      {item.payout * multiplier}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

