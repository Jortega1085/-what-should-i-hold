import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";

const SUITS = ["♠", "♥", "♦", "♣"] as const;
const RANKS = ["A","K","Q","J","10","9","8","7","6","5","4","3","2"] as const;
const RANK_ORDER: Record<string, number> = {A:14,K:13,Q:12,J:11,"10":10,T:10,9:9,8:8,7:7,6:6,5:5,4:4,3:3,2:2};

const PAYTABLES: Record<string, Record<string, number>> = {
"Jacks or Better 9/6": {ROYAL:800,STRAIGHT_FLUSH:50,FOUR_KIND:25,FULL_HOUSE:9,FLUSH:6,STRAIGHT:4,THREE_KIND:3,TWO_PAIR:2,JacksOrBetter:1},
"Jacks or Better 8/5": {ROYAL:800,STRAIGHT_FLUSH:50,FOUR_KIND:25,FULL_HOUSE:8,FLUSH:5,STRAIGHT:4,THREE_KIND:3,TWO_PAIR:1,JacksOrBetter:1},
"Double Bonus": {ROYAL:800,STRAIGHT_FLUSH:50,FOUR_ACES_WITH_234:400,FOUR_2_4_WITH_A_4:160,FOUR_ACES:160,FOUR_2_4:80,FOUR_5_K:50,FULL_HOUSE:9,FLUSH:6,STRAIGHT:4,THREE_KIND:3,TWO_PAIR:1,JacksOrBetter:1},
"Double Double Bonus": {ROYAL:800,STRAIGHT_FLUSH:50,FOUR_ACES_WITH_234:400,FOUR_2_4_WITH_A_4:160,FOUR_ACES:160,FOUR_2_4:80,FOUR_5_K:50,FULL_HOUSE:9,FLUSH:6,STRAIGHT:4,THREE_KIND:3,TWO_PAIR:1,JacksOrBetter:1},
"Bonus Poker": {ROYAL:800,STRAIGHT_FLUSH:50,FOUR_ACES_WITH_234:160,FOUR_2_4_WITH_A_4:80,FOUR_ACES:80,FOUR_2_4:40,FOUR_5_K:25,FULL_HOUSE:9,FLUSH:6,STRAIGHT:4,THREE_KIND:3,TWO_PAIR:1,JacksOrBetter:1},
};

function makeDeck(): string[] {
const deck: string[] = [];
for (const s of SUITS) for (const r of RANKS) deck.push(`${r}${s}`);
return deck;
}

function getRandomHand(): string[] {
const deck = makeDeck();
for(let i=deck.length-1;i>0;i--){ 
  const j=Math.floor(Math.random()*(i+1)); 
  [deck[i], deck[j]]=[deck[j],deck[i]]; 
}
return deck.slice(0,5);
}

// Career Stats Interface
interface CareerStats {
  totalHands: number;
  correctDecisions: number;
  totalRTPGained: number;
  totalRTPLost: number;
  mistakesByGame: Record<string, number>;
  mistakesBySeverity: Record<string, number>;
  sessionsByDate: Record<string, {hands: number, correct: number, rtpGained: number, rtpLost: number}>;
  bestStreak: number;
  currentStreak: number;
  startDate: string;
  lastPlayed: string;
  handsPerGame: Record<string, {played: number, correct: number}>;
}

// Career Stats Management
function getDefaultCareerStats(): CareerStats {
  return {
    totalHands: 0,
    correctDecisions: 0,
    totalRTPGained: 0,
    totalRTPLost: 0,
    mistakesByGame: {},
    mistakesBySeverity: {
      "Excellent": 0,
      "Minor mistake": 0,
      "Moderate mistake": 0,
      "Major mistake": 0,
      "Severe mistake": 0
    },
    sessionsByDate: {},
    bestStreak: 0,
    currentStreak: 0,
    startDate: new Date().toISOString().split('T')[0],
    lastPlayed: new Date().toISOString().split('T')[0],
    handsPerGame: {}
  };
}

function loadCareerStats(): CareerStats {
  try {
    const saved = localStorage.getItem('videoPokerCareerStats');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure all required fields exist (for backwards compatibility)
      return { ...getDefaultCareerStats(), ...parsed };
    }
  } catch (error) {
    console.warn('Failed to load career stats:', error);
  }
  return getDefaultCareerStats();
}

function saveCareerStats(stats: CareerStats): void {
  try {
    localStorage.setItem('videoPokerCareerStats', JSON.stringify(stats));
  } catch (error) {
    console.warn('Failed to save career stats:', error);
  }
}

function loadGameVariant(): string {
  try {
    return localStorage.getItem('videoPokerGameVariant') || 'Jacks or Better 9/6';
  } catch (error) {
    return 'Jacks or Better 9/6';
  }
}

function saveGameVariant(game: string): void {
  try {
    localStorage.setItem('videoPokerGameVariant', game);
  } catch (error) {
    console.warn('Failed to save game variant:', error);
  }
}

function updateCareerStats(
  currentStats: CareerStats, 
  correct: boolean, 
  game: string, 
  mistakeCost: number, 
  severity: string
): CareerStats {
  const today = new Date().toISOString().split('T')[0];
  const newStats = { ...currentStats };
  
  // Update basic counters
  newStats.totalHands += 1;
  if (correct) {
    newStats.correctDecisions += 1;
    newStats.currentStreak += 1;
    newStats.bestStreak = Math.max(newStats.bestStreak, newStats.currentStreak);
  } else {
    newStats.currentStreak = 0;
    newStats.totalRTPLost += mistakeCost;
  }
  
  // Track by game variant
  if (!newStats.handsPerGame[game]) {
    newStats.handsPerGame[game] = { played: 0, correct: 0 };
  }
  newStats.handsPerGame[game].played += 1;
  if (correct) {
    newStats.handsPerGame[game].correct += 1;
  }
  
  // Track mistakes by game and severity
  if (!correct) {
    newStats.mistakesByGame[game] = (newStats.mistakesByGame[game] || 0) + 1;
    newStats.mistakesBySeverity[severity] = (newStats.mistakesBySeverity[severity] || 0) + 1;
  }
  
  // Track daily sessions
  if (!newStats.sessionsByDate[today]) {
    newStats.sessionsByDate[today] = { hands: 0, correct: 0, rtpGained: 0, rtpLost: 0 };
  }
  newStats.sessionsByDate[today].hands += 1;
  if (correct) {
    newStats.sessionsByDate[today].correct += 1;
  } else {
    newStats.sessionsByDate[today].rtpLost += mistakeCost;
  }
  
  newStats.lastPlayed = today;
  
  return newStats;
}

function rank(card: string) { return card.length === 3 ? card.slice(0, 2) : card[0]; }
function suit(card: string) { return card.length === 3 ? card.slice(2) : card.slice(1); }

function getCardColor(suit: string) {
  return suit === "♥" || suit === "♦" ? "text-red-500" : "text-black";
}

function countsBy<T extends string|number>(arr: T[]) {
const m = new Map<T, number>();
arr.forEach(v => m.set(v, (m.get(v) || 0) + 1));
return m;
}

function isSequential(sortedNums: number[]) {
for (let i = 1; i < sortedNums.length; i++)
if (sortedNums[i] !== sortedNums[i - 1] - 1) return false;
return true;
}

function hasAceLowStraight(nums: number[]) {
const set = new Set(nums);
return set.has(14) && set.has(5) && set.has(4) && set.has(3) && set.has(2);
}

