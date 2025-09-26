import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

import { PAYTABLES } from "./data/paytables";
import {
  rank,
  suit,
  makeDeck,
  getRandomHand,
  enumerateHoldEvs,
  getOptimalHoldForGame
} from "./logic/solver";
import { HistoryEntry } from "./types";
import { CareerStats } from "./types";
import { CareerStatsModal } from "./components/CareerStatsModal";
import { FullDeckPicker } from "./components/FullDeckPicker";
import { CasinoMode } from "./components/CasinoMode";
import { TrainingMode } from "./components/TrainingMode";
import { StrategyDisplay } from "./components/StrategyDisplay";
import {
  getDefaultCareerStats,
  loadCareerStats,
  saveCareerStats,
  updateCareerStats,
  loadGameVariant,
  saveGameVariant
} from "./utils/careerStats";
import { getPlayerStrategyExplanation, getStrategyExplanation } from "./utils/strategyExplanations";
import { calculateMistakeSeverity } from "./utils/mistakeCalculation";

// Helper Functions
function getCardColor(cardSuit: string): string {
  return cardSuit === "♥" || cardSuit === "♦" ? "text-red-500" : "text-black";
}

function describeHold(cards: string[], hold: number[]): string {
  if (hold.length === 0) return "Draw 5 new cards";
  if (hold.length === 5) return "Keep all 5 cards";
  const heldCards = hold.map(index => cards[index]);
  return `Hold ${heldCards.join(', ')}`;
}

function getAllStrategyOptions(cards: string[], paytable: Record<string, number>): {hold: number[], ev: number, description: string}[] {
  return enumerateHoldEvs(cards, paytable)
    .slice(0, 4)
    .map(option => ({
      ...option,
      description: describeHold(cards, option.hold)
    }));
}

// Career stats functions, strategy explanations, and mistake calculations are now imported from utils

