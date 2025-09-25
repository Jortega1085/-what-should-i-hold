export const SUITS = ["♠", "♥", "♦", "♣"] as const;
export const RANKS = ["A","K","Q","J","10","9","8","7","6","5","4","3","2"] as const;
export const RANK_ORDER: Record<string, number> = {A:14,K:13,Q:12,J:11,"10":10,T:10,9:9,8:8,7:7,6:6,5:5,4:4,3:3,2:2};

export type Paytable = Record<string, number>;

export interface EvaluatedHand {
  name: string;
  key: string | null;
  payout: number;
}

export function makeDeck(): string[] {
  const deck: string[] = [];
  for (const suit of SUITS) {
    for (const rankValue of RANKS) {
      deck.push(`${rankValue}${suit}`);
    }
  }
  return deck;
}

export const FULL_DECK = makeDeck();

export const HOLD_COMBINATIONS: number[][] = (() => {
  const combos: number[][] = [];
  for (let mask = 0; mask < 32; mask += 1) {
    const hold: number[] = [];
    for (let position = 0; position < 5; position += 1) {
      if (mask & (1 << position)) {
        hold.push(position);
      }
    }
    combos.push(hold);
  }
  return combos;
})();

export function rank(card: string): string {
  return card.length === 3 ? card.slice(0, 2) : card[0];
}

export function suit(card: string): string {
  return card.length === 3 ? card.slice(2) : card.slice(1);
}

function countsBy<T>(values: T[]): Map<T, number> {
  const counts = new Map<T, number>();
  values.forEach(value => counts.set(value, (counts.get(value) || 0) + 1));
  return counts;
}

function isSequential(values: number[]): boolean {
  for (let i = 1; i < values.length; i += 1) {
    if (values[i] !== values[i - 1] - 1) {
      return false;
    }
  }
  return true;
}

function hasAceLowStraight(values: number[]): boolean {
  const valueSet = new Set(values);
  return valueSet.has(14) && valueSet.has(5) && valueSet.has(4) && valueSet.has(3) && valueSet.has(2);
}

function getPaytableValue(paytable: Paytable, key: string, fallbackKey?: string): number {
  if (paytable[key] !== undefined) {
    return paytable[key];
  }
  if (fallbackKey && paytable[fallbackKey] !== undefined) {
    return paytable[fallbackKey];
  }
  return 0;
}

function buildHandName(base: string, detail?: string): string {
  return detail ? `${base} (${detail})` : base;
}

export function evaluateHand(cards: string[], paytable: Paytable): EvaluatedHand {
  const ranks = cards.map(rank);
  const suits = cards.map(suit);
  const rankValues = ranks.map(r => RANK_ORDER[r]);

  const rankCounts = countsBy(ranks);
  const suitCounts = countsBy(suits);
  const counts = Array.from(rankCounts.values()).sort((a, b) => b - a);

  const uniqueValuesDesc = Array.from(new Set(rankValues)).sort((a, b) => b - a);
  const isFlush = Array.from(suitCounts.values()).some(v => v === 5);
  const isStraight = (uniqueValuesDesc.length === 5 && isSequential(uniqueValuesDesc)) || hasAceLowStraight(rankValues);
  const valueSet = new Set(rankValues);
  const isRoyal = isStraight && isFlush && [10, 11, 12, 13, 14].every(v => valueSet.has(v));

  if (isFlush && isRoyal) {
    return { name: "Royal Flush", key: "ROYAL", payout: getPaytableValue(paytable, "ROYAL") };
  }

  if (isFlush && isStraight) {
    return { name: "Straight Flush", key: "STRAIGHT_FLUSH", payout: getPaytableValue(paytable, "STRAIGHT_FLUSH") };
  }

  if (counts[0] === 4) {
    let quadRank = "";
    let kickerRank = "";
    rankCounts.forEach((count, r) => {
      if (count === 4) {
        quadRank = r;
      } else if (count === 1) {
        kickerRank = r;
      }
    });

    if (quadRank === "A") {
      if (["2", "3", "4"].includes(kickerRank) && paytable.FOUR_ACES_WITH_234 !== undefined) {
        return {
          name: buildHandName("Four Aces", `with ${kickerRank}`),
          key: "FOUR_ACES_WITH_234",
          payout: paytable.FOUR_ACES_WITH_234
        };
      }
      if (paytable.FOUR_ACES !== undefined) {
        return {
          name: "Four Aces",
          key: "FOUR_ACES",
          payout: paytable.FOUR_ACES
        };
      }
    }

    if (["2", "3", "4"].includes(quadRank)) {
      if (["A", "2", "3", "4"].includes(kickerRank) && paytable.FOUR_2_4_WITH_A_4 !== undefined) {
        return {
          name: buildHandName(`Four ${quadRank}s`, `with ${kickerRank}`),
          key: "FOUR_2_4_WITH_A_4",
          payout: paytable.FOUR_2_4_WITH_A_4
        };
      }
      if (paytable.FOUR_2_4 !== undefined) {
        return {
          name: `Four ${quadRank}s`,
          key: "FOUR_2_4",
          payout: paytable.FOUR_2_4
        };
      }
    }

    if (paytable.FOUR_5_K !== undefined) {
      return {
        name: `Four ${quadRank}s`,
        key: "FOUR_5_K",
        payout: paytable.FOUR_5_K
      };
    }

    return {
      name: `Four ${quadRank}s`,
      key: "FOUR_KIND",
      payout: getPaytableValue(paytable, "FOUR_KIND")
    };
  }

  if (counts[0] === 3 && counts[1] === 2) {
    return { name: "Full House", key: "FULL_HOUSE", payout: getPaytableValue(paytable, "FULL_HOUSE") };
  }

  if (isFlush) {
    return { name: "Flush", key: "FLUSH", payout: getPaytableValue(paytable, "FLUSH") };
  }

  if (isStraight) {
    return { name: "Straight", key: "STRAIGHT", payout: getPaytableValue(paytable, "STRAIGHT") };
  }

  if (counts[0] === 3) {
    const tripleRank = Array.from(rankCounts.entries()).find(([, count]) => count === 3)?.[0] ?? "";
    return { name: `Three of a Kind (${tripleRank}s)`, key: "THREE_KIND", payout: getPaytableValue(paytable, "THREE_KIND") };
  }

  if (counts[0] === 2 && counts[1] === 2) {
    return { name: "Two Pair", key: "TWO_PAIR", payout: getPaytableValue(paytable, "TWO_PAIR") };
  }

  const hasQualifyingPair = Array.from(rankCounts.entries()).some(([r, count]) => count === 2 && RANK_ORDER[r] >= 11);
  if (hasQualifyingPair) {
    const pairRank = Array.from(rankCounts.entries()).find(([r, count]) => count === 2 && RANK_ORDER[r] >= 11)?.[0] ?? "";
    return {
      name: `Jacks or Better (${pairRank}s)`,
      key: "JacksOrBetter",
      payout: getPaytableValue(paytable, "JacksOrBetter")
    };
  }

  return { name: "Nothing", key: null, payout: 0 };
}