function evaluate5(cards: string[], paytable: Record<string, number>) {
const rs = cards.map(rank).map(r => RANK_ORDER[r]);
const ss = cards.map(suit);
const rankCounts = countsBy(rs.map(String));
const suitCounts = countsBy(ss);
const counts = Array.from(rankCounts.values()).sort((a,b) => b - a);
const isFlush = Array.from(suitCounts.values()).some(v => v === 5);
const sortedDesc = Array.from(new Set(rs)).sort((a,b) => b - a);
const isStr = (sortedDesc.length === 5 && isSequential(sortedDesc)) || hasAceLowStraight(rs);
let isRoyal = false;
if(isStr && isFlush) {
const set = new Set(rs);
isRoyal = [10,11,12,13,14].every(v => set.has(v));
}

if(isFlush && isRoyal) return {name:"Royal Flush", key:"ROYAL", payout: paytable.ROYAL || 0};
if(isFlush && isStr) return {name:"Straight Flush", key:"STRAIGHT_FLUSH", payout: paytable.STRAIGHT_FLUSH || 0};
if(counts[0] === 4) return {name:"Four of a Kind", key:"FOUR_KIND", payout: paytable.FOUR_KIND || 0};
if(counts[0] === 3 && counts[1] === 2) return {name:"Full House", key:"FULL_HOUSE", payout: paytable.FULL_HOUSE || 0};
if(isFlush) return {name:"Flush", key:"FLUSH", payout: paytable.FLUSH || 0};
if(isStr) return {name:"Straight", key:"STRAIGHT", payout: paytable.STRAIGHT || 0};
if(counts[0] === 3) return {name:"Three of a Kind", key:"THREE_KIND", payout: paytable.THREE_KIND || 0};
if(counts[0] === 2 && counts[1] === 2) return {name:"Two Pair", key:"TWO_PAIR", payout: paytable.TWO_PAIR || 0};
if([11,12,13,14].some(h => Array.from(rankCounts.entries()).some(([k,v]) => Number(k) === h && v === 2))) return {name:"Jacks or Better", key:"JacksOrBetter", payout: paytable.JacksOrBetter || 0};
return {name:"Nothing", key:null, payout:0};
}

function expectedValue(cards: string[], hold: number[], paytable: Record<string, number>): number {
const deck = makeDeck().filter(c => !cards.includes(c));
const kept = hold.map(i => cards[i]);
const drawsNeeded = 5 - kept.length;
function combos(arr: string[], k: number): string[][] {
if(k === 0) return [[]];
if(arr.length < k) return [];
if(arr.length === k) return [arr];
const [first, ...rest] = arr;
const withFirst = combos(rest, k - 1).map(c => [first, ...c]);
const withoutFirst = combos(rest, k);
return withFirst.concat(withoutFirst);
}
const draws = combos(deck, drawsNeeded);
let total = 0;
for(const d of draws) {
const finalHand = kept.concat(d);
const res = evaluate5(finalHand, paytable);
total += res.payout;
}
return total / draws.length;
}

// Professional Double Double Bonus strategy implementation

function getDoubleDoubleBonusStrategy(cards: string[], paytable: Record<string, number>): {hold: number[], ev: number} {
  const ranks = cards.map(rank);
  const suits = cards.map(suit);
  const rankValues = ranks.map(r => RANK_ORDER[r] || 0);
  
  // Analyze hand composition
  const rankCounts: {[key: string]: number[]} = {};
  ranks.forEach((r, i) => {
    if (!rankCounts[r]) rankCounts[r] = [];
    rankCounts[r].push(i);
  });
  
  const suitCounts: {[key: string]: number[]} = {};
  suits.forEach((s, i) => {
    if (!suitCounts[s]) suitCounts[s] = [];
    suitCounts[s].push(i);
  });
  
  // 1. Four of a kind - already handled above
  
  // 2. Three of a kind - hold the trips
  for (const [rank, positions] of Object.entries(rankCounts)) {
    if (positions.length === 3) {
      return { hold: positions, ev: paytable.THREE_KIND || 3 };
    }
  }
  
  // 3. Two pair - hold both pairs
  const pairs: number[] = [];
  for (const [rank, positions] of Object.entries(rankCounts)) {
    if (positions.length === 2) {
      pairs.push(...positions);
    }
  }
  if (pairs.length === 4) {
    return { hold: pairs, ev: paytable.TWO_PAIR || 1 };
  }
  
  // 4. One pair analysis - critical for Double Double Bonus
  if (pairs.length === 2) {
    const pairRank = ranks[pairs[0]];
    const pairValue = RANK_ORDER[pairRank] || 0;
    
    // High pairs (Jacks through Aces) - always hold
    if (pairValue >= 11) {
      return { hold: pairs, ev: paytable.JacksOrBetter || 1 };
    }
    
    // Low pairs (2-10) in Double Double Bonus
    // Hold low pairs unless we have better draws
    const nonPairCards = [0, 1, 2, 3, 4].filter(i => !pairs.includes(i));
    const nonPairRanks = nonPairCards.map(i => ranks[i]);
    const nonPairValues = nonPairCards.map(i => rankValues[i]);
    
    // Check for 4-card straight flush draw
    const sameSuit = nonPairCards.filter(i => suits[i] === suits[nonPairCards[0]]);
    if (sameSuit.length >= 3) {
      // Potential flush draw worth more than low pair
      const flushCards = [0, 1, 2, 3, 4].filter(i => suits[i] === suits[sameSuit[0]]);
      if (flushCards.length === 4) {
        return { hold: flushCards, ev: 2.3 };
      }
    }
    
    // Hold low pairs if no better draws
    return { hold: pairs, ev: 0.8 };
  }
  
  // 5. No pair - look for draws
  
  // 4-card flush (any suit)
  for (const [suit, positions] of Object.entries(suitCounts)) {
    if (positions.length === 4) {
      return { hold: positions, ev: 2.3 };
    }
  }
  
  // 4-card straight
  const straightHold = findStraightDraw(rankValues, cards);
  if (straightHold.length === 4) {
    return { hold: straightHold, ev: 2.1 };
  }
  
  // 3-card royal flush
  const royalHold = findRoyalDraw(cards);
  if (royalHold.length === 3) {
    return { hold: royalHold, ev: 1.9 };
  }
  
  // 3-card straight flush
  const straightFlushHold = findStraightFlushDraw(cards);
  if (straightFlushHold.length === 3) {
    return { hold: straightFlushHold, ev: 1.7 };
  }
  
  // High cards (J, Q, K, A) - crucial in Double Double Bonus
  const highCards: number[] = [];
  rankValues.forEach((value, i) => {
    if (value >= 11) {
      highCards.push(i);
    }
  });
  
  if (highCards.length >= 2) {
    // Multiple high cards - prefer Aces, then Kings, etc.
    const aces = highCards.filter(i => rankValues[i] === 14);
    if (aces.length > 0) {
      return { hold: aces, ev: 0.5 };
    }
    return { hold: highCards.slice(0, 2), ev: 0.4 };
  }
  
  if (highCards.length === 1) {
    return { hold: highCards, ev: 0.3 };
  }
  
  // Nothing good - draw 5 new cards
  return { hold: [], ev: 0.2 };
}

function getStandardStrategy(cards: string[], paytable: Record<string, number>): {hold: number[], ev: number} {
  // Standard Jacks or Better strategy (simplified)
  const currentHand = evaluate5(cards, paytable);
  
  if (currentHand.payout > 0) {
    // Hold paying hands
    if (currentHand.key === "THREE_KIND") {
      const ranks = cards.map(rank);
      const positions: number[] = [];
      for (let i = 0; i < ranks.length; i++) {
        let count = 0;
        for (let j = 0; j < ranks.length; j++) {
          if (ranks[i] === ranks[j]) count++;
        }
        if (count === 3) positions.push(i);
      }
      return { hold: positions.filter((v, i, a) => a.indexOf(v) === i), ev: currentHand.payout };
    }
    
    if (currentHand.key === "JacksOrBetter") {
      const ranks = cards.map(rank);
      const positions: number[] = [];
      for (let i = 0; i < ranks.length; i++) {
        let count = 0;
        for (let j = 0; j < ranks.length; j++) {
          if (ranks[i] === ranks[j]) count++;
        }
        if (count === 2 && (RANK_ORDER[ranks[i]] || 0) >= 11) positions.push(i);
      }
      return { hold: positions.filter((v, i, a) => a.indexOf(v) === i), ev: currentHand.payout };
    }
  }
  
  // Look for draws
  const suits = cards.map(suit);
  const suitCounts: {[key: string]: number[]} = {};
  suits.forEach((s, i) => {
    if (!suitCounts[s]) suitCounts[s] = [];
    suitCounts[s].push(i);
  });
  
  for (const positions of Object.values(suitCounts)) {
    if (positions.length === 4) {
      return { hold: positions, ev: 2.3 };
    }
  }
  
  // High cards
  const highCards: number[] = [];
  const ranks = cards.map(rank);
  ranks.forEach((r, i) => {
    const value = RANK_ORDER[r] || 0;
    if (value >= 11) {
      highCards.push(i);
    }
  });
  
  if (highCards.length > 0) {
    return { hold: highCards, ev: 0.5 };
  }
  
  return { hold: [], ev: 0.3 };
}

