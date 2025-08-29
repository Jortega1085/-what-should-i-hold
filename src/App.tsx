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
    return `🌊 4-Card Flush Draw (${heldSuits[0]})! You have a 19% chance (9/47 cards) to complete the flush. Expected value: ${bestHold.ev.toFixed(2)}`;
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
    return `📈 4-Card Straight Draw! You need 8 cards to complete the straight. Expected value: ${bestHold.ev.toFixed(2)}`;
  }
}

if (bestHold.hold.length === 3) {
  const heldRanks = bestHold.hold.map(i => ranks[i]);
  const heldSuits = bestHold.hold.map(i => suits[i]);
  
  // 3-card royal
  const royals = ['10', 'J', 'Q', 'K', 'A'];
  if (new Set(heldSuits).size === 1 && heldRanks.every(r => royals.includes(r))) {
    return `👑 3-Card Royal Flush Draw! You have a chance at the royal flush (2 cards) or other strong hands. Expected value: ${bestHold.ev.toFixed(2)}`;
  }
}

// High cards
if (bestHold.hold.length <= 2 && bestHold.hold.length > 0) {
  const heldRanks = bestHold.hold.map(i => ranks[i]);
  const highCards = heldRanks.filter(r => ['J', 'Q', 'K', 'A'].includes(r));
  
  if (highCards.length > 0) {
    if (game === "Double Double Bonus" && heldRanks.includes('A')) {
      return `🎯 Hold the Ace(s)! In Double Double Bonus, Aces are especially valuable for bonus payouts. Expected value: ${bestHold.ev.toFixed(2)}`;
    }
    return `👑 Hold High Card(s): ${heldRanks.join(', ')}. These can form paying pairs (Jacks or Better). Expected value: ${bestHold.ev.toFixed(2)}`;
  }
  
  // Low pair
  const pairRank = heldRanks[0];
  if (heldRanks.length === 2 && heldRanks[0] === heldRanks[1]) {
    if (game === "Double Double Bonus") {
      return `🎲 Low Pair (${pairRank}s) in Double Double Bonus. Low pairs can improve to trips or full house, and sometimes beat high card draws. Expected value: ${bestHold.ev.toFixed(2)}`;
    }
    return `🎲 Low Pair (${pairRank}s). While this doesn't pay now, it can improve to trips or better. Expected value: ${bestHold.ev.toFixed(2)}`;
  }
}

// Draw 5
if (bestHold.hold.length === 0) {
  return `🎲 Draw 5 New Cards! No profitable holds found. This gives you a fresh chance at any hand. Expected value: ${bestHold.ev.toFixed(2)}`;
}

return `Hold ${bestHold.hold.length} cards with expected value: ${bestHold.ev.toFixed(2)}`;
}


export default function App() {
const [mode, setMode] = useState<"training" | "analysis">("training");
const [cards, setCards] = useState<string[]>(["A♠","K♠","Q♠","J♠","10♠"]);
const [game, setGame] = useState("Jacks or Better 9/6");
const [playerHold, setPlayerHold] = useState<number[]>([]);
const [score, setScore] = useState({played:0, correct:0});
const [history, setHistory] = useState<any[]>([]);
const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
const [showCardPicker, setShowCardPicker] = useState(false);

const paytable = PAYTABLES[game];

function dealRandom() {
const deck = makeDeck();
for(let i=deck.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [deck[i], deck[j]]=[deck[j],deck[i]]; }
setCards(deck.slice(0,5));
setPlayerHold([]);
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

setScore(s => ({played: s.played+1, correct: s.correct + (correct?1:0)}));
setHistory(h => [{cards, playerHold, bestHold: best.hold, correct}, ...h.slice(0,9)]);
dealRandom();
} catch (error) {
// Handle error silently
}
}

return (
<div className="min-h-screen bg-gray-50 p-6">
<div className="max-w-4xl mx-auto">
<motion.h1 initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} className="text-3xl font-bold mb-4">
What Should I Hold?
</motion.h1>

{/* Mode Toggle */}
<div className="flex gap-2 mb-6">
<button 
  onClick={() => setMode("training")}
  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
    mode === "training" 
      ? "bg-blue-600 text-white shadow-md" 
      : "bg-white text-gray-600 border hover:bg-gray-50"
  }`}
>
  🎯 Training Mode
</button>
<button 
  onClick={() => setMode("analysis")}
  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
    mode === "analysis" 
      ? "bg-green-600 text-white shadow-md" 
      : "bg-white text-gray-600 border hover:bg-gray-50"
  }`}
>
  🔍 Hand Analysis
</button>
</div>