// Removed duplicate getPlayerStrategyExplanation - now imported from utils
/*
function getPlayerStrategyExplanation(cards: string[], playerHold: number[], playerEV: number, game: string): string {
  if (playerHold.length === 0) {
    return "🎲 Drew 5 new cards - discarded entire hand for fresh start.";
  }
  
  if (playerHold.length === 5) {
    const currentHand = evaluateHand(cards, PAYTABLES[game]);
    return `🃏 Kept entire hand (${currentHand.name}) - ${currentHand.payout > 0 ? `pays ${currentHand.payout}x` : 'no payout'}.`;
  }
  
  // Analyze what the player actually held
  const heldCards = playerHold.map(i => cards[i]);
  const heldRanks = heldCards.map(rank);
  const heldSuits = heldCards.map(suit);
  
  // Check for pairs in held cards
  const rankCounts: {[key: string]: number} = {};
  heldRanks.forEach(r => rankCounts[r] = (rankCounts[r] || 0) + 1);
  
  const pairs = Object.entries(rankCounts).filter(([rank, count]) => count === 2);
  const trips = Object.entries(rankCounts).filter(([rank, count]) => count === 3);
  
  if (trips.length > 0) {
    const tripRank = trips[0][0];
    return `🎯 Kept three ${tripRank}s - strong hold with ~25% chance to improve to full house or four of a kind.`;
  }
  
  if (pairs.length > 0) {
    const pairRank = pairs[0][0];
    const pairValue = RANK_ORDER[pairRank] || 0;
    if (pairValue >= 11) {
      return `👑 Kept pair of ${pairRank}s - pays 1-for-1 immediately, ~11% chance to improve to trips or better.`;
    } else {
      return `🎲 Kept low pair (${pairRank}s) - doesn't pay now but ~27% chance to improve to paying hand.`;
    }
  }
  
  // Check for flush draws
  if (new Set(heldSuits).size === 1 && heldCards.length === 4) {
    return `🌊 Kept 4-card ${heldSuits[0]} flush draw - 19% chance (9/47) to complete flush for ${PAYTABLES[game].FLUSH}x payout.`;
  }
  
  // Check for high cards
  const highCards = heldCards.filter(c => ['J', 'Q', 'K', 'A'].includes(rank(c)));
  if (highCards.length > 0) {
    if (game === "Double Double Bonus" && heldCards.some(c => rank(c) === 'A')) {
      return `🎯 Kept ${highCards.map(c => rank(c)).join(', ')} - in Double Double Bonus, Aces are especially valuable for bonus payouts.`;
    }
    return `👑 Kept high cards: ${highCards.map(c => rank(c)).join(', ')} - each has ~13% chance to pair for 1-for-1 payout.`;
  }
  
  return `🤔 Kept ${heldCards.join(', ')} - unusual hold with estimated ${(playerEV * 100).toFixed(1)}% RTP.`;
}

function getStrategyExplanation(cards: string[], bestHold: {hold: number[], ev: number}, game: string): string {
const currentHand = evaluateHand(cards, PAYTABLES[game]);
const ranks = cards.map(rank);
const suits = cards.map(suit);

// Made hands
if (currentHand.payout > 0) {
  if (currentHand.key === "ROYAL") return "🏆 Royal Flush! This is the highest paying hand - always hold all 5 cards.";
  if (currentHand.key === "STRAIGHT_FLUSH") return "🔥 Straight Flush! Hold all 5 cards for the second highest payout.";
  if (currentHand.key === "FOUR_KIND") return "💎 Four of a Kind! Hold all 5 cards for a guaranteed big payout.";
  if (currentHand.key === "FULL_HOUSE") return "🏠 Full House! Hold all 5 cards - this pays well in all variants.";
  if (currentHand.key === "FLUSH") return "🌊 Flush! Hold all 5 cards for a solid payout.";
  if (currentHand.key === "STRAIGHT") return "📈 Straight! Hold all 5 cards for a decent payout.";
  if (currentHand.key === "THREE_KIND") return `🎯 Three of a Kind (${ranks[bestHold.hold[0]]}s)! Hold the three matching cards and draw 2 new ones.`;
  if (currentHand.key === "TWO_PAIR") return "👥 Two Pair! Hold both pairs and draw 1 card for the full house chance.";
  if (currentHand.key === "JacksOrBetter") return `👑 Pair of ${ranks[bestHold.hold[0]]}s! This pair pays 1-for-1. Hold the pair and draw 3 cards.`;
}

// Draw situations
if (bestHold.hold.length === 4) {
  const heldSuits = bestHold.hold.map(i => suits[i]);
  const heldRanks = bestHold.hold.map(i => ranks[i]);
  
  // 4-card flush
  if (new Set(heldSuits).size === 1) {
    return `🌊 4-Card Flush Draw (${heldSuits[0]})! You have a 19% chance (9/47 cards) to complete the flush. RTP: ${(bestHold.ev * 100).toFixed(1)}%`;
  }
  
  // 4-card straight
  const sortedValues = heldRanks.map(r => RANK_ORDER[r]).sort((a,b) => b-a);
  let isConsecutive = true;
  for (let i = 1; i < sortedValues.length; i++) {
    if (sortedValues[i-1] - sortedValues[i] !== 1) {
      isConsecutive = false;
      break;
    }
  }
  if (isConsecutive) {
    return `📈 4-Card Straight Draw! You need 8 cards to complete the straight. RTP: ${(bestHold.ev * 100).toFixed(1)}%`;
  }
}

if (bestHold.hold.length === 3) {
  const heldRanks = bestHold.hold.map(i => ranks[i]);
  const heldSuits = bestHold.hold.map(i => suits[i]);
  
  // 3-card royal
  const royals = ['10', 'J', 'Q', 'K', 'A'];
  if (new Set(heldSuits).size === 1 && heldRanks.every(r => royals.includes(r))) {
    return `👑 3-Card Royal Flush Draw! You have a chance at the royal flush (2 cards) or other strong hands. RTP: ${(bestHold.ev * 100).toFixed(1)}%`;
  }
}

// High cards
if (bestHold.hold.length <= 2 && bestHold.hold.length > 0) {
  const heldRanks = bestHold.hold.map(i => ranks[i]);
  const highCards = heldRanks.filter(r => ['J', 'Q', 'K', 'A'].includes(r));
  
  if (highCards.length > 0) {
    if (game === "Double Double Bonus" && heldRanks.includes('A')) {
      return `🎯 Hold the Ace(s)! In Double Double Bonus, Aces are especially valuable for bonus payouts. RTP: ${(bestHold.ev * 100).toFixed(1)}%`;
    }
    return `👑 Hold High Card(s): ${heldRanks.join(', ')}. These can form paying pairs (Jacks or Better). RTP: ${(bestHold.ev * 100).toFixed(1)}%`;
  }
  
  // Low pair
  const pairRank = heldRanks[0];
  if (heldRanks.length === 2 && heldRanks[0] === heldRanks[1]) {
    if (game === "Double Double Bonus") {
      return `🎲 Low Pair (${pairRank}s) in Double Double Bonus. Low pairs can improve to trips or full house, and sometimes beat high card draws. RTP: ${(bestHold.ev * 100).toFixed(1)}%`;
    }
    return `🎲 Low Pair (${pairRank}s). While this doesn't pay now, it can improve to trips or better. RTP: ${(bestHold.ev * 100).toFixed(1)}%`;
  }
}

// Draw 5
if (bestHold.hold.length === 0) {
  return `🎲 Draw 5 New Cards! No profitable holds found. This gives you a fresh chance at any hand. RTP: ${(bestHold.ev * 100).toFixed(1)}%`;
}

return `Hold ${bestHold.hold.length} cards with RTP: ${(bestHold.ev * 100).toFixed(1)}%`;
}
*/