function findStraightDraw(rankValues: number[], cards: string[]): number[] {
  // Look for 4-card straight draws
  const sorted = rankValues.map((val, idx) => ({val, idx})).sort((a, b) => b.val - a.val);
  
  for (let i = 0; i <= sorted.length - 4; i++) {
    let consecutive = [sorted[i]];
    for (let j = i + 1; j < sorted.length && consecutive.length < 4; j++) {
      if (sorted[j].val === consecutive[consecutive.length - 1].val - 1) {
        consecutive.push(sorted[j]);
      }
    }
    if (consecutive.length === 4) {
      return consecutive.map(c => c.idx);
    }
  }
  
  // Check for A-2-3-4 (wheel)
  const hasAce = sorted.some(c => c.val === 14);
  const hasWheel = hasAce && sorted.some(c => c.val === 2) && sorted.some(c => c.val === 3) && sorted.some(c => c.val === 4);
  if (hasWheel) {
    return sorted.filter(c => c.val === 14 || c.val === 2 || c.val === 3 || c.val === 4).map(c => c.idx);
  }
  
  return [];
}

function findRoyalDraw(cards: string[]): number[] {
  const suits = cards.map(suit);
  const ranks = cards.map(rank);
  const royals = ['10', 'J', 'Q', 'K', 'A'];
  
  for (const suitType of ['♠', '♥', '♦', '♣']) {
    const suitedCards = cards.map((card, i) => suits[i] === suitType ? i : -1).filter(i => i >= 0);
    const royalCards = suitedCards.filter(i => royals.includes(ranks[i]));
    if (royalCards.length === 3) {
      return royalCards;
    }
  }
  
  return [];
}

function findStraightFlushDraw(cards: string[]): number[] {
  // Simplified - would need more complex logic for all straight flush draws
  return [];
}

function CardInput({value, onChange}: {value: string, onChange: (v: string)=>void}) {
const [local, setLocal] = useState(value);
function normalize(v: string) {
v = v.trim().toUpperCase()
.replace(/S|♠/g,"♠")
.replace(/H|♥/g,"♥")
.replace(/D|♦/g,"♦")
.replace(/C|♣/g,"♣");
const m = v.match(/^([2-9TJQKA]|10)\s*([♠♥♦♣])$/);
if(m) {
  let rank = m[1];
  if (rank === 'T') rank = '10'; // Convert T to 10
  return rank + m[2];
}
return v;
}
return (
<input
className="w-20 px-3 py-2 rounded-lg border shadow-sm text-center text-lg font-mono"
placeholder="A♠"
value={local}
onChange={(e)=>{
  setLocal(e.target.value); 
  const n = normalize(e.target.value); 
  if(n.length >= 2 && makeDeck().includes(n)) onChange(n);
}}
/>
);
}

