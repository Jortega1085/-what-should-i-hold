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


export default function App() {
const [cards, setCards] = useState<string[]>(["A♠","K♠","Q♠","J♠","10♠"]);
const [game, setGame] = useState("Jacks or Better 9/6");
const [playerHold, setPlayerHold] = useState<number[]>([]);
const [score, setScore] = useState({played:0, correct:0});
const [history, setHistory] = useState<any[]>([]);

const paytable = PAYTABLES[game];

function dealRandom() {
const deck = makeDeck();
for(let i=deck.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [deck[i], deck[j]]=[deck[j],deck[i]]; }
setCards(deck.slice(0,5));
setPlayerHold([]);
}

const best = useMemo(() => {
try {
// Simplified optimal play logic
const currentHand = evaluate5(cards, paytable);

// If we already have a paying hand that's strong, hold all
if (currentHand.key === "ROYAL" || currentHand.key === "STRAIGHT_FLUSH" || 
    currentHand.key === "FOUR_KIND" || currentHand.key === "FULL_HOUSE" || 
    currentHand.key === "FLUSH" || currentHand.key === "STRAIGHT") {
  return { hold: [0, 1, 2, 3, 4], ev: currentHand.payout };
}

// For three of a kind - hold the three of a kind
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

// For pairs - hold the pair
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

// Check for 4-card flush
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

// Check for high cards (Jacks or better)
const highCards: number[] = [];
const ranks = cards.map(rank);
ranks.forEach((r, i) => {
  const value = RANK_ORDER[r] || 0;
  if (value >= 11) { // Jack, Queen, King, Ace
    highCards.push(i);
  }
});

if (highCards.length > 0) {
  return { hold: highCards, ev: 0.5 };
}

// Default: hold nothing and draw 5 new cards
return { hold: [], ev: 0.3 };

} catch (error) {
return { hold: [], ev: 0 };
}
}, [cards, paytable]);

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
<motion.h1 initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} className="text-3xl font-bold mb-2">
What Should I Hold?
</motion.h1>


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
</div>
);
}