const expectedValueCache = new Map<string, number>();
const paytableKeyCache = new WeakMap<Paytable, string>();

function getPaytableCacheKey(paytable: Paytable): string {
  const cached = paytableKeyCache.get(paytable);
  if (cached) {
    return cached;
  }
  const key = Object.keys(paytable)
    .sort()
    .map(k => `${k}:${paytable[k]}`)
    .join("|");
  paytableKeyCache.set(paytable, key);
  return key;
}

export function expectedValue(cards: string[], hold: number[], paytable: Paytable): number {
  const sortedHandKey = [...cards].sort().join(",");
  const heldCards = hold
    .slice()
    .sort((a, b) => a - b)
    .map(index => cards[index])
    .sort()
    .join(",");
  const cacheKey = `${sortedHandKey}|${heldCards}|${getPaytableCacheKey(paytable)}`;
  const cached = expectedValueCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const keptCards = hold.map(i => cards[i]);
  const drawsNeeded = 5 - keptCards.length;

  if (drawsNeeded === 0) {
    const payout = evaluateHand(cards, paytable).payout;
    expectedValueCache.set(cacheKey, payout);
    return payout;
  }

  const currentCards = new Set(cards);
  const remaining: string[] = [];
  for (const card of FULL_DECK) {
    if (!currentCards.has(card)) {
      remaining.push(card);
    }
  }

  if (remaining.length < drawsNeeded) {
    expectedValueCache.set(cacheKey, 0);
    return 0;
  }

  const finalHand = new Array<string>(5);
  for (let i = 0; i < keptCards.length; i += 1) {
    finalHand[i] = keptCards[i];
  }

  let totalPayout = 0;
  let combinationCount = 0;

  const maxIndex = remaining.length;

  const explore = (nextIndex: number, depth: number) => {
    if (depth === drawsNeeded) {
      const { payout } = evaluateHand(finalHand, paytable);
      totalPayout += payout;
      combinationCount += 1;
      return;
    }

    const slotsLeft = drawsNeeded - depth;
    for (let i = nextIndex; i <= maxIndex - slotsLeft; i += 1) {
      finalHand[keptCards.length + depth] = remaining[i];
      explore(i + 1, depth + 1);
    }
  };

  explore(0, 0);

  const ev = combinationCount === 0 ? 0 : totalPayout / combinationCount;
  expectedValueCache.set(cacheKey, ev);
  return ev;
}

export function enumerateHoldEvs(cards: string[], paytable: Paytable): { hold: number[]; ev: number }[] {
  return HOLD_COMBINATIONS.map(hold => {
    const sortedHold = [...hold].sort((a, b) => a - b);
    return {
      hold: sortedHold,
      ev: expectedValue(cards, sortedHold, paytable)
    };
  }).sort((a, b) => b.ev - a.ev);
}

export function getRandomHand(): string[] {
  const deck = makeDeck();
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.slice(0, 5);
}

export function getOptimalHoldForGame(cards: string[], paytable: Paytable, _game?: string): { hold: number[]; ev: number } {
  const options = enumerateHoldEvs(cards, paytable);
  return options[0] ?? { hold: [], ev: 0 };
}