function getPlayerStrategyExplanation(cards: string[], playerHold: number[], playerEV: number, game: string): string {
  if (playerHold.length === 0) {
    return "🎲 Drew 5 new cards - discarded entire hand for fresh start.";
  }
  
  if (playerHold.length === 5) {
    const currentHand = evaluate5(cards, PAYTABLES[game]);
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
const currentHand = evaluate5(cards, PAYTABLES[game]);
const heldCards = bestHold.hold.map(i => cards[i]);
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

// Professional Career Statistics Modal Component
function CareerStatsModal({
  isOpen,
  onClose,
  stats,
  onReset,
  theme,
  currentGame,
  onGameChange
}: {
  isOpen: boolean;
  onClose: () => void;
  stats: CareerStats;
  onReset: () => void;
  theme: any;
  currentGame: string;
  onGameChange: (game: string) => void;
}) {
  if (!isOpen) return null;

  const themes = {
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
  
  const currentTheme = themes[theme as keyof typeof themes];
  
  // Game-specific stats
  const gameStats = stats.handsPerGame[currentGame] || { played: 0, correct: 0 };
  const gameAccuracy = gameStats.played > 0 ? (gameStats.correct / gameStats.played * 100) : 0;
  const gameMistakes = stats.mistakesByGame[currentGame] || 0;
  
  // Overall stats
  const overallAccuracy = stats.totalHands > 0 ? (stats.correctDecisions / stats.totalHands * 100) : 0;
  const recentSessions = Object.entries(stats.sessionsByDate)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 7);

  // Calculate advanced statistics
  const daysPlaying = Object.keys(stats.sessionsByDate).length;
  const avgHandsPerSession = daysPlaying > 0 ? Math.round(stats.totalHands / daysPlaying) : 0;
  const mostPlayedGame = Object.entries(stats.handsPerGame)
    .sort(([,a], [,b]) => b.played - a.played)[0];
  const rtpEfficiency = stats.totalRTPLost > 0 ? 
    Math.max(0, 100 - (stats.totalRTPLost / stats.totalHands * 100)) : 100;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <motion.div 
        initial={{opacity: 0}}
        animate={{opacity: 1}}
        exit={{opacity: 0}}
        transition={{duration: 0.3}}
        className="fixed inset-0 bg-black bg-opacity-80"
        onClick={onClose}
      />
      <motion.div 
        initial={{opacity: 0, scale: 0.9}}
        animate={{opacity: 1, scale: 1}}
        exit={{opacity: 0, scale: 0.9}}
        transition={{duration: 0.3}}
        className="relative z-10"
      >
      <div className={`${currentTheme.glassPanel} rounded-3xl p-8 max-w-7xl w-full max-h-[95vh] overflow-y-auto ${currentTheme.shadow} backdrop-blur-3xl`}>
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-8">
          <motion.div
            initial={{x: -20, opacity: 0}}
            animate={{x: 0, opacity: 1}}
            transition={{delay: 0.1}}
          >
            <h3 className={`text-4xl font-black ${currentTheme.text} flex items-center gap-4 mb-2`}>
              <span className="text-5xl">📊</span>
              Professional Career Analytics
            </h3>
            <p className={`text-lg ${currentTheme.textMuted} font-medium`}>
              Comprehensive performance tracking across all poker variants
            </p>
            <div className="mt-3 flex items-center gap-4">
              <label className={`text-sm font-semibold ${currentTheme.text} mr-2`}>Focus Game:</label>
              <select 
                value={currentGame} 
                onChange={e => onGameChange(e.target.value)} 
                className={`${currentTheme.glassPanel} ${currentTheme.text} border rounded-xl px-4 py-2 text-sm font-semibold shadow-md`}
              >
                {Object.keys(PAYTABLES).map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </motion.div>
          <motion.button
            initial={{x: 20, opacity: 0}}
            animate={{x: 0, opacity: 1}}
            transition={{delay: 0.1}}
            onClick={onClose}
            className={`px-6 py-3 rounded-2xl ${currentTheme.text} hover:bg-black/10 transition-all duration-300 font-bold text-lg`}
          >
            <span className="text-3xl">✕</span>
          </motion.button>
        </div>

        {/* Executive Summary Dashboard */}
        <motion.div
          initial={{y: 20, opacity: 0}}
          animate={{y: 0, opacity: 1}}
          transition={{delay: 0.2}}
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
              <div className={`text-xs ${currentTheme.textMuted} mt-1`}>{stats.correctDecisions.toLocaleString()}/{stats.totalHands.toLocaleString()} correct</div>
            </div>
            
            <div className={`${currentTheme.glassPanel} rounded-3xl p-6 text-center transform hover:scale-105 transition-all duration-300 shadow-xl`}>
              <div className="text-4xl mb-2">💎</div>
              <div className={`text-4xl font-black ${rtpEfficiency >= 95 ? 'text-emerald-600' : rtpEfficiency >= 90 ? 'text-green-600' : rtpEfficiency >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                {rtpEfficiency.toFixed(1)}%
              </div>
              <div className={`text-sm ${currentTheme.textMuted} font-bold`}>RTP Efficiency</div>
              <div className={`text-xs ${currentTheme.textMuted} mt-1`}>{stats.totalRTPLost.toFixed(2)}% total lost</div>
            </div>

            <div className={`${currentTheme.glassPanel} rounded-3xl p-6 text-center transform hover:scale-105 transition-all duration-300 shadow-xl`}>
              <div className="text-4xl mb-2">🔥</div>
              <div className={`text-4xl font-black ${stats.bestStreak >= 20 ? 'text-emerald-600' : stats.bestStreak >= 10 ? 'text-green-600' : stats.bestStreak >= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                {stats.bestStreak}
              </div>
              <div className={`text-sm ${currentTheme.textMuted} font-bold`}>Best Streak</div>
              <div className={`text-xs ${currentTheme.textMuted} mt-1`}>Current: {stats.currentStreak}</div>
            </div>

            <div className={`${currentTheme.glassPanel} rounded-3xl p-6 text-center transform hover:scale-105 transition-all duration-300 shadow-xl`}>
              <div className="text-4xl mb-2">📈</div>
              <div className={`text-4xl font-black ${currentTheme.text}`}>{avgHandsPerSession}</div>
              <div className={`text-sm ${currentTheme.textMuted} font-bold`}>Avg Hands/Session</div>
              <div className={`text-xs ${currentTheme.textMuted} mt-1`}>{daysPlaying} sessions total</div>
            </div>
          </div>
        </motion.div>

        {/* Focus Game Deep Dive */}
        <motion.div
          initial={{y: 20, opacity: 0}}
          animate={{y: 0, opacity: 1}}
          transition={{delay: 0.3}}
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
                <div className={`text-6xl mb-2`}>
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

        {/* Comprehensive Game Version Analysis */}
        <motion.div
          initial={{y: 20, opacity: 0}}
          animate={{y: 0, opacity: 1}}
          transition={{delay: 0.4}}
          className="mb-8"
        >
          <h4 className={`text-2xl font-black mb-6 ${currentTheme.text} flex items-center gap-3`}>
            <span className="text-3xl">🃏</span>
            Multi-Game Performance Mastery
          </h4>
          
          {Object.entries(stats.handsPerGame).length === 0 ? (
            <div className={`${currentTheme.glassPanel} rounded-3xl p-12 text-center`}>
              <div className="text-6xl mb-4">🎯</div>
              <div className={`text-xl font-bold ${currentTheme.text} mb-2`}>Ready to Track Your Journey</div>
              <div className={`text-lg ${currentTheme.textMuted}`}>Start playing to see detailed performance analytics across all poker variants!</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(stats.handsPerGame)
                .sort(([,a], [,b]) => b.played - a.played) // Sort by most played
                .map(([gameName, gameStats]) => {
                  const accuracy = gameStats.played > 0 ? (gameStats.correct / gameStats.played * 100) : 0;
                  const mistakes = stats.mistakesByGame[gameName] || 0;
                  const skillLevel = accuracy >= 95 ? 'Expert' : accuracy >= 85 ? 'Advanced' : accuracy >= 75 ? 'Intermediate' : accuracy >= 65 ? 'Learning' : 'Beginner';
                  const skillEmoji = accuracy >= 95 ? '🥇' : accuracy >= 85 ? '🥈' : accuracy >= 75 ? '🥉' : accuracy >= 65 ? '📚' : '🎯';
                  const isFavorite = mostPlayedGame && mostPlayedGame[0] === gameName;

                  return (
                    <motion.div 
                      key={gameName} 
                      whileHover={{scale: 1.02}}
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
                            <div className={`text-xs ${currentTheme.textMuted} font-semibold mt-1`}>Grade</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-1000 ${accuracy >= 85 ? 'bg-emerald-600' : accuracy >= 75 ? 'bg-green-600' : accuracy >= 65 ? 'bg-yellow-600' : 'bg-red-600'}`}
                            style={{width: `${Math.min(accuracy, 100)}%`}}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          )}
        </motion.div>

        {/* Mistake Analysis */}
        <div className="mb-6">
          <h4 className={`text-xl font-bold mb-4 ${currentTheme.text}`}>⚠️ Mistake Breakdown</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {Object.entries(stats.mistakesBySeverity).map(([severity, count]) => {
              const color = severity === "Excellent" ? "text-green-600" :
                           severity === "Minor mistake" ? "text-yellow-600" :
                           severity === "Moderate mistake" ? "text-orange-600" :
                           severity === "Major mistake" ? "text-red-600" : "text-red-800";
              return (
                <div key={severity} className={`${currentTheme.glassPanel} rounded-xl p-3 text-center`}>
                  <div className={`text-2xl font-bold ${color}`}>{count}</div>
                  <div className={`text-xs ${currentTheme.textMuted} font-medium`}>{severity}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Sessions */}
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

        {/* Action Buttons */}
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

function FullDeckPicker({
  isOpen,
  onClose,
  onSelectCards,
  selectedCards,
  setSelectedCards
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectCards: (cards: string[]) => void;
  selectedCards: string[];
  setSelectedCards: (cards: string[]) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-[9998] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-6xl w-full max-h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">🃏 Select Your 5-Card Hand</h3>
          <div className="text-xl font-medium text-blue-600">
            Selected: {selectedCards.length}/5
          </div>
        </div>

        {/* Selected Cards Preview */}
        {selectedCards.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium mb-3">Your Selected Hand:</h4>
            <div className="flex gap-3 justify-center">
              {selectedCards.map(card => {
                const cardRank = rank(card);
                const cardSuit = suit(card);
                const colorClass = getCardColor(cardSuit);
                return (
                  <div key={card} className="w-16 h-22 bg-white border-2 border-blue-500 rounded-lg text-base flex flex-col items-center justify-center shadow-lg">
                    <div className={`${colorClass} font-bold text-lg`}>{cardRank}</div>
                    <div className={`${colorClass} text-2xl`}>{cardSuit}</div>
                  </div>
                );
              })}
              {/* Empty slots */}
              {Array(5 - selectedCards.length).fill(0).map((_, i) => (
                <div key={`empty-${i}`} className="w-16 h-22 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
                  <span className="text-3xl">?</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full Deck by Suits */}
        <div className="space-y-4">
          {SUITS.map(suitType => (
            <div key={suitType} className="border-2 rounded-lg p-4">
              <div className={`text-center text-2xl mb-3 font-bold ${getCardColor(suitType)}`}>
                {suitType === "♠" ? "♠ Spades" : 
                 suitType === "♥" ? "♥ Hearts" : 
                 suitType === "♦" ? "♦ Diamonds" : "♣ Clubs"}
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                {RANKS.map(rankType => {
                  const cardCode = rankType + suitType;
                  const isSelected = selectedCards.includes(cardCode);
                  const colorClass = getCardColor(suitType);
                  return (
                    <button
                      key={cardCode}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedCards(selectedCards.filter(c => c !== cardCode));
                        } else if (selectedCards.length < 5) {
                          setSelectedCards([...selectedCards, cardCode]);
                        }
                      }}
                      disabled={!isSelected && selectedCards.length >= 5}
                      className={`w-16 h-22 rounded-lg border-2 transition-all font-bold text-base flex flex-col items-center justify-center shadow-sm ${
                        isSelected 
                          ? "border-blue-500 bg-blue-100 shadow-lg transform scale-110" 
                          : selectedCards.length >= 5
                          ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                          : `border-gray-300 bg-white hover:border-blue-400 hover:shadow-lg hover:scale-105 ${colorClass}`
                      }`}
                    >
                      <div className="text-lg font-bold">{rankType}</div>
                      <div className="text-2xl">{suitType}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-6 pt-4 border-t bg-white sticky bottom-0">
          <button 
            onClick={() => {
              if (selectedCards.length === 5) {
                onSelectCards([...selectedCards]);
                setSelectedCards([]);
                onClose();
              }
            }}
            disabled={selectedCards.length !== 5}
            className={`px-8 py-3 rounded-lg font-bold text-lg ${
              selectedCards.length === 5 
                ? "bg-green-600 text-white hover:bg-green-700 shadow-lg" 
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            ✅ Analyze This Hand
          </button>
          <button 
            onClick={() => {
              setSelectedCards([]);
              onClose();
            }}
            className="px-6 py-3 rounded-lg bg-gray-600 text-white hover:bg-gray-700"
          >
            Cancel
          </button>
          <button 
            onClick={() => setSelectedCards([])}
            className="px-4 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            Clear All ({selectedCards.length})
          </button>
        </div>
      </div>
    </div>
  );
}

function getAllStrategyOptions(cards: string[], paytable: Record<string, number>, game: string): {hold: number[], ev: number, description: string}[] {
  const options: {hold: number[], ev: number, description: string}[] = [];
  
  // Calculate EV for common strategic options
  const commonOptions = [
    { hold: [], desc: "Draw 5 new cards" },
    { hold: [0, 1, 2, 3, 4], desc: "Keep all cards" },
    { hold: [0], desc: "Keep only first card" },
    { hold: [1], desc: "Keep only second card" },
    { hold: [2], desc: "Keep only third card" },
    { hold: [3], desc: "Keep only fourth card" },
    { hold: [4], desc: "Keep only fifth card" },
    { hold: [0, 1], desc: "Keep first two cards" },
    { hold: [0, 2], desc: "Keep first and third cards" },
    { hold: [1, 2], desc: "Keep second and third cards" },
    { hold: [2, 3], desc: "Keep third and fourth cards" },
    { hold: [3, 4], desc: "Keep last two cards" },
  ];
  
  const ranks = cards.map(rank);
  const suits = cards.map(suit);
  
  // Add pair-specific options
  for (let i = 0; i < ranks.length; i++) {
    for (let j = i + 1; j < ranks.length; j++) {
      if (ranks[i] === ranks[j]) {
        options.push({
          hold: [i, j],
          ev: calculateSimpleEV([i, j], cards, paytable),
          description: `Keep pair of ${ranks[i]}s`
        });
      }
    }
  }
  
  // Add high card options
  const highCardIndices: number[] = [];
  ranks.forEach((r, i) => {
    if (['J', 'Q', 'K', 'A'].includes(r)) {
      highCardIndices.push(i);
      options.push({
        hold: [i],
        ev: calculateSimpleEV([i], cards, paytable),
        description: `Keep ${r} (high card)`
      });
    }
  });
  
  // Add suited combinations for flush draws
  for (const suitType of ['♠', '♥', '♦', '♣']) {
    const suitedCards = cards.map((card, i) => suits[i] === suitType ? i : -1).filter(i => i >= 0);
    if (suitedCards.length >= 4) {
      options.push({
        hold: suitedCards,
        ev: calculateSimpleEV(suitedCards, cards, paytable),
        description: `Keep 4-card ${suitType} flush draw`
      });
    }
  }
  
  // Add basic options
  options.push({
    hold: [],
    ev: calculateSimpleEV([], cards, paytable),
    description: "Draw 5 new cards"
  });
  
  options.push({
    hold: [0, 1, 2, 3, 4],
    ev: calculateSimpleEV([0, 1, 2, 3, 4], cards, paytable),
    description: "Keep all 5 cards (pat hand)"
  });
  
  // Sort by EV and return top options
  return options
    .sort((a, b) => b.ev - a.ev)
    .filter((option, index, arr) => {
      // Remove duplicates
      return !arr.slice(0, index).some(prev => 
        prev.hold.length === option.hold.length && 
        prev.hold.every(x => option.hold.includes(x))
      );
    })
    .slice(0, 4); // Top 4 options
}

function calculateSimpleEV(hold: number[], cards: string[], paytable: Record<string, number>): number {
  // Simplified EV calculation for comparison
  if (hold.length === 5) {
    return evaluate5(cards, paytable).payout;
  }
  
  if (hold.length === 0) {
    return 0.3; // Baseline for drawing 5
  }
  
  const heldCards = hold.map(i => cards[i]);
  const heldRanks = heldCards.map(rank);
  const heldSuits = heldCards.map(suit);
  
  // Check for pairs
  const rankCounts: {[key: string]: number} = {};
  heldRanks.forEach(r => rankCounts[r] = (rankCounts[r] || 0) + 1);
  
  const pairs = Object.entries(rankCounts).filter(([rank, count]) => count === 2);
  const trips = Object.entries(rankCounts).filter(([rank, count]) => count === 3);
  
  if (trips.length > 0) {
    return 3.5; // Three of a kind
  }
  
  if (pairs.length > 0) {
    const pairRank = pairs[0][0];
    const pairValue = RANK_ORDER[pairRank] || 0;
    if (pairValue >= 11) {
      return 1.4; // High pair
    } else {
      return 0.9; // Low pair
    }
  }
  
  // Check for flush draws
  if (new Set(heldSuits).size === 1 && heldCards.length === 4) {
    return 2.3; // 4-card flush
  }
  
  // High cards
  const highCards = heldCards.filter(c => ['J', 'Q', 'K', 'A'].includes(rank(c)));
  if (highCards.length > 0) {
    return 0.4 * highCards.length;
  }
  
  return 0.2; // Nothing special
}

function calculateMistakeSeverity(playerHold: number[], optimalHold: {hold: number[], ev: number}, cards: string[], paytable: Record<string, number>): {playerEV: number, optimalEV: number, difference: number, severity: string, color: string, severityDescription: string} {
  // Calculate player's expected value - use simplified but reliable calculation
  let playerEV = 0;
  
  if (playerHold.length === 5) {
    // Holding all cards - get current hand value
    playerEV = evaluate5(cards, paytable).payout;
  } else if (playerHold.length === 0) {
    // Drawing all 5 - very rough approximation
    playerEV = 0.2;
  } else {
    // Try to use expectedValue function, but with better error handling
    try {
      playerEV = expectedValue(cards, playerHold, paytable);
    } catch (error) {
      // Fallback to simplified calculation
      const heldCards = playerHold.map(i => cards[i]);
      const heldRanks = heldCards.map(rank);
      const heldSuits = heldCards.map(suit);
      
      // Check for pairs in held cards
      const rankCounts: {[key: string]: number} = {};
      heldRanks.forEach(r => rankCounts[r] = (rankCounts[r] || 0) + 1);
      
      const pairs = Object.entries(rankCounts).filter(([rank, count]) => count === 2);
      const trips = Object.entries(rankCounts).filter(([rank, count]) => count === 3);
      
      if (trips.length > 0) {
        playerEV = 3; // Three of a kind base
      } else if (pairs.length > 0) {
        const pairRank = pairs[0][0];
        const pairValue = RANK_ORDER[pairRank] || 0;
        if (pairValue >= 11) {
          playerEV = 1; // Jacks or better
        } else {
          playerEV = 0.8; // Low pair
        }
      } else if (new Set(heldSuits).size === 1 && heldCards.length === 4) {
        playerEV = 2.3; // 4-card flush
      } else if (heldCards.some(c => ['J', 'Q', 'K', 'A'].includes(rank(c)))) {
        playerEV = 0.3 * heldCards.filter(c => ['J', 'Q', 'K', 'A'].includes(rank(c))).length;
      } else {
        playerEV = 0.2; // Nothing good
      }
    }
  }
  
  // If optimal EV is 0 or very small, there's a problem with the calculation
  if (optimalHold.ev <= 0.01) {
    console.warn('Optimal EV is suspiciously low:', optimalHold.ev);
    // Try to recalculate using expectedValue
    try {
      const recalculatedOptimalEV = expectedValue(cards, optimalHold.hold, paytable);
      console.log('Recalculated optimal EV:', recalculatedOptimalEV);
      if (recalculatedOptimalEV > optimalHold.ev) {
        optimalHold.ev = recalculatedOptimalEV;
      }
    } catch (error) {
      console.warn('Failed to recalculate optimal EV:', error);
    }
  }
  
  // Calculate difference after potential EV correction
  const difference = optimalHold.ev - playerEV;
  
  // Debug logging
  console.log('Mistake severity calculation:', {
    playerHold,
    optimalHold,
    playerEV,
    optimalEV: optimalHold.ev,
    difference,
    cards
  });
  
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
    optimalEV: optimalHold.ev,
    difference,
    severity,
    color,
    severityDescription
  };
}


export default function App() {
const [mode, setMode] = useState<"training" | "analysis">("training");
const [theme, setTheme] = useState<"light" | "dark" | "casino">("light");
const [cards, setCards] = useState<string[]>(() => getRandomHand());
const [game, setGame] = useState(() => loadGameVariant());
const [playerHold, setPlayerHold] = useState<number[]>([]);
const [score, setScore] = useState({played:0, correct:0});
const [history, setHistory] = useState<any[]>([]);
const [showFullDeckPicker, setShowFullDeckPicker] = useState(false);
const [tempSelectedCards, setTempSelectedCards] = useState<string[]>([]);
const [showHandAnalysis, setShowHandAnalysis] = useState(false);
const [careerStats, setCareerStats] = useState<CareerStats>(() => loadCareerStats());
const [showCareerStats, setShowCareerStats] = useState(false);

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
setCards(getRandomHand());
setPlayerHold([]);
setShowHandAnalysis(false); // Hide analysis for new hand
}

const best = useMemo(() => {
try {
// Professional Double Double Bonus strategy
const currentHand = evaluate5(cards, paytable);
  
// Always hold made hands with good payouts
if (currentHand.key === "ROYAL" || currentHand.key === "STRAIGHT_FLUSH" || 
    currentHand.key === "FOUR_KIND" || currentHand.key === "FULL_HOUSE" || 
    currentHand.key === "FLUSH" || currentHand.key === "STRAIGHT") {
  return { hold: [0, 1, 2, 3, 4], ev: currentHand.payout };
}

// For games with bonus payouts, use sophisticated analysis
if (game === "Double Double Bonus") {
  return getDoubleDoubleBonusStrategy(cards, paytable);
}

// Professional strategy for other games
return getStandardStrategy(cards, paytable);
} catch (error) {
return { hold: [], ev: 0 };
}
}, [cards, paytable, game]);

function toggleHold(i:number) {
if(playerHold.includes(i)) setPlayerHold(ph => ph.filter(x=>x!==i));
else setPlayerHold(ph => [...ph,i]);
}

function submitHold() {
try {
// Check if player's hold matches the optimal hold
const playerSorted = playerHold.slice().sort();
const bestSorted = best.hold.slice().sort();
const correct = playerSorted.length === bestSorted.length && 
               playerSorted.every((x, i) => x === bestSorted[i]);

// Calculate mistake cost for career stats
let mistakeCost = 0;
let severity = "Excellent";
if (!correct) {
  const mistake = calculateMistakeSeverity(playerHold, best, cards, paytable);
  mistakeCost = mistake.difference * 100; // Convert to percentage
  severity = mistake.severity;
}

setScore(s => ({played: s.played+1, correct: s.correct + (correct?1:0)}));
setHistory(h => [{cards, playerHold, bestHold: best.hold, correct}, ...h.slice(0,9)]);

// Update and save career stats
const updatedStats = updateCareerStats(careerStats, correct, game, mistakeCost, severity);
setCareerStats(updatedStats);
saveCareerStats(updatedStats);

setShowHandAnalysis(false); // Hide analysis for new hand
dealRandom();
} catch (error) {
// Handle error silently
}
}

function resetCareerStats() {
const newStats = getDefaultCareerStats();
setCareerStats(newStats);
saveCareerStats(newStats);
setShowCareerStats(false);
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
{(["light", "dark", "casino"] as const).map(themeOption => (
<motion.button
  key={themeOption}
  onClick={() => setTheme(themeOption)}
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  className={`px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-xl font-semibold transition-all duration-300 ${
    theme === themeOption
      ? themeOption === "light" ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg ring-2 ring-blue-400/50" :
        themeOption === "dark" ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg ring-2 ring-purple-400/50" :
        "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg ring-2 ring-amber-400/50"
      : `${currentTheme.glassPanel} ${currentTheme.text} hover:shadow-md border border-slate-200/30`
  }`}
>
  <span className="text-lg mr-2">
    {themeOption === "light" ? "☀️" : 
     themeOption === "dark" ? "🌙" : "🎰"}
  </span>
  {themeOption === "light" ? "Light" : 
   themeOption === "dark" ? "Dark" : "Casino"}
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
<div>
{/* Training Mode Content */}


<div className={`${currentTheme.glassPanel} rounded-2xl p-8 mb-8 ${currentTheme.shadow}`}>
<label className={`mr-3 font-bold text-lg ${currentTheme.text}`}>Game Variant:</label>
<select value={game} onChange={e=>handleGameChange(e.target.value)} className={`${currentTheme.panel} ${currentTheme.text} border rounded-lg px-4 py-2 font-medium ${currentTheme.border}`}>
{Object.keys(PAYTABLES).map(g => <option key={g} value={g}>{g}</option>)}
</select>
</div>

<div className="grid grid-cols-5 gap-4 mb-6">
{cards.map((c,i) => {
const cardRank = rank(c);
const cardSuit = suit(c);
const colorClass = getCardColor(cardSuit);
return (
<div key={i} className="flex flex-col items-center gap-2">
<div className="text-sm text-gray-500">Card {i+1}</div>
<button onClick={()=>toggleHold(i)} className={`relative w-16 h-24 rounded-xl border-2 ${currentTheme.cardBg} ${currentTheme.shadow} transition-all duration-300 hover:shadow-2xl hover:scale-105 ${playerHold.includes(i)?"border-green-500 bg-green-100":"border-gray-300 hover:border-blue-400"}`}>
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

<div className="flex gap-4 mb-8">
<button onClick={dealRandom} className={`px-6 py-3 rounded-xl text-white font-bold transition-all duration-300 hover:scale-105 ${currentTheme.secondaryBtn} ${currentTheme.shadow}`}>🎲 Deal Random</button>
<button onClick={submitHold} className={`px-6 py-3 rounded-xl text-white font-bold transition-all duration-300 hover:scale-105 ${currentTheme.primaryBtn} ${currentTheme.shadow}`}>✅ Submit Hold</button>
</div>

<div className={`${currentTheme.glassPanel} rounded-2xl p-6 mb-8 ${currentTheme.shadow}`}>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Current Session */}
    <div>
      <div className={`text-xl font-bold ${currentTheme.text} mb-2`}>🎮 Current Session</div>
      <div className={`text-2xl font-bold ${score.played > 0 && score.correct/score.played >= 0.8 ? 'text-green-600' : score.played > 0 && score.correct/score.played >= 0.6 ? 'text-yellow-600' : 'text-slate-600'}`}>
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

{/* Hand Analysis in Training Mode - Collapsible */}
<motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className={`${currentTheme.panel} rounded-2xl ${currentTheme.shadow} ${currentTheme.border} border mb-6 overflow-hidden`}>
<button
  onClick={() => setShowHandAnalysis(!showHandAnalysis)}
  className={`w-full p-6 text-left transition-all duration-300 hover:bg-black/5 ${currentTheme.text} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset`}
>
  <div className="flex items-center justify-between">
    <h3 className="text-xl font-bold flex items-center gap-3">
      <span className="text-2xl">💡</span>
      Current Hand Analysis
    </h3>
    <motion.div
      animate={{ rotate: showHandAnalysis ? 180 : 0 }}
      transition={{ duration: 0.3 }}
      className={`text-xl ${currentTheme.textMuted}`}
    >
      ↓
    </motion.div>
  </div>
  <p className={`text-sm mt-2 ${currentTheme.textMuted} font-medium`}>
    {showHandAnalysis ? 'Hide detailed strategy analysis' : 'Click to view optimal strategy and alternatives'}
  </p>
</button>

{showHandAnalysis && (
  <motion.div 
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: 'auto' }}
    exit={{ opacity: 0, height: 0 }}
    transition={{ duration: 0.4, ease: 'easeInOut' }}
    className="px-6 pb-6"
  >
    {/* Strategy Options Comparison */}
    {(() => {
const allOptions = getAllStrategyOptions(cards, paytable, game);
const optimalOption = allOptions[0];
return (
<div className="space-y-3">
{/* Optimal Choice */}
<div className="bg-green-100 border border-green-300 rounded-lg p-3">
<div className="flex items-center justify-between mb-2">
<span className="font-bold text-green-800">🏆 OPTIMAL CHOICE</span>
<span className="text-green-700 font-medium">RTP: {(optimalOption.ev * 100).toFixed(1)}%</span>
</div>
<div className="text-green-700">
<div className="mb-1">
<strong>Hold:</strong> {optimalOption.hold.length > 0 ? optimalOption.hold.map(i => cards[i]).join(", ") : "None (Draw 5)"}
</div>
<div className="text-sm">
<strong>Why:</strong> {getStrategyExplanation(cards, best, game)}
</div>
</div>
</div>

{/* Alternative Options */}
{allOptions.slice(1, 3).map((option, idx) => {
const difference = optimalOption.ev - option.ev;
let severityColor = difference <= 0.1 ? "yellow" : difference <= 0.5 ? "orange" : "red";
return (
<div key={idx} className={`bg-${severityColor}-50 border border-${severityColor}-200 rounded-lg p-3`}>
<div className="flex items-center justify-between mb-2">
<span className={`font-medium text-${severityColor}-800`}>#{idx + 2} Alternative</span>
<div className="text-right text-sm">
<div className={`text-${severityColor}-700 font-medium`}>RTP: {(option.ev * 100).toFixed(1)}%</div>
<div className={`text-${severityColor}-600 text-xs`}>Cost: -{(difference * 100).toFixed(1)}%</div>
</div>
</div>
<div className={`text-${severityColor}-700 text-sm`}>
<strong>Hold:</strong> {option.hold.length > 0 ? option.hold.map(i => cards[i]).join(", ") : "None"} - {option.description}
</div>
</div>
);
})}
</div>
);
})()}
  </motion.div>
)}
</motion.div>

<motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className={`${currentTheme.glassPanel} rounded-3xl ${currentTheme.shadow} p-8`}>
<div className={`text-xl font-bold mb-4 ${currentTheme.text}`}>🎯 Recent Hands</div>
{history.length === 0 && <div className={`${currentTheme.textMuted} text-sm`}>No hands yet.</div>}
{history.map((h, idx) => {
// Recalculate optimal strategy for this historical hand to get correct EV
const historicalOptimal = useMemo(() => {
  try {
    const currentHand = evaluate5(h.cards, paytable);
    
    // Always hold made hands with good payouts
    if (currentHand.key === "ROYAL" || currentHand.key === "STRAIGHT_FLUSH" || 
        currentHand.key === "FOUR_KIND" || currentHand.key === "FULL_HOUSE" || 
        currentHand.key === "FLUSH" || currentHand.key === "STRAIGHT") {
      return { hold: [0, 1, 2, 3, 4], ev: currentHand.payout };
    }
    
    // Get the optimal hold using strategy engine - use its EV directly
    if (game === "Double Double Bonus") {
      return getDoubleDoubleBonusStrategy(h.cards, paytable);
    } else {
      return getStandardStrategy(h.cards, paytable);
    }
  } catch (error) {
    return { hold: [], ev: 0 };
  }
}, [h.cards, paytable, game]);

// Calculate mistake info for this historical hand
const mistake = calculateMistakeSeverity(h.playerHold, historicalOptimal, h.cards, paytable);



// Get hand analysis for both player's choice and optimal choice
const playerAnalysis = getPlayerStrategyExplanation(h.cards, h.playerHold, mistake.playerEV, game);
const optimalAnalysis = getStrategyExplanation(h.cards, historicalOptimal, game);

return (
<motion.div 
  key={idx} 
  initial={{opacity: 0, y: 10}}
  animate={{opacity: 1, y: 0}}
  transition={{duration: 0.3, delay: idx * 0.1}}
  className={`mb-4 p-4 rounded-2xl border transition-all duration-300 ${
    h.correct 
      ? `${currentTheme.glassPanel} border-green-500/30 bg-gradient-to-r from-green-50/50 to-emerald-50/50`
      : `${currentTheme.glassPanel} border-red-500/30 bg-gradient-to-r from-red-50/50 to-rose-50/50`
  }`}
>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Hand Information */}
  <div>
    <div className={`font-semibold text-lg mb-2 ${currentTheme.text}`}>
      Cards: {h.cards.join(", ")}
    </div>
    <div className={`mb-3 ${currentTheme.textMuted}`}>
      <div><strong>Your Hold:</strong> {h.playerHold.length > 0 ? h.playerHold.map((i: number)=>h.cards[i]).join(", ") : "None"}</div>
      <div><strong>Optimal:</strong> {historicalOptimal.hold.length > 0 ? historicalOptimal.hold.map((i: number)=>h.cards[i]).join(", ") : "None"}</div>
    </div>
    
    {/* Performance Metrics */}
    <div className="flex items-center gap-4 mb-3">
      <span className={h.correct ? "text-green-600 font-bold text-lg" : "text-red-600 font-bold text-lg"}>
        {h.correct ? "✅ Correct" : "❌ Incorrect"}
      </span>
      <div className="flex gap-4 text-sm">
        <span className={currentTheme.textMuted}>Your RTP: <span className="font-semibold">{(mistake.playerEV * 100).toFixed(1)}%</span></span>
        <span className={currentTheme.textMuted}>Optimal RTP: <span className="font-semibold">{(mistake.optimalEV * 100).toFixed(1)}%</span></span>
        <span className={`font-semibold ${mistake.color}`}>
          Cost: {h.correct ? `+${(mistake.difference * 100).toFixed(1)}%` : `-${(mistake.difference * 100).toFixed(1)}%`} ({mistake.severity})
        </span>
      </div>
      
      {/* Detailed Mistake Analysis */}
      {!h.correct && (
        <div className={`mt-3 p-3 rounded-lg border-l-4 ${mistake.color.replace('text-', 'border-l-')} bg-gray-50`}>
          <div className={`font-medium text-sm ${mistake.color} mb-1`}>
            📝 Mistake Analysis: {mistake.severity}
          </div>
          <div className="text-sm text-gray-700">
            {mistake.severityDescription}
          </div>
        </div>
      )}
      </div>
    </div>
  </div>

  {/* Hand Analysis */}
  <div className="space-y-3">
    {!h.correct && (
      <div className={`p-3 rounded-xl ${currentTheme.glassPanel} border border-red-200/50`}>
        <div className={`font-medium text-red-700 mb-1`}>👤 Your Strategy:</div>
        <div className={`text-sm ${currentTheme.textMuted}`}>{playerAnalysis}</div>
      </div>
    )}
    <div className={`p-3 rounded-xl ${currentTheme.glassPanel} border border-green-200/50`}>
      <div className={`font-medium text-green-700 mb-1`}>🎯 Optimal Strategy:</div>
      <div className={`text-sm ${currentTheme.textMuted}`}>{optimalAnalysis}</div>
    </div>
  </div>
</div>
</motion.div>
);
})}
</motion.div>

</div>
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
<div className="grid grid-cols-5 gap-4 mb-6">
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
/>




{/* Analysis Results */}
<motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="bg-white rounded-2xl shadow p-6">
<h3 className="text-xl font-bold mb-4">📊 Strategy Analysis</h3>

{/* Current Hand Display */}
<div className="mb-6">
<h4 className="font-semibold mb-3">Your Hand:</h4>
<div className="flex gap-3 justify-center mb-4">
{cards.map((c,i) => {
const cardRank = rank(c);
const cardSuit = suit(c);
const colorClass = getCardColor(cardSuit);
const isHeld = best.hold.includes(i);
return (
<div key={i} className={`relative w-14 h-20 rounded-lg border-2 bg-white shadow-md ${isHeld ? "border-green-500 bg-green-50" : "border-gray-300"}`}>
<div className={`flex flex-col items-center justify-center h-full ${colorClass}`}>
<div className="text-base font-bold">{cardRank}</div>
<div className="text-lg">{cardSuit}</div>
</div>
{isHeld && (
<div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-1 py-0.5 rounded font-bold">
HOLD
</div>
)}
</div>
);
})}
</div>
</div>

{/* Strategy Options Comparison */}
<div className="bg-blue-50 rounded-lg p-4 mb-4">
<h4 className="font-semibold text-blue-800 mb-3">💡 Strategy Analysis & Options</h4>
{(() => {
const allOptions = getAllStrategyOptions(cards, paytable, game);
const optimalOption = allOptions[0];
return (
<div className="space-y-3">
{/* Optimal Choice */}
<div className="bg-green-100 border border-green-300 rounded-lg p-3">
<div className="flex items-center justify-between mb-2">
<span className="font-bold text-green-800">🏆 OPTIMAL CHOICE</span>
<span className="text-green-700 font-medium">RTP: {(optimalOption.ev * 100).toFixed(1)}%</span>
</div>
<div className="text-green-700">
<div className="mb-1">
<strong>Hold:</strong> {optimalOption.hold.length > 0 ? optimalOption.hold.map(i => cards[i]).join(", ") : "None (Draw 5)"}
</div>
<div className="text-sm">
<strong>Why:</strong> {getStrategyExplanation(cards, best, game)}
</div>
</div>
</div>

{/* Alternative Options */}
{allOptions.slice(1, 3).map((option, idx) => {
const difference = optimalOption.ev - option.ev;
let severityColor = difference <= 0.1 ? "yellow" : difference <= 0.5 ? "orange" : "red";
return (
<div key={idx} className={`bg-${severityColor}-50 border border-${severityColor}-200 rounded-lg p-3`}>
<div className="flex items-center justify-between mb-2">
<span className={`font-medium text-${severityColor}-800`}>#{idx + 2} Alternative</span>
<div className="text-right text-sm">
<div className={`text-${severityColor}-700 font-medium`}>RTP: {(option.ev * 100).toFixed(1)}%</div>
<div className={`text-${severityColor}-600 text-xs`}>Cost: -{(difference * 100).toFixed(1)}%</div>
</div>
</div>
<div className={`text-${severityColor}-700 text-sm`}>
<strong>Hold:</strong> {option.hold.length > 0 ? option.hold.map(i => cards[i]).join(", ") : "None"} - {option.description}
</div>
</div>
);
})}

{/* Detailed Strategic Reasoning */}
<div className="bg-gray-50 rounded-lg p-3 mt-3">
<h5 className="font-semibold text-gray-800 mb-2">📋 Strategic Reasoning:</h5>
<div className="text-sm text-gray-700 space-y-1">
{(() => {
  const currentHand = evaluate5(cards, paytable);
  const ranks = cards.map(rank);
  const suits = cards.map(suit);
  
  if (currentHand.payout > 0) {
    return (
      <div>
        <div>• <strong>Current Hand:</strong> {currentHand.name} (pays {currentHand.payout}x)</div>
        <div>• <strong>Decision:</strong> Hold paying hand - guaranteed return beats any draw</div>
        <div>• <strong>Risk:</strong> Zero risk vs. uncertain improvement from draws</div>
      </div>
    );
  }
  
  // Check for draws
  const suitCounts: {[key: string]: number} = {};
  suits.forEach(s => suitCounts[s] = (suitCounts[s] || 0) + 1);
  const flushDraw = Object.values(suitCounts).some(count => count === 4);
  
  const pairs: number[] = [];
  const rankCounts: {[key: string]: number[]} = {};
  ranks.forEach((r, i) => {
    if (!rankCounts[r]) rankCounts[r] = [];
    rankCounts[r].push(i);
  });
  
  for (const positions of Object.values(rankCounts)) {
    if (positions.length === 2) {
      pairs.push(...positions);
      break;
    }
  }
  
  const highCards = [0,1,2,3,4].filter(i => ['J', 'Q', 'K', 'A'].includes(ranks[i]));
  
  if (flushDraw) {
    return (
      <div>
        <div>• <strong>4-Card Flush Draw:</strong> 9 cards complete flush (19% chance)</div>
        <div>• <strong>Why Better:</strong> Flush pays {paytable.FLUSH}x, much higher than pair attempts</div>
        <div>• <strong>Math:</strong> 9/47 × {paytable.FLUSH} = {((9/47 * paytable.FLUSH) * 100).toFixed(1)}% RTP vs {((1/47) * 100).toFixed(1)}% for random pair</div>
      </div>
    );
  } else if (pairs.length === 2) {
    const pairRank = ranks[pairs[0]];
    const isHighPair = ['J', 'Q', 'K', 'A'].includes(pairRank);
    return (
      <div>
        <div>• <strong>Pair Strategy:</strong> {pairRank} pair {isHighPair ? "(high)" : "(low)"}</div>
        <div>• <strong>Improvement Odds:</strong> ~11% for trips, ~16% for two pair or better</div>
        <div>• <strong>Why Hold:</strong> {isHighPair ? "Immediate 1x payout + improvement potential" : "No immediate payout but 27% improvement chance"}</div>
      </div>
    );
  } else if (highCards.length > 0) {
    return (
      <div>
        <div>• <strong>High Cards:</strong> {highCards.map(i => ranks[i]).join(", ")} give pair potential</div>
        <div>• <strong>Pair Odds:</strong> ~13% chance per high card to pair up</div>
        <div>• <strong>Strategy:</strong> {game.includes("Double") ? "In bonus games, Aces are especially valuable for jackpot potential" : "Any J+ pair pays 1-for-1"}</div>
      </div>
    );
  } else {
    return (
      <div>
        <div>• <strong>No Draws Found:</strong> Hand has no profitable holding patterns</div>
        <div>• <strong>Best Option:</strong> Draw 5 fresh cards for maximum potential</div>
        <div>• <strong>RTP:</strong> ~30% return from random 5-card hands</div>
      </div>
    );
  }
})()}
</div>
</div>
</div>
);
})()}
</div>

{/* Interactive Hold Testing */}
<div className="bg-yellow-50 rounded-lg p-4 mb-4">
<h4 className="font-semibold text-yellow-800 mb-3">🧪 Test Your Hold vs Optimal</h4>
<div className="mb-3">
<p className="text-sm text-yellow-700 mb-2">Click cards below to test different hold strategies:</p>
<div className="flex gap-2 flex-wrap">
{cards.map((c, i) => {
const cardRank = rank(c);
const cardSuit = suit(c);
const colorClass = getCardColor(cardSuit);
const isHeld = playerHold.includes(i);
return (
<button
  key={i}
  onClick={() => {
    if (isHeld) {
      setPlayerHold(ph => ph.filter(x => x !== i));
    } else {
      setPlayerHold(ph => [...ph, i]);
    }
  }}
  className={`w-12 h-16 rounded border-2 transition-all text-xs ${
    isHeld 
      ? "border-purple-500 bg-purple-50" 
      : "border-gray-300 bg-white hover:border-purple-300"
  }`}
>
<div className={`${colorClass}`}>
<div className="font-bold">{cardRank}</div>
<div>{cardSuit}</div>
</div>
{isHeld && <div className="text-purple-600 text-xs font-bold">HOLD</div>}
</button>
);
})}
</div>
<button 
  onClick={() => setPlayerHold([])}
  className="mt-2 px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
>
Clear Holds
</button>
</div>

{/* Comparison Results */}
{playerHold.length > 0 && (
<div className="border-t pt-3">
{(() => {
const comparison = calculateMistakeSeverity(playerHold, best, cards, paytable);
return (
<div className="grid grid-cols-2 gap-4 text-sm">
<div className="space-y-1">
<div><strong>Your Hold:</strong> {playerHold.map(i => cards[i]).join(", ")}</div>
<div><strong>Your RTP:</strong> {(comparison.playerEV * 100).toFixed(1)}%</div>
</div>
<div className="space-y-1">
<div><strong>Optimal Hold:</strong> {best.hold.map(i => cards[i]).join(", ")}</div>
<div><strong>Optimal RTP:</strong> {(comparison.optimalEV * 100).toFixed(1)}%</div>
</div>
<div className="col-span-2 pt-2 border-t">
<div className={`text-center font-bold ${comparison.color}`}>
{comparison.difference <= 0.05 ? 
  "🎉 Excellent choice!" :
  `⚠️  ${comparison.severity}: -${(comparison.difference * 100).toFixed(1)}% RTP loss`
}
</div>
</div>
</div>
);
})()}
</div>
)}
</div>

{/* Hand Information */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<div className="bg-gray-50 rounded-lg p-4">
<h4 className="font-semibold mb-2">📋 Hand Details</h4>
<div className="space-y-1 text-sm">
<div><strong>Current Hand:</strong> {evaluate5(cards, paytable).name}</div>
<div><strong>Current Payout:</strong> {evaluate5(cards, paytable).payout}x</div>
<div><strong>Cards to Hold:</strong> {best.hold.length} cards</div>
<div><strong>RTP:</strong> {(best.ev * 100).toFixed(1)}%</div>
</div>
</div>

<div className="bg-gray-50 rounded-lg p-4">
<h4 className="font-semibold mb-2">🎮 Game Info</h4>
<div className="space-y-1 text-sm">
<div><strong>Variant:</strong> {game}</div>
<div><strong>Royal Flush:</strong> {paytable.ROYAL}x</div>
<div><strong>Full House:</strong> {paytable.FULL_HOUSE}x</div>
<div><strong>Flush:</strong> {paytable.FLUSH}x</div>
</div>
</div>
</div>
</motion.div>
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
</div>
);
}