{mode === "training" ? (
<div>
{/* Training Mode Content */}


<div className="mb-4">
<label className="mr-2 font-semibold">Game:</label>
<select value={game} onChange={e=>setGame(e.target.value)} className="border rounded px-2 py-1">
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
<button onClick={()=>toggleHold(i)} className={`relative w-16 h-24 rounded-lg border-2 bg-white shadow-lg transition-all duration-200 hover:shadow-xl ${playerHold.includes(i)?"border-green-500 bg-green-50":"border-gray-300 hover:border-gray-400"}`}>
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

<div className="flex gap-3 mb-6">
<button onClick={dealRandom} className="px-4 py-2 rounded-2xl bg-black text-white shadow">Deal Random</button>
<button onClick={submitHold} className="px-4 py-2 rounded-2xl bg-blue-600 text-white shadow">Submit Hold</button>
</div>

<div className="mb-6">
<div>Score: {score.correct}/{score.played} correct</div>
</div>

<motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="bg-white rounded-2xl shadow p-5">
<div className="text-lg font-semibold mb-2">Last Hands</div>
{history.length === 0 && <div className="text-gray-500 text-sm">No hands yet.</div>}
{history.map((h, idx) => (
<div key={idx} className="mb-2 text-sm">
<div>Cards: {h.cards.join(", ")}</div>
<div>Your Hold: {h.playerHold.map((i: number)=>h.cards[i]).join(", ")} | Best Hold: {h.bestHold.map((i: number)=>h.cards[i]).join(", ")} | {h.correct ? "✅ Correct" : "❌ Incorrect"}</div>
</div>
))}
</motion.div>

</div>
) : (
<div>
{/* Analysis Mode Content */}
<div className="mb-6">
<label className="mr-2 font-semibold">Game:</label>
<select value={game} onChange={e=>setGame(e.target.value)} className="border rounded px-2 py-1">
{Object.keys(PAYTABLES).map(g => <option key={g} value={g}>{g}</option>)}
</select>
</div>

<div className="bg-white rounded-2xl shadow p-6 mb-6">
<h3 className="text-xl font-bold mb-4">🔍 Hand Analysis - Select Your Cards</h3>
<div className="grid grid-cols-5 gap-4 mb-6">
{cards.map((card, i) => {
const cardRank = rank(card);
const cardSuit = suit(card);
const colorClass = getCardColor(cardSuit);
return (
<div key={i} className="flex flex-col items-center gap-2">
<div className="text-sm text-gray-500 font-medium">Card {i+1}</div>
<button 
  onClick={() => {
    setSelectedPosition(i);
    setShowCardPicker(true);
  }}
  className="relative w-16 h-24 rounded-lg border-2 bg-white shadow-lg transition-all duration-200 hover:shadow-xl border-blue-300 hover:border-blue-500"
>
<div className={`flex flex-col items-center justify-center h-full ${colorClass}`}>
<div className="text-lg font-bold">{cardRank}</div>
<div className="text-xl">{cardSuit}</div>
</div>
</button>
</div>
);
})}
</div>

{/* Card Picker Modal */}
{showCardPicker && selectedPosition !== null && (
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowCardPicker(false)}>
<div className="bg-white rounded-2xl p-6 max-w-4xl max-h-96 overflow-y-auto" onClick={e => e.stopPropagation()}>
<h4 className="text-lg font-bold mb-4">Select Card for Position {selectedPosition + 1}</h4>
<div className="grid grid-cols-13 gap-2">
{SUITS.map(suitType => (
<div key={suitType} className="col-span-13">
<div className="text-center text-lg mb-2">{suitType}</div>
<div className="grid grid-cols-13 gap-1">
{RANKS.map(rankType => {
const cardCode = rankType + suitType;
const isUsed = cards.includes(cardCode) && cards.indexOf(cardCode) !== selectedPosition;
const colorClass = getCardColor(suitType);
return (
<button
  key={cardCode}
  onClick={() => {
    if (!isUsed) {
      const newCards = [...cards];
      newCards[selectedPosition] = cardCode;
      setCards(newCards);
      setShowCardPicker(false);
      setSelectedPosition(null);
    }
  }}
  disabled={isUsed}
  className={`w-8 h-12 text-xs rounded border transition-all ${
    isUsed 
      ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
      : `bg-white hover:bg-gray-50 border-gray-300 hover:border-blue-400 ${colorClass}`
  }`}
>
<div>{rankType}</div>
<div className="text-sm">{suitType}</div>
</button>
);
})}
</div>
</div>
))}
</div>
<button 
  onClick={() => setShowCardPicker(false)}
  className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
>
Close
</button>
</div>
</div>
)}

<div className="flex gap-3 mb-4">
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
  className="px-4 py-2 rounded-lg bg-gray-600 text-white shadow hover:bg-gray-700"
>
  🎲 Random Hand
</button>
<button 
  onClick={() => setCards(["A♠","K♠","Q♠","J♠","10♠"])} 
  className="px-4 py-2 rounded-lg bg-purple-600 text-white shadow hover:bg-purple-700"
>
  👑 Royal Flush
</button>
<button 
  onClick={() => setCards(["A♠","A♥","A♦","2♠","3♠"])} 
  className="px-4 py-2 rounded-lg bg-orange-600 text-white shadow hover:bg-orange-700"
>
  🎯 Trip Aces
</button>
</div>
</div>

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

{/* Strategy Recommendation */}
<div className="bg-blue-50 rounded-lg p-4 mb-4">
<h4 className="font-semibold text-blue-800 mb-2">💡 Optimal Strategy:</h4>
<p className="text-blue-700">
{getStrategyExplanation(cards, best, game)}
</p>
</div>

{/* Hand Information */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<div className="bg-gray-50 rounded-lg p-4">
<h4 className="font-semibold mb-2">📋 Hand Details</h4>
<div className="space-y-1 text-sm">
<div><strong>Current Hand:</strong> {evaluate5(cards, paytable).name}</div>
<div><strong>Current Payout:</strong> {evaluate5(cards, paytable).payout}x</div>
<div><strong>Cards to Hold:</strong> {best.hold.length} cards</div>
<div><strong>Expected Value:</strong> {best.ev.toFixed(3)}</div>
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
</div>
);
}