// Professional Career Statistics Modal Component
// Removed duplicate describeHold and getAllStrategyOptions - already defined at the top of file

// Removed duplicate calculateMistakeSeverity - now imported from utils
/*
function calculateMistakeSeverity(
  playerHold: number[],
  optimalHold: {hold: number[], ev: number},
  cards: string[],
  paytable: Record<string, number>
): {playerEV: number, optimalEV: number, difference: number, severity: string, color: string, severityDescription: string} {
  let playerEV: number;
  try {
    playerEV = expectedValue(cards, playerHold, paytable);
  } catch (error) {
    playerEV = 0;
  }

  let optimalEV = optimalHold.ev;
  if (optimalEV <= 0) {
    try {
      optimalEV = expectedValue(cards, optimalHold.hold, paytable);
    } catch (error) {
      optimalEV = 0;
    }
  }

  const difference = optimalEV - playerEV;

  let severity = "";
  let color = "";
  let severityDescription = "";

  if (difference <= 0.05) {
    severity = "Excellent";
    color = "text-green-600";
    severityDescription = "Perfect or near-perfect play! Your decision was optimal or very close to it.";
  } else if (difference <= 0.2) {
    severity = "Minor mistake";
    color = "text-yellow-600";
    severityDescription = "Small error with minimal impact. You chose a decent alternative but missed the optimal play.";
  } else if (difference <= 0.5) {
    severity = "Moderate mistake";
    color = "text-orange-600";
    severityDescription = "Noticeable error that hurts your returns. This decision significantly reduces your expected value.";
  } else if (difference <= 1.0) {
    severity = "Major mistake";
    color = "text-red-600";
    severityDescription = "Serious strategic error! This choice dramatically reduces your winning potential.";
  } else {
    severity = "Severe mistake";
    color = "text-red-800";
    severityDescription = "Critical blunder! This decision is mathematically very poor and severely hurts your odds.";
  }
  
  return {
    playerEV,
    optimalEV,
    difference,
    severity,
    color,
    severityDescription
  };
}
*/


export default function App() {
const [mode, setMode] = useState<"training" | "analysis">("training");
const [theme, setTheme] = useState<"light" | "dark" | "casino">("light");
const [cards, setCards] = useState<string[]>(() => getRandomHand());
const [game, setGame] = useState(() => loadGameVariant());
const [playerHold, setPlayerHold] = useState<number[]>([]);
const [score, setScore] = useState({played:0, correct:0});
const [history, setHistory] = useState<HistoryEntry[]>([]);
const [showFullDeckPicker, setShowFullDeckPicker] = useState(false);
const [tempSelectedCards, setTempSelectedCards] = useState<string[]>([]);
const [showHandAnalysis, setShowHandAnalysis] = useState(false);
const [careerStats, setCareerStats] = useState<CareerStats>(() => loadCareerStats());
const [showCareerStats, setShowCareerStats] = useState(false);
const [showCasino, setShowCasino] = useState(false);
const [isCalculatingBest, setIsCalculatingBest] = useState(false);

const paytable = PAYTABLES[game];

// Enhanced Theme configurations with modern design
const themes = {
  light: {
    bg: "bg-gradient-to-br from-slate-50 via-blue-50/80 to-indigo-100",
    cardBg: "bg-white",
    primaryBtn: "bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30",
    secondaryBtn: "bg-gradient-to-r from-slate-600 via-gray-700 to-slate-800 hover:from-slate-700 hover:via-gray-800 hover:to-slate-900 shadow-lg shadow-slate-500/25",
    successBtn: "bg-gradient-to-r from-emerald-600 via-green-700 to-teal-700 hover:from-emerald-700 hover:via-green-800 hover:to-teal-800 shadow-lg shadow-emerald-500/25",
    dangerBtn: "bg-gradient-to-r from-red-600 via-rose-700 to-red-700 hover:from-red-700 hover:via-rose-800 hover:to-red-800 shadow-lg shadow-red-500/25",
    panel: "bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl shadow-slate-200/60",
    text: "text-slate-900",
    textMuted: "text-slate-600",
    border: "border-slate-200/80",
    shadow: "shadow-2xl shadow-slate-200/40",
    cardShadow: "shadow-2xl shadow-slate-300/40 hover:shadow-3xl hover:shadow-slate-400/50",
    glassPanel: "bg-gradient-to-br from-white/90 via-white/70 to-white/90 backdrop-blur-2xl border border-white/40",
  },
  dark: {
    bg: "bg-gradient-to-br from-slate-900 via-gray-900/95 to-black",
    cardBg: "bg-white",
    primaryBtn: "bg-gradient-to-r from-violet-600 via-purple-700 to-indigo-700 hover:from-violet-700 hover:via-purple-800 hover:to-indigo-800 shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30",
    secondaryBtn: "bg-gradient-to-r from-slate-700 via-gray-800 to-slate-900 hover:from-slate-600 hover:via-gray-700 hover:to-slate-800 shadow-lg shadow-slate-500/25",
    successBtn: "bg-gradient-to-r from-emerald-600 via-teal-700 to-cyan-700 hover:from-emerald-700 hover:via-teal-800 hover:to-cyan-800 shadow-lg shadow-emerald-500/25",
    dangerBtn: "bg-gradient-to-r from-red-600 via-pink-700 to-rose-700 hover:from-red-700 hover:via-pink-800 hover:to-rose-800 shadow-lg shadow-red-500/25",
    panel: "bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-black/60",
    text: "text-slate-100",
    textMuted: "text-slate-400",
    border: "border-slate-700/80",
    shadow: "shadow-2xl shadow-black/40",
    cardShadow: "shadow-2xl shadow-black/60 hover:shadow-3xl hover:shadow-black/80",
    glassPanel: "bg-gradient-to-br from-slate-800/90 via-slate-900/70 to-slate-800/90 backdrop-blur-2xl border border-slate-700/40",
  },
  casino: {
    bg: "bg-gradient-to-br from-emerald-900 via-green-900/95 to-teal-900",
    cardBg: "bg-white",
    primaryBtn: "bg-gradient-to-r from-amber-500 via-yellow-600 to-orange-600 hover:from-amber-600 hover:via-yellow-700 hover:to-orange-700 shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40",
    secondaryBtn: "bg-gradient-to-r from-emerald-700 via-green-800 to-teal-800 hover:from-emerald-600 hover:via-green-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25",
    successBtn: "bg-gradient-to-r from-lime-500 via-emerald-600 to-green-600 hover:from-lime-600 hover:via-emerald-700 hover:to-green-700 shadow-lg shadow-lime-500/25",
    dangerBtn: "bg-gradient-to-r from-red-600 via-rose-700 to-red-700 hover:from-red-700 hover:via-rose-800 hover:to-red-800 shadow-lg shadow-red-500/25",
    panel: "bg-emerald-800/30 backdrop-blur-xl border border-emerald-600/40 shadow-2xl shadow-emerald-900/60",
    text: "text-emerald-50",
    textMuted: "text-emerald-200",
    border: "border-emerald-600/60",
    shadow: "shadow-2xl shadow-emerald-900/50",
    cardShadow: "shadow-2xl shadow-emerald-900/50 hover:shadow-3xl hover:shadow-emerald-900/70",
    glassPanel: "bg-gradient-to-br from-emerald-800/50 via-green-900/40 to-emerald-800/50 backdrop-blur-2xl border border-emerald-600/30",
  }
};

const currentTheme = themes[theme];

function dealRandom() {
const newCards = getRandomHand();
setCards(newCards);
setPlayerHold([]);
setShowHandAnalysis(false); // Hide analysis for new hand
setIsCalculatingBest(true);
}

const [best, setBest] = useState<{hold: number[], ev: number}>({ hold: [], ev: 0 });

// Calculate best move asynchronously after cards change
useEffect(() => {
  if (isCalculatingBest) {
    // Use setTimeout to defer the expensive calculation
    const timeoutId = setTimeout(() => {
      try {
        const optimalHold = getOptimalHoldForGame(cards, paytable, game);
        setBest(optimalHold);
      } catch (error) {
        setBest({ hold: [], ev: 0 });
      }
      setIsCalculatingBest(false);
    }, 0);
    return () => clearTimeout(timeoutId);
  } else {
    // Calculate immediately for initial load or game change
    try {
      const optimalHold = getOptimalHoldForGame(cards, paytable, game);
      setBest(optimalHold);
    } catch (error) {
      setBest({ hold: [], ev: 0 });
    }
  }
}, [cards, paytable, game, isCalculatingBest]);


function toggleHold(i:number) {
if(playerHold.includes(i)) setPlayerHold(ph => ph.filter(x=>x!==i));
else setPlayerHold(ph => [...ph,i]);
}

function submitHold() {
try {
// Store current cards and hold for async processing
const submittedCards = [...cards];
const submittedPlayerHold = [...playerHold];
const submittedBest = {...best};

// Check if player's hold matches the optimal hold
const playerSorted = submittedPlayerHold.slice().sort();
const bestSorted = submittedBest.hold.slice().sort();
const correct = playerSorted.length === bestSorted.length &&
               playerSorted.every((x, i) => x === bestSorted[i]);

// Update score and history immediately for better responsiveness
setScore(s => ({played: s.played+1, correct: s.correct + (correct?1:0)}));
setHistory(h => [{
  cards: submittedCards,
  playerHold: submittedPlayerHold,
  bestHold: submittedBest.hold.slice(),
  correct,
  gameVariant: game,
  optimalHold: submittedBest.hold.slice(),
  optimalEv: submittedBest.ev
}, ...h.slice(0, 9)]);

// Deal new hand immediately for better UX
setShowHandAnalysis(false);
dealRandom();

// Calculate mistake severity and update stats asynchronously to avoid blocking UI
setTimeout(() => {
  let mistakeCost = 0;
  let severity = "Excellent";
  if (!correct) {
    const mistake = calculateMistakeSeverity(submittedPlayerHold, submittedBest, submittedCards, paytable);
    mistakeCost = mistake.difference;
    severity = mistake.severity;
  }

  // Update career stats in the background
  const updatedStats = updateCareerStats(careerStats, correct, game, mistakeCost, severity);
  setCareerStats(updatedStats);
  saveCareerStats(updatedStats);
}, 0);

} catch (error) {
// Handle error silently
}
}

function resetCareerStats() {
const confirmReset = window.confirm(
  "⚠️ Are you sure you want to reset all career statistics?\n\n" +
  "This will permanently delete:\n" +
  "• All game history\n" +
  "• Accuracy records\n" +
  "• Best streaks\n" +
  "• Performance data\n\n" +
  "This action cannot be undone!"
);

if (confirmReset) {
  const newStats = getDefaultCareerStats();
  setCareerStats(newStats);
  saveCareerStats(newStats);
  setShowCareerStats(false);
}
}

function handleGameChange(newGame: string) {
setGame(newGame);
saveGameVariant(newGame);
}

return (
<div className={`min-h-screen p-4 sm:p-6 lg:p-8 transition-all duration-500 ${currentTheme.bg}`}>
<div className="max-w-7xl mx-auto">
{/* Header with Theme Toggle */}
<div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
<motion.div 
  initial={{opacity:0,y:-20}} 
  animate={{opacity:1,y:0}} 
  transition={{duration:0.8, ease:"easeOut"}}
  className="text-center mb-2"
>
  <h1 className={`text-6xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2 tracking-tight`}>
    🎰 What Should I Hold?
  </h1>
  <p className={`text-lg font-medium ${currentTheme.textMuted} tracking-wide`}>
    Professional Video Poker Strategy Trainer
  </p>
</motion.div>

{/* Career Stats & Theme Selector */}
<div className="flex flex-wrap gap-2 sm:gap-3 justify-center sm:justify-end items-center">
<motion.button
  onClick={() => setShowCareerStats(true)}
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 ${currentTheme.glassPanel} ${currentTheme.text} hover:shadow-md border border-slate-200/30`}
>
  <span className="text-lg mr-2">📊</span>
  Career Stats
</motion.button>
<motion.button
  onClick={() => setShowCasino(true)}
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  className="px-4 py-2 rounded-xl font-semibold text-sm bg-gradient-to-r from-red-600 via-yellow-600 to-red-600 text-white shadow-lg hover:shadow-xl border-2 border-yellow-400 animate-pulse"
>
  <span className="text-lg mr-2">🎰</span>
  Casino Play
</motion.button>
{(["light", "dark"] as const).map(themeOption => (
<motion.button
  key={themeOption}
  onClick={() => setTheme(themeOption)}
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  className={`px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-xl font-semibold transition-all duration-300 ${
    theme === themeOption
      ? themeOption === "light" ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg ring-2 ring-blue-400/50" :
        "bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg ring-2 ring-purple-400/50"
      : `${currentTheme.glassPanel} ${currentTheme.text} hover:shadow-md border border-slate-200/30`
  }`}
>
  <span className="text-lg mr-2">
    {themeOption === "light" ? "☀️" : "🌙"}
  </span>
  {themeOption === "light" ? "Light" : "Dark"}
</motion.button>
))}
</div>
</div>

{/* Mode Toggle */}
<div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 w-full sm:w-auto">
<motion.button 
  onClick={() => setMode("training")}
  whileHover={{ scale: 1.05, y: -2 }}
  whileTap={{ scale: 0.95 }}
  className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base rounded-2xl font-bold transition-all duration-300 ${
    mode === "training" 
      ? `${currentTheme.primaryBtn} text-white ${currentTheme.shadow} ring-2 ring-blue-400/50` 
      : `${currentTheme.glassPanel} ${currentTheme.text} hover:shadow-lg border border-slate-200/50`
  }`}
>
  <span className="text-2xl mr-2">🎯</span>
  Training Mode
</motion.button>
<motion.button 
  onClick={() => setMode("analysis")}
  whileHover={{ scale: 1.05, y: -2 }}
  whileTap={{ scale: 0.95 }}
  className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base rounded-2xl font-bold transition-all duration-300 ${
    mode === "analysis" 
      ? `${currentTheme.successBtn} text-white ${currentTheme.shadow} ring-2 ring-emerald-400/50` 
      : `${currentTheme.glassPanel} ${currentTheme.text} hover:shadow-lg border border-slate-200/50`
  }`}
>
  <span className="text-2xl mr-2">🔍</span>
  Hand Analysis
</motion.button>
</div>

{mode === "training" ? (
  <TrainingMode
    game={game}
    cards={cards}
    playerHold={playerHold}
    score={score}
    careerStats={careerStats}
    history={history}
    showHandAnalysis={showHandAnalysis}
    currentTheme={currentTheme}
    paytable={paytable}
    best={best}
    handleGameChange={handleGameChange}
    toggleHold={toggleHold}
    dealRandom={dealRandom}
    submitHold={submitHold}
    setShowHandAnalysis={setShowHandAnalysis}
    getCardColor={getCardColor}
    getAllStrategyOptions={getAllStrategyOptions}
    getStrategyExplanation={getStrategyExplanation}
    calculateMistakeSeverity={calculateMistakeSeverity}
    getPlayerStrategyExplanation={getPlayerStrategyExplanation}
  />
) : (
<div>
{/* Analysis Mode Content */}
<div className="mb-6">
<label className="mr-2 font-semibold">Game:</label>
<select value={game} onChange={e=>handleGameChange(e.target.value)} className="border rounded px-2 py-1">
{Object.keys(PAYTABLES).map(g => <option key={g} value={g}>{g}</option>)}
</select>
</div>

<div className="bg-white rounded-2xl shadow p-6 mb-6">
<h3 className="text-xl font-bold mb-4">🔍 Current Hand Analysis</h3>
<div className="flex justify-center gap-5 mb-6">
{cards.map((card, i) => {
const cardRank = rank(card);
const cardSuit = suit(card);
const colorClass = getCardColor(cardSuit);
const isOptimal = best.hold.includes(i);
return (
<div key={i} className="flex flex-col items-center gap-2">
<div className="text-sm text-gray-500 font-medium">Card {i+1}</div>
<div className={`relative w-16 h-24 rounded-lg border-2 bg-white shadow-lg ${
  isOptimal ? "border-green-500 bg-green-50" : "border-gray-300"
}`}>
<div className={`flex flex-col items-center justify-center h-full ${colorClass}`}>
<div className="text-lg font-bold">{cardRank}</div>
<div className="text-xl">{cardSuit}</div>
</div>
{isOptimal && (
<div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded font-bold">
OPTIMAL
</div>
)}
</div>
</div>
);
})}
</div>

<button 
  onClick={() => {
    setTempSelectedCards([]);
    setShowFullDeckPicker(true);
  }}
  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 mb-4"
>
🃏 Select New Hand from Full Deck
</button>

<button 
  onClick={() => {
    const deck = makeDeck();
    const shuffled = [...deck];
    for(let i = shuffled.length-1; i > 0; i--){ 
      const j = Math.floor(Math.random() * (i+1)); 
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; 
    }
    setCards(shuffled.slice(0,5));
  }} 
  className="w-full px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 mb-4"
>
  🎲 Generate Random Hand
</button>
</div>

{/* Full Deck Picker Component */}
<FullDeckPicker
  isOpen={showFullDeckPicker}
  onClose={() => setShowFullDeckPicker(false)}
  onSelectCards={(newCards) => {
    setCards(newCards);
    setPlayerHold([]);
  }}
  selectedCards={tempSelectedCards}
  setSelectedCards={setTempSelectedCards}
  getCardColor={getCardColor}
/>




{/* Analysis Results */}
<StrategyDisplay
  cards={cards}
  paytable={paytable}
  best={best}
  game={game}
  getAllStrategyOptions={getAllStrategyOptions}
  getStrategyExplanation={getStrategyExplanation}
  getCardColor={getCardColor}
/>
</div>
)}
</div>

{/* Career Stats Modal - Rendered outside of mode conditions */}
<CareerStatsModal
  isOpen={showCareerStats}
  onClose={() => setShowCareerStats(false)}
  stats={careerStats}
  onReset={resetCareerStats}
  theme={theme}
  currentGame={game}
  onGameChange={handleGameChange}
/>

{/* Casino Mode - Full Screen Video Poker Machine */}
<CasinoMode
  isOpen={showCasino}
  onClose={() => setShowCasino(false)}
  game={game}
/>
</div>
);
}
